import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { copyToClip } from '../../src/utils/copy';

describe('utils/copy', () => {
  let originalExecCommand: any;
  let originalAddEventListener: any;
  let originalRemoveEventListener: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Save originals
    originalExecCommand = document.execCommand;
    originalAddEventListener = document.addEventListener;
    originalRemoveEventListener = document.removeEventListener;

    // Mock document.execCommand
    document.execCommand = vi.fn(() => true);
    // Mock addEventListener to actually store and call listeners
    document.addEventListener = vi.fn((event: string, listener: any) => {
      // Just store the listener, we'll trigger it manually if needed
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

    it('仅复制文本', async () => {
      const text = 'test content';
      await expect(copyToClip(text)).resolves.not.toThrow();
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(document.addEventListener).toHaveBeenCalledWith('copy', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('copy', expect.any(Function));
    });

    it('仅复制HTML', async () => {
      const html = '<p>test content</p>';
      await expect(copyToClip(undefined, html)).resolves.not.toThrow();
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(document.addEventListener).toHaveBeenCalledWith('copy', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('copy', expect.any(Function));
    });

    it('同时复制文本和HTML', async () => {
      const text = 'test content';
      const html = '<p>test content</p>';
      await expect(copyToClip(text, html)).resolves.not.toThrow();
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(document.addEventListener).toHaveBeenCalledWith('copy', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('copy', expect.any(Function));
    });
  });
});
