import { describe, it, expect } from 'vitest';
import Image from '../../../src/core/hooks/Image';

describe('core/hooks/image', () => {
  it('should parse basic image syntax', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const cases = [
      {
        input: '![alt text](image.png)',
        expectedPattern: /<img[^>]*src="image\.png"[^>]*alt="alt text"[^>]*>/,
      },
      {
        input: '![alt text](https://example.com/image.jpg)',
        expectedPattern: /<img[^>]*src="https:\/\/example\.com\/image\.jpg"[^>]*alt="alt text"[^>]*>/,
      },
    ];

    cases.forEach((item) => {
      const result = imageHook.makeHtml(item.input, () => ({ html: item.input }));
      expect(result.html).toMatch(item.expectedPattern);
    });
  });

  it('should handle image with title', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const input = '![alt text](image.png "Image Title")';
    const result = imageHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toMatch(/<img[^>]*src="image\.png"[^>]*alt="alt text"[^>]*>/);
    expect(result.html).toContain('title="Image Title"');
  });

  it('should handle image with empty alt text', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const input = '![](image.png)';
    const result = imageHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toMatch(/<img[^>]*src="image\.png"[^>]*>/);
  });

  it('should handle reference-style images', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const cases = [
      {
        input: '![alt text][ref]\n\n[ref]: image.png',
        expectedPattern: /<img[^>]*src="image\.png"[^>]*alt="alt text"[^>]*>/,
      },
      {
        input: '![alt text][ref]\n\n[ref]: image.png "Title"',
        expectedPattern: /<img[^>]*src="image\.png"[^>]*alt="alt text"[^>]*title="Title"[^>]*>/,
      },
    ];

    cases.forEach((item) => {
      const result = imageHook.makeHtml(item.input, () => ({ html: item.input }));
      expect(result.html).toMatch(item.expectedPattern);
    });
  });

  it('should handle image with special characters in URL', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const cases = [
      {
        input: '![alt](image with spaces.png)',
        expectedPattern: /<img[^>]*src="image%20with%20spaces\.png"[^>]*>/,
      },
      {
        input: '![alt](image.png?param=value&other=123)',
        expectedPattern: /<img[^>]*src="image\.png\?param=value&other=123"[^>]*>/,
      },
    ];

    cases.forEach((item) => {
      const result = imageHook.makeHtml(item.input, () => ({ html: item.input }));
      expect(result.html).toMatch(item.expectedPattern);
    });
  });

  it('should handle data URI images', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const input = '![alt](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==)';
    const result = imageHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('data:image/png');
  });

  it('should handle relative paths', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '![alt](./images/pic.jpg)',
      '![alt](../images/pic.jpg)',
      '![alt](/images/pic.jpg)',
    ];

    cases.forEach((input) => {
      const result = imageHook.makeHtml(input, () => ({ html: input }));
      expect(result.html).toContain('<img');
      expect(result.html).toContain('src=');
    });
  });

  it('should handle image with emoji in alt text', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '![alt 🚀 text](image.png)',
      '![😀😃😄](image.png)',
      '![🚀🎉✨](image.png)',
    ];

    cases.forEach((input) => {
      const result = imageHook.makeHtml(input, () => ({ html: input }));
      expect(result.html).toMatch(/<img[^>]*>/);
    });
  });

  it('should handle multiple images in one line', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const input = '![img1](1.png) and ![img2](2.png)';
    const result = imageHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('1.png');
    expect(result.html).toContain('2.png');
  });

  it('should not treat ![]() with empty brackets as image', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const input = '![]()';
    const result = imageHook.makeHtml(input, () => ({ html: input }));
    // This should be rendered as-is, not as an image
    expect(result.html).toBe(input);
  });

  it('should handle nested brackets in alt text', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const input = '![alt [with] brackets](image.png)';
    const result = imageHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toMatch(/<img[^>]*src="image\.png"[^>]*>/);
  });

  it('should handle image with code in alt text', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const input = '![alt with `code`](image.png)';
    const result = imageHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toMatch(/<img[^>]*src="image\.png"[^>]*>/);
  });

  it('should strip angle brackets for alt text', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const input = '![<alt>](image.png)';
    const result = imageHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('alt="&lt;alt&gt;"');
  });

  it('should handle images with uppercase file extensions', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const input = '![alt](image.PNG)';
    const result = imageHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toMatch(/<img[^>]*src="image\.PNG"[^>]*>/);
  });

  it('should handle image URLs with anchors', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const input = '![alt](image.png#section)';
    const result = imageHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('image.png#section');
  });

  it('should escape quotes in alt text', () => {
    const imageHook = new Image({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '![alt "with quotes"](image.png)',
      '![alt \'with quotes\'](image.png)',
    ];

    cases.forEach((input) => {
      const result = imageHook.makeHtml(input, () => ({ html: input }));
      expect(result.html).toMatch(/<img[^>]*>/);
    });
  });
});
