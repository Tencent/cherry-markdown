import { diff } from 'jest-diff';
import Cherry from '../../src/index';
import suites from '../suites/commonmark.spec.json';

const cherry = new Cherry({
  engine: {
    global: {
      classicBr: false
    }
  }
});

function cleanHTML (raw) {
  // 处理换行回车
  let html = raw.replace(/\s*<br>\s*/gm, '\n');
  html = html.replace(/(?<=>)\n(?=<)/gm, '');
  // 清理属性
  html = html.replace(/(?<=<)([^\/\s>]+)[^<]*?(?=>)/gm, (match, tag) => tag);
  // 清理标题内的a标签锚点
  html = html.replace(/(?<=<h\d>)(.*?)(<a><\/a>)(.*?)(?=<\/h\d>)/, (m, a1, a2, a3) => a1 + a3);
  return html;
}

expect.extend({
  matchHTML(result, standard, input) {
    const resultHTML = cleanHTML(result);
    const standandHTML = cleanHTML(standard)
    const pass = standandHTML === resultHTML;
    const message = diff(standandHTML, resultHTML);
    return {
      pass,
      message: () => `
        ${message}
        input: ${input}
        standard: ${standard}
        cherry: ${result}
      `,
    };
  },
});

describe('engine', () => {
  suites.forEach((item, index) => {
    test(`commonmark-${index}`, () => {
    // @ts-ignore
      expect(cherry.engine.makeHtml(item.markdown)).matchHTML(item.html, item.markdown);
    });
  });
});
