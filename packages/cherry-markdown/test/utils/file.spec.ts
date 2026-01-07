import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleParams, handleFileUploadCallback } from '../../src/utils/file';

describe('file 工具函数', () => {
  describe('handleParams', () => {
    it('空参数返回空字符串', () => {
      const result = handleParams(undefined);
      expect(result).toBe('');
    });

    it('处理无边框参数', () => {
      const result = handleParams({ isBorder: true });
      expect(result).toBe('#B');
    });

    it('处理无阴影参数', () => {
      const result = handleParams({ isShadow: true });
      expect(result).toBe('#S');
    });

    it('处理无圆角参数', () => {
      const result = handleParams({ isRadius: true });
      expect(result).toBe('#R');
    });

    it('处理宽度参数', () => {
      const result = handleParams({ width: '100px' });
      expect(result).toBe('#100px');
    });

    it('处理高度参数（没有宽度时添加 #auto）', () => {
      const result = handleParams({ height: '200px' });
      expect(result).toBe('#auto #200px');
    });

    it('同时有宽度和高度', () => {
      const result = handleParams({ width: '100px', height: '200px' });
      expect(result).toBe('#100px #200px');
    });

    it('组合多个参数', () => {
      const result = handleParams({ isBorder: true, isShadow: true, width: '50%' });
      expect(result).toBe('#B #S #50%');
    });

    it('组合所有参数', () => {
      const result = handleParams({
        isBorder: true,
        isShadow: true,
        isRadius: true,
        width: '100px',
        height: '200px',
      });
      expect(result).toBe('#B #S #R #100px #200px');
    });
  });

  describe('handleFileUploadCallback', () => {
    it('处理图片文件', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = handleFileUploadCallback('https://example.com/image.jpg', {}, file);
      expect(result).toContain('!');
      expect(result).toContain('test.jpg');
      expect(result).toContain('https://example.com/image.jpg');
    });

    it('处理视频文件', () => {
      const file = new File(['content'], 'test.mp4', { type: 'video/mp4' });
      const result = handleFileUploadCallback('https://example.com/video.mp4', {}, file);
      expect(result).toContain('!video');
      expect(result).toContain('test.mp4');
      expect(result).toContain('https://example.com/video.mp4');
    });

    it('处理带封面的视频', () => {
      const file = new File(['content'], 'test.mp4', { type: 'video/mp4' });
      const result = handleFileUploadCallback(
        'https://example.com/video.mp4',
        { poster: 'poster.jpg' },
        file
      );
      expect(result).toContain('{poster=poster.jpg}');
    });

    it('处理音频文件', () => {
      const file = new File(['content'], 'test.mp3', { type: 'audio/mpeg' });
      const result = handleFileUploadCallback('https://example.com/audio.mp3', {}, file);
      expect(result).toContain('!audio');
      expect(result).toContain('test.mp3');
    });

    it('使用自定义文件名', () => {
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
