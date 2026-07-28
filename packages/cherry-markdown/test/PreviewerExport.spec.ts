import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportHTMLFile, exportMarkdownFile, exportPDF, exportScreenShot, exportWordFile } from '../src/utils/export';
import { createPreviewer } from './helpers/previewer';

vi.mock('../src/utils/export', () => ({
  exportPDF: vi.fn(),
  exportScreenShot: vi.fn(),
  exportMarkdownFile: vi.fn(),
  exportHTMLFile: vi.fn(),
  exportWordFile: vi.fn(),
}));

describe('Previewer exports', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('dispatches PDF and image exports with explicit and derived names', () => {
    const { previewer, previewerDom, cherry } = createPreviewer();

    previewer.export('pdf');
    previewer.export('img', 'image-name');
    previewer.export('screenShot', 'screenshot-name');

    expect(cherry.getFirstLineText).toHaveBeenCalledWith('cherry-export');
    expect(exportPDF).toHaveBeenCalledWith(previewerDom, 'document');
    expect(exportScreenShot).toHaveBeenNthCalledWith(1, previewerDom, 'image-name');
    expect(exportScreenShot).toHaveBeenNthCalledWith(2, previewerDom, 'screenshot-name');
  });

  it('dispatches Markdown, HTML, and Word exports with source or preview content', () => {
    const { previewer } = createPreviewer();
    vi.spyOn(previewer, 'getValue').mockReturnValue('<p>rendered</p>');

    previewer.export('markdown', 'source');
    previewer.export('html', 'page');
    previewer.export('word', 'document');

    expect(exportMarkdownFile).toHaveBeenCalledWith('# Document', 'source');
    expect(exportHTMLFile).toHaveBeenCalledWith('<p>rendered</p>', 'page');
    expect(exportWordFile).toHaveBeenCalledWith('<p>rendered</p>', 'document');
  });
});
