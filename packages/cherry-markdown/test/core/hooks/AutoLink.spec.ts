import AutoLink from '../../../src/core/hooks/AutoLink';

const autoLinkHook = new AutoLink({ config: {}, globalConfig: {}});

describe('core/hooks/autolink', () => {
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
      expect(autoLinkHook.isLinkInHtmlAttribute(item.str, item.index, item.length)).toBe(true);
    });
  });
});
