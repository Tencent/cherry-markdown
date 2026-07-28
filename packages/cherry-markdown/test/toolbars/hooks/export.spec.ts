import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import Export from '../../../src/toolbars/hooks/Export';
import { createMenuContext } from '../../helpers/menu';

function createExportContext(hidden: boolean) {
  const context = createMenuContext();
  const previewDom = document.createElement('div');
  previewDom.innerHTML = '<p>visible</p>';
  const previewer = {
    options: { previewerCache: { html: '<p>cached</p>' } },
    isPreviewerHidden: vi.fn(() => hidden),
    getDomContainer: vi.fn(() => previewDom),
    lazyLoadImg: { changeDataSrc2Src: vi.fn((html: string) => `${html}<img src="loaded.png">`) },
    refresh: vi.fn(),
    export: vi.fn(),
  };
  Object.assign(context.cherry, { previewer });
  return { context, previewer };
}

describe('toolbars/hooks Export', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('offers browser exports and exports the hidden preview cache', () => {
    const { context, previewer } = createExportContext(true);
    const dropdown = document.createElement('div');
    dropdown.className = 'cherry-dropdown';
    dropdown.setAttribute('name', 'export');
    document.body.append(dropdown);
    const done = vi.fn();
    window.addEventListener('cherry:export:done', done);
    const exporter = new Export(context.cherry as never);

    expect(exporter.getSubMenuConfig().map(({ name }) => name)).toContain('exportMarkdownFile');
    exporter.onClick('', 'markdown');

    expect(dropdown.style.display).toBe('none');
    expect(previewer.lazyLoadImg.changeDataSrc2Src).toHaveBeenCalledWith('<p>cached</p>');
    expect(previewer.refresh).toHaveBeenCalledWith('<p>cached</p><img src="loaded.png">');
    expect(previewer.export).toHaveBeenCalledWith('markdown');
    expect(done).toHaveBeenCalledOnce();
    window.removeEventListener('cherry:export:done', done);
  });

  it('exports the current preview DOM when the preview is visible', () => {
    const { context, previewer } = createExportContext(false);
    const exporter = new Export(context.cherry as never);

    exporter.onClick('', 'html');

    expect(previewer.getDomContainer).toHaveBeenCalledOnce();
    expect(previewer.lazyLoadImg.changeDataSrc2Src).toHaveBeenCalledWith('<p>visible</p>');
    expect(previewer.export).toHaveBeenCalledWith('html');
  });
});
