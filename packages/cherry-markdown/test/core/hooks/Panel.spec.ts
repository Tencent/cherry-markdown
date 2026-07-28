import { beforeEach, describe, expect, it, vi } from 'vitest';
import Panel from '../../../src/core/hooks/Panel';
import { hashHex } from '../../../src/utils/hash';

function createPanel(
  config: {
    enablePanel?: boolean;
    enableAlign?: boolean;
    enableJustify?: boolean;
    enableCols?: boolean;
    enableTabs?: boolean;
    enableTimeline?: boolean;
  } = {},
) {
  const hook = new Panel({
    config: {
      enablePanel: true,
      enableAlign: true,
      enableJustify: false,
      ...config,
    },
    globalConfig: { classicBr: false },
  });
  Object.defineProperty(hook, '$engine', {
    value: {
      hash: (value: string) => hashHex(value),
      htmlWhiteListAppend: '',
    },
  });
  return hook;
}

const sentenceMake = (markdown: string) => ({ html: markdown.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') });

describe('core/hooks/Panel', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('pads missing columns and merges overflow into the final column', () => {
    const hook = createPanel();

    expect(hook.$splitCols('one', 3)).toEqual(['one', '', '']);
    expect(hook.$splitCols('one\n::\ntwo\n::\nthree\n::\nfour', 3)).toEqual(['one', '\ntwo', '\nthree\n::\n\nfour']);
    expect(hook.$splitCols('one\n::\ntwo\n::\n  ', 0)).toEqual(['one', '\ntwo']);
    expect(hook.$splitCols('', 0)).toEqual(['']);
  });

  it.each([
    ['cols', 0],
    ['2cols', 2],
    ['3COLS center', 3],
    ['', 0],
  ])('gets the fixed column count from %s', (name, expected) => {
    expect(createPanel().$getFixedColCount(name)).toBe(expected);
  });

  it.each([
    ['cols', 'left'],
    ['cols left', 'left'],
    ['cols l', 'left'],
    ['cols right', 'right'],
    ['cols r extra', 'right'],
    ['cols center', 'center'],
    ['cols c', 'center'],
    ['cols justify', 'justify'],
    ['cols j', 'justify'],
    ['cols invalid', 'left'],
    ['', 'left'],
  ])('normalizes the column alignment in %s', (name, expected) => {
    expect(createPanel().$getColsAlign(name)).toBe(expected);
  });

  it.each([
    ['primary title', 'primary', 'title'],
    ['p', 'primary', ''],
    ['info', 'info', ''],
    ['i', 'info', ''],
    ['warning', 'warning', ''],
    ['w', 'warning', ''],
    ['danger', 'danger', ''],
    ['d', 'danger', ''],
    ['success', 'success', ''],
    ['s', 'success', ''],
    ['right', 'right', ''],
    ['r', 'right', ''],
    ['center', 'center', ''],
    ['c', 'center', ''],
    ['left', 'left', ''],
    ['l', 'left', ''],
    ['justify', 'justify', ''],
    ['j', 'justify', ''],
    ['cols', 'cols', ''],
    ['2cols', 'cols', ''],
    ['3cols', 'cols', ''],
    ['tabs', 'tabs', ''],
    ['t', 'tabs', ''],
    ['timeline', 'timeline', ''],
    ['unknown title', 'primary', 'title'],
  ])('normalizes panel name %s', (name, type, title) => {
    const hook = createPanel();

    expect(hook.$getTargetType(name)).toBe(type);
    expect(hook.$getTitle(name)).toBe(title);
  });

  it('renders titled and empty information panels', () => {
    const hook = createPanel();
    const titled = hook.$getPanelInfo('warning Build failed', '**Check** logs', sentenceMake);
    const empty = hook.$getPanelInfo('info', '   ', sentenceMake);

    expect(titled).toMatchObject({
      type: 'warning',
      className: 'cherry-panel cherry-panel__warning',
      appendStyle: '',
    });
    expect(titled.title).toContain('cherry-panel--title__not-empty');
    expect(titled.title).toContain('Build failed');
    expect(titled.body).toContain('<p><strong>Check</strong> logs</p>');
    expect(empty.title).not.toContain('cherry-panel--title__not-empty');
    expect(empty.body).toBe('<div class="cherry-panel--body"></div>');
  });

  it('renders alignment panels with inline style and block HTML with a div wrapper', () => {
    const hook = createPanel();
    const aligned = hook.$getPanelInfo('center', '<blockquote>body</blockquote>', (markdown: string) => ({
      html: markdown,
    }));

    expect(aligned.className).toBe('cherry-text-align cherry-text-align__center');
    expect(aligned.appendStyle).toBe('style="text-align:center;"');
    expect(aligned.body).toContain('<div><blockquote>body</blockquote></div>');
  });

  it('preserves nested paragraph cache entries inside panel bodies and columns', () => {
    const hook = createPanel();
    const nestedCache = hook.pushCache('<blockquote>cached</blockquote>', 'nested', 1);
    const body = hook.$getPanelInfo('info', `before\n${nestedCache}\nafter`, sentenceMake);
    const columns = hook.$getPanelInfo('2cols', `left\n${nestedCache}\n::\nright`, sentenceMake);

    expect(hook.restoreCache(body.body)).toContain('<p>before</p><blockquote>cached</blockquote><p>after</p>');
    expect(hook.restoreCache(columns.body)).toContain('<p>left</p><blockquote>cached</blockquote>');
    expect(hook.restoreCache(columns.body)).toContain('<p>right</p>');
  });

  it('splits colon-marked items and ignores content before the first marker', () => {
    const hook = createPanel();

    expect(hook.$splitItemsByColonMark('ignored\r\n:: First\r\nline 1\r\n:: Second\r\nline 2')).toEqual([
      { head: 'First', body: 'line 1' },
      { head: 'Second', body: 'line 2' },
    ]);
    expect(hook.$splitItemsByColonMark('no markers')).toEqual([]);
    expect(hook.$splitItemsByColonMark('')).toEqual([]);
  });

  it.each([
    ['done', 'done'],
    ['✓', 'done'],
    ['x', 'done'],
    ['doing', 'doing'],
    ['…', 'doing'],
    ['...', 'doing'],
    ['~', 'doing'],
    ['todo', 'todo'],
    ['', 'todo'],
    ['milestone', 'milestone'],
    ['★', 'milestone'],
    ['*', 'milestone'],
    ['error', 'error'],
    ['err', 'error'],
    ['✗', 'error'],
    ['×', 'error'],
    ['!', 'error'],
    ['unknown', 'todo'],
  ])('normalizes timeline status %s', (status, expected) => {
    expect(createPanel().$normalizeTimelineStatus(status)).toBe(expected);
  });

  it('parses timeline status, time, title, and description', () => {
    const hook = createPanel();

    expect(hook.$parseTimelineItem('[done] 2024-01-15 Released', '\nDetails\n')).toEqual({
      status: 'done',
      time: '2024-01-15',
      title: 'Released',
      desc: 'Details',
    });
    expect(hook.$parseTimelineItem('[~T] v1.0.0', '')).toEqual({
      status: 'doing',
      time: 'v1.0.0',
      title: '',
      desc: '',
    });
    expect(hook.$parseTimelineItem('Planning phase', '  description  ')).toEqual({
      status: 'todo',
      time: '',
      title: 'Planning phase',
      desc: '  description  ',
    });
    expect(hook.$parseTimelineItem('', null)).toEqual({
      status: 'todo',
      time: '',
      title: '',
      desc: '',
    });
  });

  it('renders columns, tabs, and timeline panels using their existing markup', () => {
    const hook = createPanel();
    const columns = hook.$getPanelInfo('cols center', 'left\n::\nright', sentenceMake);
    const tabs = hook.$getPanelInfo('tabs right', ':: First\nbody\n::\n', sentenceMake);
    const timeline = hook.$getPanelInfo(
      'timeline Roadmap',
      ':: [done] 2024-01-01 Started\nfirst\n:: [doing] Next step',
      sentenceMake,
    );

    expect(columns.className).toContain('cherry-panel-cols__2cols');
    expect(columns.appendStyle).toBe('style="--cols:2;text-align:center;"');
    expect(tabs.className).toContain('cherry-tabs__2tabs');
    expect(tabs.body).toContain('name="cherry-tabs-group-1"');
    expect(tabs.body).toContain(' checked');
    expect(tabs.body).toContain('Tab 2');
    expect(timeline.title).toContain('Roadmap');
    expect(timeline.body).toContain('cherry-timeline--item__done');
    expect(timeline.body).toContain('cherry-timeline--item__doing');
    expect(timeline.body).toContain('cherry-timeline--time');
    expect(timeline.body).not.toContain('cherry-timeline--desc"></div>');
  });

  it('renders final panel HTML and reuses its cached result', () => {
    const hook = createPanel();
    const markdown = ':::success Complete\n**Done**\n:::';
    const firstCache = hook.makeHtml(markdown, sentenceMake);
    const secondCache = hook.makeHtml(markdown, sentenceMake);
    const html = hook.restoreCache(firstCache);

    expect(secondCache).toBe(firstCache);
    expect(html).toContain('class="cherry-panel cherry-panel__success"');
    expect(html).toContain('data-lines="3"');
    expect(html).toContain('<strong>Done</strong>');
  });

  it('leaves disabled information and alignment panels unchanged', () => {
    const disabledPanel = createPanel({ enablePanel: false });
    const disabledAlign = createPanel({ enableAlign: false, enableJustify: false });
    const panelMarkdown = ':::warning Warning\nbody\n:::';
    const alignMarkdown = ':::right\nbody\n:::';

    expect(disabledPanel.makeHtml(panelMarkdown, sentenceMake)).toBe(panelMarkdown);
    expect(disabledAlign.makeHtml(alignMarkdown, sentenceMake)).toBe(alignMarkdown);
  });

  it.each([
    [{ enableCols: false }, ':::cols\nleft\n::\nright\n:::'],
    [{ enableTabs: false }, ':::tabs\n:: First\nbody\n:::'],
    [{ enableTimeline: false }, ':::timeline\n:: 2024 Started\n:::'],
  ])('leaves independently disabled panel syntax unchanged', (config, markdown) => {
    expect(createPanel(config).makeHtml(markdown, sentenceMake)).toBe(markdown);
  });
});
