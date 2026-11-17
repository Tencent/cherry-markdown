import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractImagePattern } from './extract-image-pattern.mjs';

test('extracts the expression used by alt.match instead of the first literal', () => {
  assert.equal(extractImagePattern('{ const ignored = /other/; return alt.match(/target/gi); }', 'example'), '/target/gi');
  assert.equal(extractImagePattern('{ const ignored = /other/; const rule = /target/g; return alt.match(rule); }', 'example'), '/target/g');
});

test('rejects ambiguous or unsupported patterns', () => {
  for (const body of [
    '{ alt.match(/one/); alt.match(/two/); }',
    '{ const rule = makeRule(); return alt.match(rule); }',
    '{ return alt.match(externalRule); }',
    '{ let rule = /one/; rule = /two/; return alt.match(rule); }',
    '{ const rule = /one/; { const rule = /two/; return alt.match(rule); } }',
  ]) assert.throws(() => extractImagePattern(body, 'example'));
});
