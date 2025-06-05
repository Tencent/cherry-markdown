import { describe, expect, vi, test, beforeEach, it } from 'vitest';
import { diff } from '@vitest/utils/diff';
import CherryEngine from '../../../src/index.engine.core';
import suites from '../suites/commonmark.spec.json';

const cherryEngine = new CherryEngine({
  engine: {
    global: {
      classicBr: false,
    },
    syntax: {
      header: {
        anchorStyle: 'none',
      },
    },
  },
});

const cleanHTML = (raw) => {
  // 处理换行回车
  let html = raw.replace(/\s*<br>\s*/gm, '\n');
  html = html.replace(/\s*<br \/>\s*/gm, '\n');
  html = html.replace(/(?<=>)\n(?=<)/gm, '');
  // 清理属性
  html = html.replace(/(?<=<)([^\/\s>]+)[^<]*?(?=>)/gm, (match, tag) => tag);
  // 清理首尾的多余空格
  html = html.trim();
  return html;
};

const formatOutput = (message, input, standard, result) => {
  return `
    ${message}
    input: ${input}
    standard: ${standard}
    cherry: ${result}
    standard(cleaned): ${cleanHTML(standard)}
    cherry(cleaned): ${cleanHTML(result)}
  `;
};

expect.extend({
  matchHTML(result, standard, input) {
    const resultHTML = cleanHTML(result);
    const standandHTML = cleanHTML(standard);
    const pass = standandHTML === resultHTML;
    const message = diff(standandHTML, resultHTML);
    return {
      pass,
      message: () => formatOutput(message, input, standard, result),
    };
  },
});

describe('engine', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });
  it.each(suites)('CommonMark-$example', (item) => {
     // @ts-ignore
    const cherryHtml=cherryEngine.makeHtml(item.markdown)
   
     expect(cherryHtml).toMatchSnapshot();
  });
 
});
