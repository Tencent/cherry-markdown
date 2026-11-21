// @vitest-environment node
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import * as sass from 'sass';
import { describe, expect, it } from 'vite-plus/test';
import { aliases, readThemeColor } from '../../src/theme-compat/colors.js';

const sassDir = new URL('../../src/sass/', import.meta.url);
const themes = ['default', 'dark', 'abyss', 'green', 'red', 'gray', 'violet', 'blue'];
const roles = {
  '--primary-color': '--color-brand-primary',
  '--secondary-color': '--color-bg-active',
  '--base-font-color': '--color-text-primary',
  '--base-editor-bg': '--color-bg-canvas',
  '--base-previewer-bg': '--color-bg-surface',
  '--base-border-color': '--color-border-default',
};
const linkRoles = {
  '--md-link-color': '--color-text-link',
  '--md-link-hover-color': '--color-brand-primary-hover',
};

function themeTokens(css, selector) {
  const tokens = {};
  css.walkRules((rule) => {
    if (rule.selectors.includes(selector)) {
      rule.walkDecls(/^--/, (declaration) => {
        tokens[declaration.prop] = declaration.value;
      });
    }
  });
  return tokens;
}

function compile(entry) {
  return postcss.parse(sass.compile(fileURLToPath(new URL(entry, sassDir))).css);
}

describe('theme token contract', () => {
  it('shares theme roles without adding global or bare preview defaults', () => {
    const editor = compile('index.scss');
    const preview = compile('markdown_pure.scss');
    const defaults = themeTokens(editor, '.cherry');
    for (const [legacy, role] of Object.entries({
      ...roles,
      ...linkRoles,
      '--base-sub-font-color': '--color-text-secondary',
    })) {
      expect(defaults[role]).toBeTruthy();
      expect(defaults[legacy]).toBe(`var(${role})`);
    }
    for (const theme of themes) {
      const editorSelector = `.cherry.theme__${theme}`;
      const tokens = themeTokens(editor, editorSelector);
      const previewTokens = themeTokens(preview, editorSelector);
      for (const [legacy, role] of Object.entries({ ...roles, ...linkRoles })) {
        expect(tokens[role]).toBeTruthy();
        expect(tokens[legacy]).toBe(`var(${role})`);
        expect(previewTokens[role]).toBe(tokens[role]);
        expect(previewTokens[legacy]).toBe(tokens[legacy]);
      }
    }
    const barePreview = themeTokens(preview, '.cherry-markdown');
    expect(themeTokens(preview, ':root')).not.toHaveProperty('--oc-blue-6');
    expect(themeTokens(preview, ':root')).not.toHaveProperty('--spacing-md');
    expect(themeTokens(editor, ':root')).not.toHaveProperty('--color-brand-primary');
    expect(themeTokens(preview, '.cherry')).not.toHaveProperty('--color-brand-primary');
    expect(themeTokens(preview, '.cherry')).not.toHaveProperty('--base-previewer-bg');
    expect(barePreview).not.toHaveProperty('--base-previewer-bg');
  }, 20_000);

  it('keeps Sass and JavaScript aliases aligned and emits use-site fallbacks', () => {
    const css = compile('index.scss');
    for (const theme of themes) {
      const definitions = themeTokens(css, `.cherry.theme__${theme}`);
      for (const [old, role] of Object.entries({ ...roles, ...linkRoles })) {
        expect(definitions[old]).toBe(`var(${role})`);
      }
    }
    const defaults = themeTokens(css, '.cherry');
    for (const [role, old] of Object.entries(aliases)) {
      expect(defaults[old]).toBe(`var(${role})`);
    }
    expect(css.toString()).toContain('var(--md-link-hover-color, var(--color-brand-primary-hover))');
  }, 20_000);

  it('resolves chart colors with the same legacy priority as CSS', () => {
    const read = (name) => ({ '--primary-color': 'red', '--color-brand-primary': 'blue' })[name];
    expect(readThemeColor('--color-brand-primary', read, 'black')).toBe('red');
    const readSemanticOnly = (name) => (name === '--color-brand-primary' ? 'blue' : '');
    expect(readThemeColor('--color-brand-primary', readSemanticOnly, 'black')).toBe('blue');
    expect(readThemeColor('--color-brand-primary', () => '', 'black')).toBe('black');
  });
});
