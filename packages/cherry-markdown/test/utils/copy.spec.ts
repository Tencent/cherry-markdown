import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { copyToClip } from '../../src/utils/copy';

describe('utils/copy', () => {
  let originalExecCommand: any;
  let originalAddEventListener: any;
  let originalRemoveEventListener: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // 保存原始方法
    originalExecCommand = document.execCommand;
    originalAddEventListener = document.addEventListener;
    originalRemoveEventListener = document.removeEventListener;

    // Mock document.execCommand
    document.execCommand = vi.fn(() => true);
    // Mock addEventListener
    document.addEventListener = vi.fn((event: string, listener: any) => {
      return listener;
    });
    // Mock removeEventListener
    document.removeEventListener = vi.fn();
  });

  afterEach(() => {
    document.execCommand = originalExecCommand;
    document.addEventListener = originalAddEventListener;
    document.removeEventListener = originalRemoveEventListener;
  });

  describe('copyToClip', () => {
    it('未提供内容时抛出异常', async () => {
      const cases = ['', null, undefined];
      for (const content of cases) {
        await expect(copyToClip(content as any)).rejects.toThrow('没有提供任何内容进行复制');
      }
    });

    it('复制内容', async () => {
      const cases = [
        ['test content', undefined],
        [undefined, '<p>test content</p>'],
        ['test content', '<p>test content</p>'],
      ];
      for (const [text, html] of cases) {
        await expect(copyToClip(text as any, html as any)).resolves.not.toThrow();
        expect(document.execCommand).toHaveBeenCalledWith('copy');
        expect(document.addEventListener).toHaveBeenCalledWith('copy', expect.any(Function));
        expect(document.removeEventListener).toHaveBeenCalledWith('copy', expect.any(Function));
      }
    });
  });
});
