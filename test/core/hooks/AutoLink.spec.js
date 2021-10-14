const AutoLink = require('../../../src/core/hooks/AutoLink').default;
const { expect } = require('chai');

const autoLinkHook = new AutoLink({});

describe('static name required', () => {
  it('nameTest', () => {
    expect(AutoLink.HOOK_NAME).to.be.equal('autoLink');
  });
});

describe('autolink hook util function test', () => {
  it('isLinkInHtmlAttribute', () => {
    const cases = [
      {
        str: '<a href="https://cherry.editor.com">link in attribute</a>',
        index: 9,
        length: 25,
      },
      {
        str: "<a href='https://cherry.editor.com'>link in attribute</a>",
        index: 9,
        length: 25,
      },
      {
        str: '<a href=https://cherry.editor.com>link in attribute</a>',
        index: 8,
        length: 25,
      },
    ];
    cases.forEach((item) => {
      expect(autoLinkHook.isLinkInHtmlAttribute(item.str, item.index, item.length)).to.be.equal(true);
    });
  });
});
