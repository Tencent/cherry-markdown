import { beforeEach, describe, expect, it, vi } from 'vitest';
import Panel from '../../../src/core/hooks/Panel';
import { hashHex } from '../../../src/utils/hash';

function createPanel(config: { enablePanel?: boolean; enableAlign?: boolean; enableJustify?: boolean } = {}) {
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

  it.each([
    ['primary', 'primary'],
    ['P', 'primary'],
    ['info', 'info'],
    ['i', 'info'],
    ['warning', 'warning'],
    ['W', 'warning'],
    ['danger', 'danger'],
    ['d', 'danger'],
    ['success', 'success'],
    ['S', 'success'],
    ['right', 'right'],
    ['r', 'right'],
    ['center', 'center'],
    ['c', 'center'],
    ['left', 'left'],
    ['l', 'left'],
    ['justify', 'justify'],
    ['j', 'justify'],
    ['2cols', '2cols'],
    ['3cols', '3cols'],
    ['unknown', 'primary'],
  ])('maps panel type %s to %s', (source, expected) => {
    expect(createPanel().$getTargetType(`${source} Optional title`)).toBe(expected);
  });

  it('extracts optional titles and chooses classes by panel type', () => {
    const hook = createPanel();

    expect(hook.$getTitle('warning Build failed')).toBe('Build failed');
    expect(hook.$getTitle('warning')).toBe('');
    expect(hook.$getClassByType('warning')).toBe('cherry-panel cherry-panel__warning');
    expect(hook.$getClassByType('center')).toBe('cherry-text-align cherry-text-align__center');
    expect(hook.$getClassByType('3cols')).toBe('cherry-panel-cols cherry-panel-cols__3cols');
  });

  it('pads missing columns and merges overflow into the final column', () => {
    const hook = createPanel();

    expect(hook.$splitCols('one', 3)).toEqual(['one', '', '']);
    expect(hook.$splitCols('one\n::\ntwo\n::\nthree\n::\nfour', 3)).toEqual(['one', '\ntwo', '\nthree\n::\n\nfour']);
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

  it('renders three columns including a padded empty column', () => {
    const hook = createPanel();
    const panel = hook.$getPanelInfo('3cols', 'one\n::\ntwo', sentenceMake);

    expect(panel.title).toBe('');
    expect(panel.className).toBe('cherry-panel-cols cherry-panel-cols__3cols');
    expect(panel.body.match(/class="cherry-panel--col"/g)).toHaveLength(3);
    expect(panel.body).toContain('<p>one</p>');
    expect(panel.body).toContain('<p>two</p>');
    expect(panel.body).toContain('<div class="cherry-panel--col"></div>');
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
});
