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
  '--md-paragraph-line-height',
  '--spacing-lg',
  '--spacing-xl',
  '--radius-md',
];

/** Compile the existing Web theme sources; never maintain a second native color table. */
export function collectSemanticThemes() {
  return Object.fromEntries(
    themeNames.map((theme) => {
      const css = compileString(`@use 'variables/index'; @use 'themes/${theme}';`, {
        loadPaths: [sassRoot],
        logger: { warn() {} },
      }).css;
      const variables = new Map();
      postcss.parse(css).walkDecls(/^--/, (declaration) => variables.set(declaration.prop, declaration.value));
      const resolveValue = (name, seen = new Set()) => {
        if (seen.has(name) || !variables.has(name))
          throw new Error(`Unresolved Cherry theme variable: ${theme}/${name}`);
        return variables
          .get(name)
          .replace(/var\((--[\w-]+)\)/g, (_, next) => resolveValue(next, new Set([...seen, name])));
      };
      return [theme, Object.fromEntries(selected.map((name) => [name, resolveValue(name)]))];
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
