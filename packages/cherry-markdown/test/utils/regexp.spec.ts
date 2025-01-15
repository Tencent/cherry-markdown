import { URL_INLINE_NO_SLASH } from '../../src/utils/regexp';

describe('utils/regexp', () => {
  it('ip address', () => {
    const cases = [
      {
        str: 'http://192.168.1.100',
        match: '192.168.1.100',
      },
      {
        str: 'http://192.168.1.300',
        match: '192.168.1.30',
      },
      {
        str: 'http://192.168.291.100',
        match: null,
      },
    ];
    cases.forEach((item) => {
      const match = item.str.match(URL_INLINE_NO_SLASH);
      if (!item.match) {
        expect(match).toBe(null);
      } else {
        expect(match[0]).toBe(item.match);
      }
    });
  });
});
