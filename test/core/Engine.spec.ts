import fs from 'fs'
import util from 'util';
import path from 'path';
import { diff } from 'jest-diff';
import Cherry from '../../src/index';
import suites from '../suites/commonmark.spec.json';

const TEST_PATH = '../suites/engine.md';
const readFile = (fileName) => util.promisify(fs.readFile)(fileName, 'utf8');
const cherry = new Cherry({
  engine: {
    global: {
      classicBr: false
    }
  }
});

expect.extend({
  matchHTML(result, standard) {
    const resultWithoutAttr = result.replace(/\s*<br>\s*/gm, '\n').replace(/(?<=<)([^\/\s>]+)[^<]*?(?=>)/gm, (match, tag) => {
      return tag;
    }).replace('/\s*<p>&nbsp;</p>\s*/gm', '').replace(/<a>.*<\/a>/, '').replace(/(?<=>)\n(?=<)/gm, '');;
    const standardWithoutAttr = standard.replace(/(?<=<)([^\/\s>]+)[^<]*?(?=>)/gm, (match, tag) => {
      return tag;
    }).replace(/\s*<br>\s*/gm, '\n').replace(/(?<=>)\n(?=<)/gm, '');
    const pass = standardWithoutAttr === resultWithoutAttr;
    const message = pass ? '' : diff(standardWithoutAttr, resultWithoutAttr) + result;
    return {
      pass,
      message: () => message,
    };
  },
});

describe('engine', () => {
  // test('engine.md', () => {
  //   return readFile(path.join(__dirname, TEST_PATH)).then((data) => {
  //     // need to ignore error while accessing engine(private)
  //     // @ts-ignore
  //     expect(cherry.engine.makeHtml(data)).toMatchSnapshot();
  //   });
  // });
  suites.forEach((item, index) => {
    test(`commonmark-${index}`, () => {
    // @ts-ignore
      expect(cherry.engine.makeHtml(item.markdown)).matchHTML(item.html);
    });
  });
});
