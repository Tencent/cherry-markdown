import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportMarkdownFile, exportHTMLFile } from '../../src/utils/export';
import * as exportWordModule from '../../src/utils/exportWord';

// Mock exportWordModule
vi.mock('../../src/utils/exportWord', () => ({
  exportWordFile: vi.fn(),
}));

describe('export 工具函数', () => {
  beforeEach(() => {
    vi.spyOn(document.body, 'appendChild').mockImplementation((element) => {
      element.parentElement = document.body as any;
      return element;
    });
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = {
        tagName: tagName.toUpperCase(),
        style: {},
        click: vi.fn(),
      } as any;
      return element;
    });
    // Mock URL.createObjectURL
    // @ts-ignore
    global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
    // @ts-ignore
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportMarkdownFile', () => {
    it('创建并下载 markdown 文件', () => {
      exportMarkdownFile('# Hello World', 'test');
      expect(document.createElement).toHaveBeenCalledWith('a');
      // @ts-ignore
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('处理空内容', () => {
      exportMarkdownFile('', 'empty');
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('处理包含特殊字符的内容', () => {
      exportMarkdownFile('Test: 中文 `code` **bold**', 'special');
      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('exportHTMLFile', () => {
    it('创建并下载 HTML 文件', () => {
      exportHTMLFile('<h1>Hello</h1>', 'test');
      expect(document.createElement).toHaveBeenCalledWith('a');
      // @ts-ignore
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('处理空 HTML', () => {
      exportHTMLFile('', 'empty');
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('处理复杂 HTML', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Test</title></head>
        <body><h1>Content</h1></body>
        </html>
      `;
      exportHTMLFile(html, 'complete');
      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('exportWordFile (from exportWord module)', () => {
    it('exportWordFile 应该可从模块导出', () => {
      expect(exportWordModule.exportWordFile).toBeDefined();
    });
  });
});
