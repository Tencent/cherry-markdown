import List from '../../../src/core/hooks/List';

const list1 = `
- 1
- 2
  - 2.1
  - 2.2
- 3
  + 3.1
- 4
  * 4.2
`;

const list2 = `
- 1
  - 2
       - 2.1
    - 2.2
 - 3
          + 3.1
 - 4
* 4.2
`;

const listHook = new List({ config: {}});

describe('core/hooks/list', () => {
  it('checklist replace', () => {
    const cases = [list1, list2];
    cases.forEach((item) => {
      expect(listHook.$wrapList(item, '1', 1, (text) => ({ html: text }))).toMatchSnapshot();
    });
  });
});
