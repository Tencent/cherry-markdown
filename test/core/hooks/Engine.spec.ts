import * as fs from 'fs'
import * as util from 'util';
import * as path from 'path';
import Cherry from '../../../src/index';

const TEST_PATH = '../../../examples/markdown/test.md';
const readFile = (fileName) => util.promisify(fs.readFile)(fileName, 'utf8');
const cherry = new Cherry({});

describe('engine', () => {
  test('makeHtml', () => {
    return readFile(path.join(__dirname, TEST_PATH)).then((data) => {
      // need to ignore error while accessing engine(private)
      // @ts-ignore
      expect(cherry.engine.makeHtml(data)).toMatchSnapshot();
    });
  });
});
