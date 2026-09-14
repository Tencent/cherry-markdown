import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import * as sass from 'sass';
import { describe, expect, it } from 'vite-plus/test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

describe('CodeMirror line wrapping style contract', () => {
  it('keeps break-spaces on editable content so Tab is handled only by CodeMirror', () => {
    const { css } = sass.compile(resolve(projectRoot, 'src/sass/index.scss'));
    const whiteSpaceValues = [];

    postcss.parse(css).walkRules((rule) => {
      if (rule.selectors?.some((selector) => selector.trim() === '.cherry .cm-editor .cm-content')) {
        rule.walkDecls('white-space', (declaration) => {
          whiteSpaceValues.push(declaration.value);
        });
      }
    });

    expect(whiteSpaceValues).toContain('break-spaces');
    expect(whiteSpaceValues).not.toContain('pre-wrap');
  });
});
