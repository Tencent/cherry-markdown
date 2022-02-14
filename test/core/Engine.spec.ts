import fs from 'fs'
import util from 'util';
import path from 'path';
import Cherry from '../../src/index';
import suites from '../suites/commonmark.spec.json';

const TEST_PATH = '../suites/engine.md';
const readFile = (fileName) => util.promisify(fs.readFile)(fileName, 'utf8');
const cherry = new Cherry({});

describe('engine', () => {
  test('engine.md', () => {
    return readFile(path.join(__dirname, TEST_PATH)).then((data) => {
      // need to ignore error while accessing engine(private)
      // @ts-ignore
      expect(cherry.engine.makeHtml(data)).toMatchSnapshot();
    });
  });
  test('commonmark', () => {
    suites.forEach((item) => {
      // @ts-ignore
      expect(cherry.engine.makeHtml(item.markdown)).toBe(item.html);
    });
  });
});
