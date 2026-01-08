import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { platformTransform } from '../../src/utils/platformTransform';

describe('platformTransform 工具函数', () => {
  describe('platformTransform', () => {
    it('无效输入返回空字符串', async () => {
      const cases = [null, '', undefined];
      for (const input of cases) {
        // @ts-ignore
        const result = await platformTransform(input, 'wechat');
        expect(result).toBe('');
      }
    });

    it('不支持的平台抛出错误', async () => {
      await expect(platformTransform('<p>test</p>', 'unknown' as any)).rejects.toThrow('platform not support');
    });

    it('转换微信公众号格式', async () => {
      const cases = [
        ['<div style="width: 500px;">content</div>', '100%'],
        ['<a href="https://example.com">link</a>', '<a'],
        ['<figure data-lines="1"><div>content</div></figure>', '<p>'],
      ];
      for (const [html, expected] of cases) {
        const result = await platformTransform(html, 'wechat');
        if (expected === '100%') {
          expect(result).toContain('100%');
        } else if (expected === '<a') {
          expect(result).not.toContain('href=');
        } else {
          expect(result).toContain(expected);
          expect(result).not.toContain('<div>');
        }
      }
    });
  });
});
