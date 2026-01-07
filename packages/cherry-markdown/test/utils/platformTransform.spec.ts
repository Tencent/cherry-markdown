import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { platformTransform } from '../../src/utils/platformTransform';

describe('platformTransform 工具函数', () => {
  describe('platformTransform', () => {
    it('非字符串输入返回空字符串', async () => {
      // @ts-ignore
      const result = await platformTransform(null, 'wechat');
      expect(result).toBe('');
    });

    it('空字符串返回空字符串', async () => {
      const result = await platformTransform('', 'wechat');
      expect(result).toBe('');
    });

    it('不支持的平台抛出错误', async () => {
      await expect(platformTransform('<p>test</p>', 'unknown' as any)).rejects.toThrow('platform not support');
    });

    it('转换微信公众号格式（无图片）', async () => {
      const html = '<div style="width: 500px;">content</div>';
      const result = await platformTransform(html, 'wechat');
      expect(result).toContain('100%');
    });

    it('移除 a 标签的 href 属性', async () => {
      const html = '<a href="https://example.com">link</a>';
      const result = await platformTransform(html, 'wechat');
      expect(result).not.toContain('href=');
    });

    it('转换 figure 标签为 p 标签', async () => {
      const html = '<figure data-lines="1"><div>content</div></figure>';
      const result = await platformTransform(html, 'wechat');
      expect(result).toContain('<p>');
      expect(result).not.toContain('<div>');
    });
  });
});
