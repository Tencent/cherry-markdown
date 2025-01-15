const { default: CherryEngine } = require('../dist/cherry-markdown.engine.core');
const fs = require('fs');
const path = require('path');

const engine = new CherryEngine();
const markdownText = fs.readFileSync(path.resolve(__dirname, './example.md'), {
  encoding: 'utf8',
});

console.log(engine.makeHtml(markdownText));
