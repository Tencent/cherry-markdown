// @vitest-environment node
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { compile } from 'sass';
import { describe, expect, it } from 'vite-plus/test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const stylesheet = postcss.parse(compile(resolve(projectRoot, 'src/sass/index.scss')).css);

const getDeclarations = (selector) => {
  let declarations;

  stylesheet.walkRules((rule) => {
    if (rule.selectors.includes(selector)) {
      declarations = Object.fromEntries(
        rule.nodes.filter((node) => node.type === 'decl').map((node) => [node.prop, node.value]),
      );
    }
  });

  expect(declarations, selector).toBeDefined();
  return declarations;
};

describe('toolbar alignment style contract', () => {
  it('centers dropdown icons and text without inline baseline alignment', () => {
    expect(getDeclarations('.cherry-dropdown-item')).toMatchObject({
      display: 'flex',
      'align-items': 'center',
    });
    expect(getDeclarations('.cherry-dropdown-item .ch-icon')).toMatchObject({
      'flex-shrink': '0',
    });
    expect(getDeclarations('.cherry-dropdown-item i.ch-icon')).toMatchObject({
      display: 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
    });
    expect(getDeclarations('.cherry-dropdown-item .ch-icon')['vertical-align']).toBeUndefined();
    expect(getDeclarations('.cherry-dropdown-item .ch-icon::before')['vertical-align']).toBeUndefined();
  });
});
