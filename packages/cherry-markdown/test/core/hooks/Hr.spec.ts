import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Hr from '../../../src/core/hooks/Hr';

describe('core/hooks/Hr', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it.each(['---', '* * *', '_\t_\t_'])('renders a horizontal rule from %s', (markdown) => {
    const hook = new Hr();
    const html = hook.restoreCache(hook.beforeMakeHtml(markdown));

    expect(html).toBe('<hr data-sign="hr1" data-lines="1" />');
  });

  it('counts leading blank lines and preserves its paragraph boundary', () => {
    const hook = new Hr();
    const prepared = hook.beforeMakeHtml('\n\n---');
    const html = hook.restoreCache(prepared);

    expect(html.startsWith('\n')).toBe(true);
    expect(html).toContain('data-sign="hr3" data-lines="3"');
    expect(hook.makeHtml('unchanged')).toBe('unchanged');
  });

  it('leaves inline and incomplete rules unchanged', () => {
    const hook = new Hr();

    expect(hook.beforeMakeHtml('text --- text\n--')).toBe('text --- text\n--');
  });
});
