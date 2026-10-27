import { compileString } from 'sass';
import postcss from 'postcss';
import { fileURLToPath } from 'node:url';

const sassRoot = fileURLToPath(new URL('../src/sass/', import.meta.url));
export const themeNames = ['default', 'dark', 'blue', 'green', 'red', 'violet', 'gray', 'abyss'];
const selected = [
  '--md-heading-color',
  '--md-paragraph-color',
  '--md-link-color',
  '--md-inline-code-color',
  '--md-inline-code-bg',
  '--md-blockquote-bg',
  '--md-blockquote-border',
  '--md-blockquote-color',
  '--md-table-border',
  '--md-hr-border',
  '--base-previewer-bg',
  '--base-font-color',
  '--base-sub-font-color',
  '--base-border-color',
  '--primary-color',
  '--secondary-color',
  '--font-size-md',
  '--font-size-sm',
  '--font-family-sans',
  '--font-family-mono',
  '--md-paragraph-line-height',
  '--spacing-lg',
  '--spacing-md',
  '--spacing-xl',
  '--radius-md',
  '--accordion-bg',
  '--accordion-border',
  '--accordion-radius',
  '--accordion-shadow',
  '--accordion-summary-bg',
  '--accordion-summary-color',
  '--accordion-body-bg',
  '--accordion-body-color',
  '--accordion-body-border',
];

/** Compile the existing Web theme sources; never maintain a second native color table. */
export function collectSemanticThemes() {
  return Object.fromEntries(
    themeNames.map((theme) => {
      const css = compileString(
        `@use 'variables/index'; @use 'markdown'; @use 'prism/default' as prism; @use 'themes/${theme}';`,
        {
          loadPaths: [sassRoot],
          logger: { warn() {} },
        },
      ).css;
      const variables = new Map();
      const rules = postcss.parse(css);
      rules.walkRules((rule) => {
        if (
          rule.selectors.some(
            (selector) =>
              selector === ':root' ||
              selector === '.cherry' ||
              selector === `.cherry.theme__${theme}` ||
              // Previewer uses `cherry-markdown dark`, not `cherry-markdown theme__dark`.
              selector === `.cherry-markdown.${theme}`,
          )
        )
          rule.walkDecls(/^--/, (declaration) => variables.set(declaration.prop, declaration.value));
      });
      const resolveText = (text, seen = new Set()) => {
        let result = text;
        while (result.includes('var(')) {
          const next = result.replace(/var\((--[\w-]+)(?:,\s*([^()]*))?\)/g, (_, name, fallback) =>
            variables.has(name)
              ? resolveValue(name, seen)
              : (fallback ??
                (() => {
                  throw new Error(`Unresolved Cherry variable ${name}`);
                })()),
          );
          if (next === result) throw new Error(`Unresolved Cherry style value: ${result}`);
          result = next;
        }
        return result;
      };
      const resolveValue = (name, seen = new Set()) => {
        if (seen.has(name) || !variables.has(name))
          throw new Error(`Unresolved Cherry theme variable: ${theme}/${name}`);
        return resolveText(variables.get(name), new Set([...seen, name]));
      };
      const property = (selector, name) => {
        let value;
        rules.walkRules((rule) => {
          if (rule.selectors.includes(selector))
            rule.walkDecls(name, (declaration) => {
              value = declaration.value;
            });
        });
        if (value === undefined) throw new Error(`Missing Cherry style ${selector}/${name}`);
        return resolveText(value);
      };
      const tokens = Object.fromEntries(selected.map((name) => [name, resolveValue(name)]));
      for (const kind of ['primary', 'info', 'warning', 'danger', 'success']) {
        for (const part of ['bg', 'border-color', 'title-bg', 'title-color', 'body-bg', 'body-color'])
          tokens[`--native-panel-${kind}-${part}`] = property(`.cherry-panel__${kind}`, `--panel-${part}`);
      }
      for (const type of ['comment', 'keyword', 'string', 'number', 'operator', 'punctuation', 'function'])
        tokens[`--native-code-${type}`] = property(`.token.${type}`, 'color');
      tokens['--native-code-bg'] = property('pre[class*=language-]', 'background');
      tokens['--native-panel-radius'] = property('.cherry-panel', 'border-radius');
      return [theme, tokens];
    }),
  );
}

export function semanticThemePlugin() {
  const virtual = '\0cherry-semantic-theme';
  return {
    name: 'cherry-semantic-theme',
    resolveId(id) {
      if (id === 'virtual:cherry-semantic-theme') return virtual;
    },
    load(id) {
      if (id === virtual) return `export default ${JSON.stringify(collectSemanticThemes())};`;
    },
  };
}
