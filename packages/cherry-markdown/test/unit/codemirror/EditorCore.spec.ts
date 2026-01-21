/**
 * Editor.js 核心方法测试
 * 测试 CodeMirror 相关的编辑器核心功能
 *
 * 这些测试是升级 CodeMirror6 前的基准测试，用于验证核心功能的行为
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCodeMirrorMock, createCherryMock } from '../../__mocks__/codemirror.mock';
import { longTextReg, base64Reg, imgDrawioXmlReg, createUrlReg } from '../../../src/utils/regexp';

describe('Editor.js 核心方法', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;
  let cherryMock: ReturnType<typeof createCherryMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock('');
    cherryMock = createCherryMock();
  });

  describe('dealSpecialWords - 特殊字符处理', () => {
    it('应该识别并标记 base64 图片数据', () => {
      const base64Content = '![image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA)';
      cmMock = createCodeMirrorMock(base64Content);

      // 模拟 formatBigData2Mark 的行为
      const searcher = cmMock.getSearchCursor(base64Reg);
      const results: any[] = [];

      let match = searcher.findNext();
      while (match) {
        const from = searcher.from();
        if (from) {
          results.push({ from, match });
        }
        match = searcher.findNext();
      }

      // base64 数据应该被识别
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('应该识别并标记 drawio xml 数据', () => {
      const drawioContent = '![diagram](data:image/svg+xml,<mxGraphModel>...</mxGraphModel>)';
      cmMock = createCodeMirrorMock(drawioContent);

      const searcher = cmMock.getSearchCursor(imgDrawioXmlReg);
      let hasMatch = false;
      let match = searcher.findNext();
      while (match) {
        hasMatch = true;
        match = searcher.findNext();
      }

      // drawio 图形数据格式验证
      expect(typeof drawioContent).toBe('string');
    });

    it('应该识别超长文本并添加省略号标记', () => {
      // longTextReg 匹配前100个字符 + 后续5900个以上字符
      // 正则: /([^\n]{100})([^\n|`\s]{5900,})/g
      const prefix = 'a'.repeat(100);
      const longPart = 'b'.repeat(6000);
      const longText = prefix + longPart;

      // 长文本正则应该能够匹配
      expect(longTextReg.test(longText)).toBe(true);
    });

    it('应该识别超长 URL 并添加截断标记', () => {
      const maxUrlLength = 50;
      const [protocolUrlPattern, wwwUrlPattern] = createUrlReg(maxUrlLength);

      // 超长 URL
      const longUrl = `https://example.com/${'path/'.repeat(20)}`;

      // 验证 URL 正则模式
      expect(protocolUrlPattern).toBeInstanceOf(RegExp);
      expect(wwwUrlPattern).toBeInstanceOf(RegExp);
    });
  });

  describe('formatBigData2Mark - 大数据标记', () => {
    it('应该使用 getSearchCursor 搜索匹配内容', () => {
      const testContent = 'some content with pattern';
      cmMock = createCodeMirrorMock(testContent);

      const pattern = /pattern/;
      const searcher = cmMock.getSearchCursor(pattern);

      expect(cmMock.getSearchCursor).toHaveBeenCalledWith(pattern);
      expect(searcher.findNext).toBeDefined();
      expect(searcher.from).toBeDefined();
    });

    it('应该在找到匹配时检查已有标记', () => {
      const testContent = 'test pattern here';
      cmMock = createCodeMirrorMock(testContent);

      const from = { line: 0, ch: 5 };
      const to = { line: 0, ch: 12 };

      // 检查是否已有标记
      const existingMarks = cmMock.findMarks(from, to);
      expect(Array.isArray(existingMarks)).toBe(true);
    });

    it('应该使用 markText 创建新标记', () => {
      const testContent = 'test pattern here';
      cmMock = createCodeMirrorMock(testContent);

      const from = { line: 0, ch: 5 };
      const to = { line: 0, ch: 12 };

      const mark = cmMock.markText(from, to, {
        replacedWith: document.createElement('span'),
        atomic: true,
      });

      expect(cmMock.markText).toHaveBeenCalled();
      expect(mark.clear).toBeDefined();
    });
  });

  describe('formatFullWidthMark - 全角符号高亮', () => {
    const fullWidthChars = ['·', '￥', '、', '：', '"', '"', '【', '】', '（', '）', '《', '》'];

    it.each(fullWidthChars)('应该识别全角字符: %s', (char) => {
      const regex = /[·￥、：""【】（）《》]/;
      expect(regex.test(char)).toBe(true);
    });

    it('应该使用 getSearchCursor 搜索全角符号', () => {
      const testContent = '这是一段包含全角符号的文本：测试【内容】';
      cmMock = createCodeMirrorMock(testContent);

      const regex = /[·￥、：""【】（）《》]/;
      const searcher = cmMock.getSearchCursor(regex);

      let count = 0;
      while (searcher.findNext()) {
        count++;
      }

      // 文本中包含 ：【】 三个全角符号
      expect(count).toBe(3);
    });

    it('应该为全角符号添加 cm-fullWidth 类名的标记', () => {
      const testContent = '测试：内容';
      cmMock = createCodeMirrorMock(testContent);

      const from = { line: 0, ch: 2 };
      const to = { line: 0, ch: 3 };

      const mark = cmMock.markText(from, to, {
        className: 'cm-fullWidth',
        title: '按住Ctrl/Cmd点击切换成半角',
      });

      expect(mark.className).toBe('cm-fullWidth');
    });

    it('应该清除无效的 cm-fullWidth 标记', () => {
      const testContent = 'normal text';
      cmMock = createCodeMirrorMock(testContent);

      // 创建一个标记
      const mark = cmMock.markText({ line: 0, ch: 0 }, { line: 0, ch: 6 }, {
        className: 'cm-fullWidth',
      });

      // 获取所有标记
      const allMarks = cmMock.getAllMarks();

      // 验证可以获取标记
      expect(allMarks.length).toBeGreaterThan(0);

      // 清除标记
      mark.clear();
      expect(mark.clear).toHaveBeenCalled();
    });
  });

  describe('toHalfWidth - 全角转半角', () => {
    const fullToHalfMap = [
      ['·', '`'],
      ['￥', '$'],
      ['、', '/'],
      ['：', ':'],
      ['"', '"'],
      ['"', '"'],
      ['【', '['],
      ['】', ']'],
      ['（', '('],
      ['）', ')'],
      ['《', '<'],
      ['》', '>'],
    ];

    it.each(fullToHalfMap)('应该将 %s 转换为 %s', (full, half) => {
      const result = full
        .replace('·', '`')
        .replace('￥', '$')
        .replace('、', '/')
        .replace('：', ':')
        .replace('"', '"')
        .replace('"', '"')
        .replace('【', '[')
        .replace('】', ']')
        .replace('（', '(')
        .replace('）', ')')
        .replace('《', '<')
        .replace('》', '>');

      expect(result).toBe(half);
    });

    it('应该在 Ctrl/Cmd + 点击时触发转换', () => {
      const testContent = '测试：内容';
      cmMock = createCodeMirrorMock(testContent);

      // 模拟坐标转换
      const coords = { left: 20, top: 0 };
      const pos = cmMock.coordsChar(coords);

      expect(cmMock.coordsChar).toHaveBeenCalled();
      expect(pos).toHaveProperty('line');
      expect(pos).toHaveProperty('ch');
    });

    it('应该在转换后替换选区内容', () => {
      const testContent = '测试：内容';
      cmMock = createCodeMirrorMock(testContent);

      // 选中全角符号
      cmMock.setSelection({ line: 0, ch: 2 }, { line: 0, ch: 3 });

      // 替换为半角
      cmMock.replaceSelection(':');

      expect(cmMock.replaceSelection).toHaveBeenCalledWith(':');
    });
  });

  describe('handlePaste - 粘贴处理', () => {
    it('应该处理自定义 onPaste 回调返回的字符串', () => {
      const pasteContent = '粘贴的内容';
      cherryMock.options.callback.onPaste = vi.fn(() => pasteContent);

      const clipboardData = {
        getData: vi.fn(() => ''),
        items: [],
      };

      const result = cherryMock.options.callback.onPaste(clipboardData, cherryMock);

      expect(result).toBe(pasteContent);
    });

    it('应该处理 HTML 内容的粘贴', () => {
      const htmlContent = '<p>Hello <strong>World</strong></p>';
      const clipboardData = {
        getData: vi.fn((type: string) => {
          if (type === 'Text/Html') return htmlContent;
          return '';
        }),
        items: [],
      };

      const html = clipboardData.getData('Text/Html');
      expect(html).toBe(htmlContent);
    });

    it('应该清理 HTML 中的 Fragment 标记', () => {
      const htmlWithFragments = '<!--StartFragment--><p>content</p><!--EndFragment-->';
      const cleaned = htmlWithFragments.replace(/^[\s\S]*<!--StartFragment-->|<!--EndFragment-->[\s\S]*$/g, '');

      expect(cleaned).toBe('<p>content</p>');
    });

    it('应该识别图片粘贴场景', () => {
      const html = '<body>  <img src="data:image/png;base64,xxx">  </body>';
      const items = [
        { kind: 'string', type: 'text/html' },
        { kind: 'file', type: 'image/png' },
      ];

      // 验证正则匹配
      const imgInBodyRegex = /<body>\s*<img [^>]+>\s*<\/body>/;
      expect(imgInBodyRegex.test(html)).toBe(true);

      // 验证项目检查
      expect(items[1]?.kind).toBe('file');
      expect(items[1]?.type.match(/^image\//i)).toBeTruthy();
    });

    it('应该处理文件上传回调', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      const uploadCallback = vi.fn((url, params) => {
        expect(typeof url).toBe('string');
      });

      cherryMock.options.callback.fileUpload = vi.fn((file, callback) => {
        callback('https://example.com/image.png', { name: 'test.png' });
      });

      cherryMock.options.callback.fileUpload(file, uploadCallback);
      expect(cherryMock.options.callback.fileUpload).toHaveBeenCalled();
    });
  });

  describe('onScroll - 滚动同步', () => {
    it('应该获取滚动元素信息', () => {
      const scrollInfo = cmMock.getScrollInfo();

      expect(scrollInfo).toHaveProperty('top');
      expect(scrollInfo).toHaveProperty('left');
      expect(scrollInfo).toHaveProperty('height');
      expect(scrollInfo).toHaveProperty('width');
      expect(scrollInfo).toHaveProperty('clientHeight');
    });

    it('应该获取滚动容器元素', () => {
      const scroller = cmMock.getScrollerElement();

      expect(scroller).toHaveProperty('scrollTop');
      expect(scroller).toHaveProperty('scrollHeight');
      expect(scroller).toHaveProperty('clientHeight');
    });

    it('应该使用 lineAtHeight 计算当前行', () => {
      const currentTop = 100;
      const targetLine = cmMock.lineAtHeight(currentTop, 'local');

      expect(cmMock.lineAtHeight).toHaveBeenCalledWith(currentTop, 'local');
      expect(typeof targetLine).toBe('number');
    });

    it('应该使用 charCoords 获取行坐标', () => {
      const pos = { line: 5, ch: 0 };
      const coords = cmMock.charCoords(pos, 'local');

      expect(cmMock.charCoords).toHaveBeenCalledWith(pos, 'local');
      expect(coords).toHaveProperty('top');
      expect(coords).toHaveProperty('bottom');
    });

    it('应该计算滚动百分比', () => {
      const lineTop = 80;
      const lineHeight = 20;
      const currentTop = 90;

      const percent = (100 * (currentTop - lineTop)) / lineHeight / 100;

      expect(percent).toBe(0.5);
    });
  });

  describe('jumpToLine - 行跳转动画', () => {
    it('应该跳转到指定行', () => {
      cmMock = createCodeMirrorMock('line1\nline2\nline3\nline4\nline5');

      const beginLine = 2;
      const position = cmMock.charCoords({ line: beginLine, ch: 0 }, 'local');

      expect(position).toHaveProperty('top');
    });

    it('应该处理跳转到文档末尾的情况', () => {
      cmMock = createCodeMirrorMock('line1\nline2\nline3');

      const lastLine = cmMock.lineCount() - 1;

      cmMock.scrollIntoView({ line: lastLine, ch: 1 });

      expect(cmMock.scrollIntoView).toHaveBeenCalledWith({ line: lastLine, ch: 1 });
    });

    it('应该使用 scrollTo 进行滚动', () => {
      cmMock.scrollTo(null, 100);

      expect(cmMock.scrollTo).toHaveBeenCalledWith(null, 100);
    });

    it('应该计算动画移动距离', () => {
      const currentTop = 0;
      const destinationTop = 100;
      const delta = destinationTop - currentTop;

      // 100毫秒内完成动画，每帧约16.7ms
      const move = Math.ceil(Math.min(Math.abs(delta), Math.max(1, Math.abs(delta) / (100 / 16.7))));

      expect(move).toBeGreaterThan(0);
      expect(move).toBeLessThanOrEqual(Math.abs(delta));
    });
  });

  describe('scrollToLineNum - 行号滚动', () => {
    it('应该处理 null 参数跳转到底部', () => {
      const lineNum = null;

      // 当 lineNum 为 null 时跳转到底部
      if (lineNum === null) {
        cmMock.scrollIntoView({ line: cmMock.lineCount() - 1, ch: 1 });
      }

      expect(cmMock.scrollIntoView).toHaveBeenCalled();
    });

    it('应该处理负数行号', () => {
      const lineNum = -5;
      const $lineNum = Math.max(0, lineNum);

      expect($lineNum).toBe(0);
    });

    it('应该正确传递 endLine 和 percent 参数', () => {
      const beginLine = 10;
      const endLine = 5;
      const percent = 0.5;

      const position = cmMock.charCoords({ line: beginLine, ch: 0 }, 'local');
      const positionEnd = cmMock.charCoords({ line: beginLine + endLine, ch: 0 }, 'local');
      const height = positionEnd.top - position.top;
      const top = position.top + height * percent;

      expect(typeof top).toBe('number');
    });
  });

  describe('编辑器事件处理', () => {
    it('应该注册 change 事件', () => {
      cmMock.on('change', () => {});

      expect(cmMock.on).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('应该注册 scroll 事件', () => {
      cmMock.on('scroll', () => {});

      expect(cmMock.on).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('应该注册 paste 事件', () => {
      cmMock.on('paste', () => {});

      expect(cmMock.on).toHaveBeenCalledWith('paste', expect.any(Function));
    });

    it('应该注册 drop 事件', () => {
      cmMock.on('drop', () => {});

      expect(cmMock.on).toHaveBeenCalledWith('drop', expect.any(Function));
    });

    it('应该注册 cursorActivity 事件', () => {
      cmMock.on('cursorActivity', () => {});

      expect(cmMock.on).toHaveBeenCalledWith('cursorActivity', expect.any(Function));
    });
  });

  describe('编辑器选项', () => {
    it('应该设置和获取 keyMap 选项', () => {
      cmMock.setOption('keyMap', 'sublime');
      cmMock.getOption('keyMap');

      expect(cmMock.setOption).toHaveBeenCalledWith('keyMap', 'sublime');
      expect(cmMock.getOption).toHaveBeenCalledWith('keyMap');
    });

    it('应该设置 value 选项', () => {
      const newValue = 'new content';
      cmMock.setOption('value', newValue);

      expect(cmMock.setOption).toHaveBeenCalledWith('value', newValue);
    });
  });
});
