import List from '../../../src/core/hooks/List';
import { hashHex } from '../../../src/utils/hash';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
