import { makeChecklist } from '../../../src/core/hooks/List';
import { expect } from 'chai';

const list1 = '- [x] test';

describe('core/hooks/list', () => {
  it('checklist replace', () => {
    const cases = [
      {
        str: list1,
      },
    ];
    cases.forEach((item) => {
      expect(makeChecklist(item.str)).to.be.equal('- <span class="ch-icon ch-icon-check"></span> test');
    });
  });
});
