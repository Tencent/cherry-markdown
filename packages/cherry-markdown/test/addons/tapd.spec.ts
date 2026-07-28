import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import TapdCheckListPlugin from '../../src/addons/advance/cherry-tapd-checklist-plugin';
import TapdHtmlTagPlugin from '../../src/addons/advance/cherry-tapd-html-tag-plugin';
import TapdTablePlugin from '../../src/addons/advance/cherry-tapd-table-plugin';

const sentenceMake = (content: string) => ({ sign: `sign-${content.length}`, html: `<span>${content}</span>` });

beforeEach(() => {
  vi.stubGlobal('BUILD_ENV', 'production');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('addons/TAPD checklist', () => {
  it('renders checked and unchecked TAPD markers', () => {
    const plugin = new TapdCheckListPlugin();
    const source = '[x] done [ ] pending [|] empty';

    expect(plugin.makeHtml(source)).toBe(source);
    expect(plugin.afterMakeHtml(source)).toBe(
      ' <span class="ch-icon ch-icon-check"></span>  done  <span class="ch-icon ch-icon-square"></span>  pending  <span class="ch-icon ch-icon-square"></span>  empty',
    );
    expect(plugin.rule()).toEqual({});
  });
});

describe('addons/TAPD raw HTML', () => {
  it('renders escaped HTML while removing script and iframe execution', () => {
    const plugin = new TapdHtmlTagPlugin();
    const source = [
      '[html]',
      '&#60;section style="LAYOUT-GRID:fixed"&#62;safe&#60;/section&#62;',
      '<script>alert(1)</script>',
      '<iframe src="https://example.com">frame</iframe>',
      '[/html]',
    ].join('\n');

    const html = plugin.makeHtml(source, sentenceMake);

    expect(html).toContain('<div data-lines="5" data-sign="sign-');
    expect(html).toContain('<section style=":fixed">safe</section>');
    expect(html).toContain('frame');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<iframe');
    expect(plugin.rule().reg.test('[html]content[/html]')).toBe(true);
  });

  it('removes script tags case-insensitively', () => {
    const plugin = new TapdHtmlTagPlugin();
    expect(plugin._trimScripTag('<SCRIPT type="text/javascript">unsafe()</SCRIPT><b>safe</b>')).toBe('<b>safe</b>');
  });
});

describe('addons/TAPD simple table', () => {
  const createPlugin = () => {
    const plugin = new TapdTablePlugin();
    Object.defineProperty(plugin, '$engine', {
      value: {
        md5: vi.fn(() => 'tablesign'),
        hash: vi.fn(() => 'tablesign'),
      },
    });
    return plugin;
  };

  it('renders headers, alignment, cells, and inline Markdown', () => {
    const plugin = createPlugin();
    const source = '||~T Name ~T||~T Price||Count ~T||\n|| Cherry || **10** || 2 ||\n';

    const cacheKey = plugin.makeHtml(source, sentenceMake);
    const html = plugin.restoreCache(cacheKey);

    expect(html).toContain('class="cherry-table-container simple-table"');
    expect(html).toContain('<th align="center"><span>Name</span></th>');
    expect(html).toContain('<th align="left"><span>Price</span></th>');
    expect(html).toContain('<th align="right"><span>Count</span></th>');
    expect(html).toContain('<td align="center" ><span>Cherry</span></td>');
    expect(html).toContain('<span>**10**</span>');
    expect(plugin.rule()).toEqual({});
  });

  it('renders merged cells for triple-pipe tables', () => {
    const plugin = createPlugin();
    const source = '||| A || A || B ||\n|| C || D || B ||\n|| C || E || F ||\n';

    const html = plugin.restoreCache(plugin.makeHtml(source, sentenceMake));

    expect(html).toContain('rowspan="1" colspan="2"');
    expect(html).toContain('rowspan="2" colspan="1"');
    expect(html).not.toContain('colspan="-1"');
    expect(html).not.toContain('rowspan="-1"');
  });

  it('handles coordinate, conversion, span, and header helpers', () => {
    const plugin = createPlugin();

    expect(plugin.$nextTdKey('2-3')).toBe('2-4');
    expect(plugin.$prevTdKey('2-3')).toBe('2-2');
    expect(plugin.$nextTrKey('2-3')).toBe('3-3');
    expect(plugin.$prevTrKey('2-3')).toBe('1-3');
    expect(plugin.$getSpanKey(2, 3)).toBe('2-3');
    expect(plugin.$convertTrsString2Array(['|| A || B ||'])).toEqual([[' A ', ' B ']]);
    expect(plugin.$convertTrsString2Array(null)).toBeNull();
    expect(plugin.$isMeerged({ '0-0': [-1, 1] }, '0-0')).toBe(true);
    expect(plugin.$getTdSpan({ '0-0': [2, 3] }, '0-0')).toBe('rowspan="2" colspan="3"');
    expect(plugin.$dealTh('~T Center ~T')).toMatchObject({ align: 'align="center"', content: 'Center' });
  });

  it('extends horizontal spans through already merged cells', () => {
    const plugin = createPlugin();
    const recursive = { '0-0': [1, 2], '0-1': [1, -1] };
    const ordinary = { '1-0': [1, 2] };

    expect(plugin.$setColMapVal(recursive, '0-1')).toEqual({
      '0-0': [1, 3],
      '0-1': [1, -1],
      '0-2': [1, -1],
    });
    expect(plugin.$setColMapVal(ordinary, '1-0')['1-0']).toEqual([1, 3]);
  });

  it('handles vertical span mismatches, starts, recursion, and extension', () => {
    const plugin = createPlugin();

    expect(plugin.$setRowMapVal({ '0-0': [1, 2] }, '0-0')).toEqual({
      '0-0': [1, 2],
      '1-0': [1, 1],
    });
    expect(plugin.$setRowMapVal({ '0-0': [1, 1], '1-0': [1, 1] }, '0-0')).toEqual({
      '0-0': [2, 1],
      '1-0': [-1, 1],
    });
    expect(plugin.$setRowMapVal({ '0-0': [2, 1], '1-0': [-1, 1] }, '1-0')).toEqual({
      '0-0': [3, 1],
      '1-0': [-1, 1],
      '2-0': [-1, 1],
    });
    expect(plugin.$setRowMapVal({ '0-0': [2, 1], '1-0': [1, 1] }, '0-0')['0-0']).toEqual([3, 1]);
  });
});
