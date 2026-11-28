import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import postcss from 'postcss';

const cherry = postcss.parse(
  readFileSync(new URL(import.meta.resolve('cherry-markdown/dist/cherry-markdown.css')), 'utf8'),
);
const iconFamily = 'cherry-milkdown-icons';
cherry.walkRules((rule) => {
  if (rule.selectors.includes(':root')) {
    rule.selectors = rule.selectors.map((selector) => (selector === ':root' ? ':where(.cherry-milkdown)' : selector));
  }
});
cherry.walkDecls('font-family', (declaration) => {
  if (!/^["']?ch-icon["']?$/.test(declaration.value)) return;
  if (declaration.parent.type === 'atrule' && declaration.parent.name === 'font-face') {
    declaration.parent.remove();
  } else {
    declaration.value = iconFamily;
  }
});

const prosemirror = readFileSync(
  new URL(import.meta.resolve('@milkdown/kit/prose/view/style/prosemirror.css')),
  'utf8',
);
const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const icons = readFileSync(new URL(import.meta.resolve('cherry-markdown/dist/fonts/ch-icon.woff2'))).toString('base64');
const output = new URL('../src/generated/cherry-styles.js', import.meta.url);
writeFileSync(
  output,
  [
    `export const styles = ${JSON.stringify([cherry.toString(), prosemirror, styles].join('\n'))};`,
    `export const iconFamily = ${JSON.stringify(iconFamily)};`,
    `export const icons = ${JSON.stringify(icons)};`,
    '',
  ].join('\n'),
);
if (process.argv.includes('--dist')) {
  mkdirSync(new URL('../dist/generated/', import.meta.url), { recursive: true });
  copyFileSync(output, new URL('../dist/generated/cherry-styles.js', import.meta.url));
}
