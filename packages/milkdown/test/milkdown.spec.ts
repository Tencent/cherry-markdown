import { describe, expect, it, beforeEach } from 'vite-plus/test';
import CherryMilkdown from '../src/index';

describe('@cherry-markdown/milkdown', () => {
  beforeEach(() => {
    // @ts-expect-error 构建注入的全局变量
    globalThis.BUILD_ENV = 'production';
  });

  it('exposes the CherryMilkdown constructor', () => {
    expect(typeof CherryMilkdown).toBe('function');
  });

  it('throws when creating without an el', async () => {
    const editor = new CherryMilkdown({});
    await expect(editor.create()).rejects.toThrow('options.el');
  });

  it('exposes editor instance methods', () => {
    const editor = new CherryMilkdown({ el: document.createElement('div') });
    expect(typeof editor.getMarkdown).toBe('function');
    expect(typeof editor.destroy).toBe('function');
    expect(editor.getEditor()).toBeNull();
  });
});
