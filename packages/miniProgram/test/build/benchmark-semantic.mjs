import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import CherryStream from '../../dist/miniProgram.esm.js';

const prefix = Array.from({ length: 1000 }, (_, index) => `Paragraph ${index}: stable content.`).join('\n\n');
const incremental = new CherryStream();
const full = new CherryStream({ incremental: false });
let source = `${prefix}\n\nActive tail`;
incremental.setMarkdown(source);
full.setMarkdown(source);
const times = { incremental: [], full: [] };
const characters = { incremental: 0, full: 0 };
for (let index = 0; index < 20; index++) {
  source += ` chunk${index}`;
  let start = performance.now();
  const actual = incremental.setMarkdown(source);
  times.incremental.push(performance.now() - start);
  characters.incremental += incremental.getParseStats().parsedCharacters;
  start = performance.now();
  const expected = full.setMarkdown(source);
  times.full.push(performance.now() - start);
  characters.full += full.getParseStats().parsedCharacters;
  assert.deepEqual(actual, expected);
}
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
console.log(
  JSON.stringify(
    {
      environment: 'Local Node; parser and view-data generation only, no device rendering',
      prefixParagraphs: 1000,
      measuredAppends: 20,
      finalSourceLength: source.length,
      parsedCharacters: characters,
      medianMilliseconds: { incremental: median(times.incremental), full: median(times.full) },
      finalParseStats: incremental.getParseStats(),
      allViewsEqual: true,
    },
    null,
    2,
  ),
);
