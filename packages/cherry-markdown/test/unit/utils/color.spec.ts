/**
 * color.js 单元测试
 * 测试颜色转换工具函数
 */
import { describe, expect, it } from 'vitest';
import { hexToRgb, rgbToHex, rgbToHsv, hsvToRgb } from '../../../src/utils/color';

describe('utils/color', () => {
  describe('hexToRgb', () => {
    it('应该正确转换 6 位十六进制颜色', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('应该支持不带 # 的格式', () => {
      expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('应该支持大小写混合', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#FfAaBb')).toEqual({ r: 255, g: 170, b: 187 });
    });

    it('无效输入应返回 null', () => {
      expect(hexToRgb('#fff')).toBe(null); // 3 位简写不支持
      expect(hexToRgb('#gggggg')).toBe(null); // 无效字符
      expect(hexToRgb('invalid')).toBe(null);
      expect(hexToRgb('')).toBe(null);
    });
  });

  describe('rgbToHex', () => {
    it('应该正确转换 RGB 到十六进制', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('应该正确转换中间值', () => {
      expect(rgbToHex(128, 128, 128)).toBe('#808080');
      expect(rgbToHex(255, 170, 187)).toBe('#ffaabb');
    });

    it('边界值测试', () => {
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    });
  });

  describe('rgbToHsv', () => {
    it('红色应转换为 h=0', () => {
      const { h, s, v } = rgbToHsv(255, 0, 0);
      expect(h).toBe(0);
      expect(s).toBe(1);
      expect(v).toBe(1);
    });

    it('绿色应转换为 h=120', () => {
      const { h, s, v } = rgbToHsv(0, 255, 0);
      expect(h).toBe(120);
      expect(s).toBe(1);
      expect(v).toBe(1);
    });

    it('蓝色应转换为 h=240', () => {
      const { h, s, v } = rgbToHsv(0, 0, 255);
      expect(h).toBe(240);
      expect(s).toBe(1);
      expect(v).toBe(1);
    });

    it('白色应返回 s=0, v=1', () => {
      const { h, s, v } = rgbToHsv(255, 255, 255);
      expect(s).toBe(0);
      expect(v).toBe(1);
    });

    it('黑色应返回 s=0, v=0', () => {
      const { h, s, v } = rgbToHsv(0, 0, 0);
      expect(s).toBe(0);
      expect(v).toBe(0);
    });

    it('灰色应返回 s=0', () => {
      const { s } = rgbToHsv(128, 128, 128);
      expect(s).toBe(0);
    });
  });

  describe('hsvToRgb', () => {
    it('红色 h=0 应转回 RGB', () => {
      expect(hsvToRgb(0, 1, 1)).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('绿色 h=120 应转回 RGB', () => {
      expect(hsvToRgb(120, 1, 1)).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('蓝色 h=240 应转回 RGB', () => {
      expect(hsvToRgb(240, 1, 1)).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('白色 s=0, v=1 应返回白色', () => {
      expect(hsvToRgb(0, 0, 1)).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('黑色 v=0 应返回黑色', () => {
      expect(hsvToRgb(0, 1, 0)).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('测试各色相区间', () => {
      // h: 0-60 (红到黄)
      const c1 = hsvToRgb(30, 1, 1);
      expect(c1.r).toBe(255);
      expect(c1.g).toBe(128);
      expect(c1.b).toBe(0);

      // h: 60-120 (黄到绿)
      const c2 = hsvToRgb(90, 1, 1);
      expect(c2.r).toBe(128);
      expect(c2.g).toBe(255);
      expect(c2.b).toBe(0);

      // h: 120-180 (绿到青)
      const c3 = hsvToRgb(150, 1, 1);
      expect(c3.r).toBe(0);
      expect(c3.g).toBe(255);
      expect(c3.b).toBe(128);

      // h: 180-240 (青到蓝)
      const c4 = hsvToRgb(210, 1, 1);
      expect(c4.r).toBe(0);
      expect(c4.g).toBe(128);
      expect(c4.b).toBe(255);

      // h: 240-300 (蓝到品红)
      const c5 = hsvToRgb(270, 1, 1);
      expect(c5.r).toBe(128);
      expect(c5.g).toBe(0);
      expect(c5.b).toBe(255);

      // h: 300-360 (品红到红)
      const c6 = hsvToRgb(330, 1, 1);
      expect(c6.r).toBe(255);
      expect(c6.g).toBe(0);
      expect(c6.b).toBe(128);
    });
  });

  describe('双向转换一致性', () => {
    it('RGB -> HSV -> RGB 应得到相同结果', () => {
      const testColors = [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 0, b: 255 },
        { r: 128, g: 64, b: 192 },
        { r: 255, g: 128, b: 64 },
      ];

      testColors.forEach(({ r, g, b }) => {
        const hsv = rgbToHsv(r, g, b);
        const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
        expect(rgb.r).toBe(r);
        expect(rgb.g).toBe(g);
        expect(rgb.b).toBe(b);
      });
    });

    it('Hex -> RGB -> Hex 应得到相同结果', () => {
      const testHexes = ['#ff0000', '#00ff00', '#0000ff', '#808080', '#ffaabb'];

      testHexes.forEach((hex) => {
        const rgb = hexToRgb(hex);
        if (rgb) {
          const backToHex = rgbToHex(rgb.r, rgb.g, rgb.b);
          expect(backToHex).toBe(hex);
        }
      });
    });
  });
});
