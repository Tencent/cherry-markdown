import List from '../../../src/core/hooks/List';
import md5 from 'md5';

const cases = []
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

const listHook = new List({ config: {
  indentSpace: 2,
}});

Object.defineProperty(listHook, '$engine', {
  value: { md5 },
});

describe('core/hooks/list', () => {
  it('list hook', () => {
    cases.forEach((item) => {
      listHook.makeHtml(item, (text) => ({ html: text }));
      expect(listHook.cache[listHook.sign].content).toMatchSnapshot();
    });
  });
});
