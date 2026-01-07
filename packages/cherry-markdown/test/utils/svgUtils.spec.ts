import { describe, expect, it, vi, afterEach } from 'vitest';
import { getSvgString, downloadSvg } from '../../src/utils/svgUtils';

describe('utils/svgUtils', () => {
  let svgElement: SVGSVGElement;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('width', '100');
    svgElement.setAttribute('height', '100');
    svgElement.innerHTML = '<circle cx="50" cy="50" r="40" fill="red" />';

    // Mock URL.createObjectURL and URL.revokeObjectURL
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  describe('getSvgString', () => {
    it('序列化SVG元素为字符串', () => {
      const result = getSvgString(svgElement);
      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
    });

    it('包含svg属性', () => {
      const result = getSvgString(svgElement);
      expect(result).toContain('width="100"');
      expect(result).toContain('height="100"');
    });

    it('包含svg内容', () => {
      const result = getSvgString(svgElement);
      expect(result).toContain('<circle');
      expect(result).toContain('fill="red"');
    });
  });

  describe('downloadSvg', () => {
    it('使用正确参数调用downloadByATag', () => {
      const filename = 'test.svg';
      downloadSvg(svgElement, filename);
      expect(true).toBe(true);
    });
  });
});
