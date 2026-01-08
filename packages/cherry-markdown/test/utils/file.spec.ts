import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleParams, handleFileUploadCallback } from '../../src/utils/file';

describe('file 工具函数', () => {
  describe('handleParams', () => {
    it('空参数返回空字符串', () => {
      expect(handleParams(undefined)).toBe('');
    });

    it('处理单个参数', () => {
      const cases = [
        [{ isBorder: true }, '#B'],
        [{ isShadow: true }, '#S'],
        [{ isRadius: true }, '#R'],
        [{ width: '100px' }, '#100px'],
        [{ height: '200px' }, '#auto #200px'],
      ];
      cases.forEach(([params, expected]) => {
        expect(handleParams(params as any)).toBe(expected);
      });
    });

    it('组合多个参数', () => {
      const cases = [
        [{ isBorder: true, isShadow: true, width: '50%' }, '#B #S #50%'],
        [{ width: '100px', height: '200px' }, '#100px #200px'],
        [{ isBorder: true, isShadow: true, isRadius: true, width: '100px', height: '200px' }, '#B #S #R #100px #200px'],
      ];
      cases.forEach(([params, expected]) => {
        expect(handleParams(params as any)).toBe(expected);
      });
    });
  });

  describe('handleFileUploadCallback', () => {
    it('处理媒体文件', () => {
      const cases = [
        // 图片
        [new File(['content'], 'test.jpg', { type: 'image/jpeg' }), 'https://example.com/image.jpg', {}, ['!', 'test.jpg', 'https://example.com/image.jpg']],
        // 视频
        [new File(['content'], 'test.mp4', { type: 'video/mp4' }), 'https://example.com/video.mp4', {}, ['!video', 'test.mp4', 'https://example.com/video.mp4']],
        // 带封面的视频
        [new File(['content'], 'test.mp4', { type: 'video/mp4' }), 'https://example.com/video.mp4', { poster: 'poster.jpg' }, ['{poster=poster.jpg}']],
        // 音频
        [new File(['content'], 'test.mp3', { type: 'audio/mpeg' }), 'https://example.com/audio.mp3', {}, ['!audio', 'test.mp3', 'https://example.com/audio.mp3']],
      ];
      cases.forEach(([file, url, options, contains]) => {
        const result = handleFileUploadCallback(url as string, options as any, file as File);
        (contains as string[]).forEach((str) => {
          expect(result).toContain(str);
        });
      });
    });

    it('处理自定义文件名', () => {
      const file = new File(['content'], 'original.jpg', { type: 'image/jpeg' });
      const result = handleFileUploadCallback('url.jpg', { name: 'custom.jpg' }, file);
      expect(result).toContain('custom.jpg');
      expect(result).not.toContain('original.jpg');
    });

    it('添加样式参数到图片', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = handleFileUploadCallback('url.jpg', { isBorder: true, width: '100px' }, file);
      expect(result).toContain('#B');
      expect(result).toContain('#100px');
    });

    it('添加前后缀文本', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = handleFileUploadCallback('url.jpg', { before: '前缀 ', after: ' 后缀' }, file);
      expect(result).toContain('前缀 ');
      expect(result).toContain(' 后缀');
    });

    it('处理非媒体文件（使用默认链接格式）', () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const result = handleFileUploadCallback('url.pdf', {}, file);
      expect(result).toContain('document.pdf');
      expect(result).toContain('url.pdf');
      expect(result).not.toContain('!');
      expect(result).not.toContain('!video');
      expect(result).not.toContain('!audio');
    });
  });
});