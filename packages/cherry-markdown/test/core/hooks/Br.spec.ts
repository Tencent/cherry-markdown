import { beforeEach, describe, expect, it, vi } from 'vitest';
import Br from '../../../src/core/hooks/Br';

const isBrowserMock = vi.hoisted(() => vi.fn(() => true));

vi.mock('../../../src/utils/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/utils/env')>();
  return { ...actual, isBrowser: isBrowserMock };
});

function createBr(classicBr: boolean) {
  return new Br({ globalConfig: { classicBr } });
}

describe('core/hooks/Br', () => {
  beforeEach(() => {
    localStorage.clear();
    isBrowserMock.mockReturnValue(true);
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('leaves text without consecutive blank lines unchanged', () => {
    const hook = createBr(false);

    expect(hook.beforeMakeHtml('first\n\nsecond')).toBe('first\n\nsecond');
    expect(hook.makeHtml('unchanged')).toBe('unchanged');
  });

  it('preserves blank lines at the start of the document', () => {
    const hook = createBr(false);

    expect(hook.beforeMakeHtml('\n\n\ncontent')).toBe('\n\n\ncontent');
  });

  it('renders browser spacer paragraphs with line metadata', () => {
    const hook = createBr(false);
    const prepared = hook.beforeMakeHtml('first\n\n\nsecond');
    const html = hook.restoreCache(prepared);

    expect(html).toContain('<p data-sign="br2" data-type="br" data-lines="2">&nbsp;</p>');
  });

  it('renders browser spans in classic mode and respects the local preference', () => {
    localStorage.setItem('cherry-classicBr', 'true');
    const hook = createBr(false);
    const html = hook.restoreCache(hook.beforeMakeHtml('first\n\n\nsecond'));

    expect(html).toContain('<span data-sign="br2" data-type="br" data-lines="2"></span>');
  });

  it.each([
    [false, '<br/>'],
    [true, ''],
  ])('renders Node blank lines when classicBr is %s', (classicBr, expected) => {
    isBrowserMock.mockReturnValue(false);
    const hook = createBr(classicBr);
    const html = hook.restoreCache(hook.beforeMakeHtml('first\n\n\nsecond'));

    expect(html).toContain(expected);
  });
});
