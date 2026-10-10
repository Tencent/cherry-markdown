import List from '../../../src/core/hooks/List';
import CherryEngine from '../../../src/index.engine.core';
import { hashHex } from '../../../src/utils/hash';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

interface ListConfig {
  indentSpace?: number;
  listNested?: boolean;
}

const sentenceMake = (text: string) => ({ html: text });

function createList(config?: ListConfig) {
  const hook = new List({ config });
  Object.defineProperty(hook, '$engine', {
    value: { hash: (text: string) => hashHex(text) },
  });
  return hook;
}

function renderList(markdown: string, config?: ListConfig) {
  const hook = createList(config);
  return hook.restoreCache(hook.makeHtml(markdown, sentenceMake));
}

const cases: string[] = [];
cases[0] = `
- 1
- 2
  - 2.1
  - 2.2
- 3
  + 3.1
- 4
  * 4.2
`;

cases[1] = `
- 1
  - 2
       - 2.1
    - 2.2
 - 3
          + 3.1
 - 4
* 4.2
`;

cases[2] = `
- 1
1. test

- 1.1
   - 1.1.2
       - blank
  - 1.2
 - 2
          + blank
      - 2.1
	* 2.2
 1. test
   2. 2
`;

cases[3] = `
1. test
	2. test
1. test
   一. test
   1. test
   
   
   a. test
- test
`;

cases[4] = `
- [ ] checklist 1
- test
  - [x] checklist 2
 - [ ] checklist 3
 - test
      - [ ] checklist 4
`;

describe('core/hooks/list', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('list hook', () => {
    const listHook = createList({ indentSpace: 2 });

    cases.forEach((item) => {
      listHook.makeHtml(item, sentenceMake);
      expect(listHook.cache.get(listHook.sign)?.content).toMatchSnapshot();
    });
  });

  it('nests a same-level list when listNested changes the marker type', () => {
    const html = renderList('- parent\n1. ordered child', { indentSpace: 2, listNested: true });
    const container = document.createElement('div');
    container.innerHTML = html;

    expect(container.querySelectorAll(':scope > ul')).toHaveLength(1);
    expect(container.querySelector('ul > li > ol > li')?.textContent).toBe('ordered child');
  });

  it('returns no subtree HTML for a leaf and counts text without line endings', () => {
    const hook = createList({ indentSpace: 2 });
    hook.buildTree('- leaf', sentenceMake);

    expect(hook.renderTree(1)).toBe('');
    expect(hook.$getLineNum('leaf')).toBe(0);
  });
});

// Compare visible markup while retaining source-specific attributes in actual output.
const visibleHTML = (container: HTMLElement) => {
  const copy = container.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('[data-lines], [data-sign]').forEach((node) => {
    node.removeAttribute('data-lines');
    node.removeAttribute('data-sign');
  });
  return copy.innerHTML;
};
const renderEngine = (markdown: string, classicBr = false) => {
  const engine: any = new CherryEngine({ engine: { global: { classicBr } } });
  const container = document.createElement('div');
  container.innerHTML = engine.makeHtml(markdown);
  return container;
};

describe('列表显示不区分 tight / loose', () => {
  it.each([
    ['无序列表', '- a\n- b', '- a\n\n- b'],
    ['有序列表', '3. a\n4. b', '3. a\n\n4. b'],
    ['任务列表', '- [ ] a\n- [x] b', '- [ ] a\n\n- [x] b'],
    ['中文列表', '一. a\n二. b', '一. a\n\n二. b'],
    ['嵌套列表', '- a\n  - b\n  - c\n- d', '- a\n\n  - b\n\n  - c\n\n- d'],
    ['引用内列表', '> - a\n> - b', '> - a\n>\n> - b'],
    ['列表内容续行', '- a\n  b\n- c', '- a\n\n  b\n\n- c'],
    ['带空格的空行', '- a\n- b', '- a\n  \n- b'],
    ['行内格式', '- **a**\n- `b`', '- **a**\n\n- `b`'],
    ['空列表项', '- a\n- \n- b', '- a\n\n- \n\n- b'],
  ])('%s', (_name, compact, spaced) => {
    for (const classicBr of [false, true]) {
      expect(visibleHTML(renderEngine(spaced, classicBr))).toBe(visibleHTML(renderEngine(compact, classicBr)));
    }
  });

  it('去除视觉空行后仍保留源文件行数', () => {
    const compact = renderEngine('- a\n- b');
    const spaced = renderEngine('- a\n\n- b');
    expect(Number(spaced.querySelector('ul')?.getAttribute('data-lines'))).toBe(
      Number(compact.querySelector('ul')?.getAttribute('data-lines')) + 1,
    );
  });

  it.each([
    ['普通段落', '- a\n\ntext\n\n- b', 'p', 'text'],
    ['标题', '- a\n\n# Heading\n\n- b', 'h1', 'Heading'],
    ['分隔线', '- a\n\n---\n\n- b', 'hr', ''],
    ['代码块', '- a\n\n```\n- literal\n```\n\n- b', 'pre', '- literal'],
    ['引用', '- a\n\n> quoted\n\n- b', 'blockquote', 'quoted'],
  ])('保留两个列表之间的%s边界', (_name, source, separator, text) => {
    const container = renderEngine(source);
    expect(container.querySelectorAll(':scope > ul')).toHaveLength(2);
    expect(container.querySelectorAll(':scope > ul > li')).toHaveLength(2);
    expect(container.querySelector(`:scope > ${separator}`)?.textContent?.trim()).toBe(text);
  });

  it('空行隔开的有序列表与无序列表保持各自类型', () => {
    const container = renderEngine('- a\n\n3. b');
    expect(container.querySelectorAll(':scope > ul')).toHaveLength(1);
    expect(container.querySelectorAll(':scope > ol')).toHaveLength(1);
    expect(container.querySelector('ol')?.getAttribute('start')).toBe('3');
  });

  it('引用内的普通段落分开两个列表', () => {
    const container = renderEngine('> - a\n>\n> text\n>\n> - b');
    expect(container.querySelectorAll('blockquote > ul')).toHaveLength(2);
    expect(container.querySelector('blockquote > p')?.textContent).toBe('text');
  });

  it('不删除代码块内容中的空行', () => {
    const container = renderEngine('```\n- a\n\n- b\n```');
    expect(container.querySelector('code')?.textContent).toContain('- a\n\n- b');
    expect(container.querySelector('ul')).toBeNull();
  });
});

describe('多个空行建立列表边界', () => {
  it.each([3, 4, 5])('%i 个换行符分开两个列表', (newlines) => {
    for (const classicBr of [false, true]) {
      const container = renderEngine(`- a${'\n'.repeat(newlines)}- b`, classicBr);
      expect(container.querySelectorAll(':scope > ul')).toHaveLength(2);
      expect([...container.querySelectorAll(':scope > ul')].map((list) => list.textContent)).toEqual(['a', 'b']);
    }
  });
});
