import { describe, expect, it } from 'vitest';
import { hexToRgb, rgbToHex, rgbToHsv, hsvToRgb } from '../../src/utils/color';

describe('utils/color', () => {
  describe('hexToRgb', () => {
    it('转换HEX颜色到RGB', () => {
      const cases = [
        // 标准HEX颜色
        ['#FF0000', { r: 255, g: 0, b: 0 }],
        ['#00FF00', { r: 0, g: 255, b: 0 }],
        ['#0000FF', { r: 0, g: 0, b: 255 }],
        ['#FFFFFF', { r: 255, g: 255, b: 255 }],
        ['#000000', { r: 0, g: 0, b: 0 }],
        // 不带#号的HEX颜色
        ['FF0000', { r: 255, g: 0, b: 0 }],
        ['00ff00', { r: 0, g: 255, b: 0 }],
      ];
      cases.forEach(([hex, expected]) => {
        expect(hexToRgb(hex as string)).toEqual(expected);
      });
    });

    it('无效HEX颜色返回null', () => {
      const cases = ['#ZZZ', '#123', ''];
      cases.forEach((hex) => {
        expect(hexToRgb(hex as string)).toBe(null);
      });
    });
  });

  describe('rgbToHex', () => {
    it('转换RGB到HEX颜色', () => {
      const cases = [
        [[255, 0, 0], '#ff0000'],
        [[0, 255, 0], '#00ff00'],
        [[0, 0, 255], '#0000ff'],
        [[255, 255, 255], '#ffffff'],
        [[0, 0, 0], '#000000'],
      ];
      cases.forEach(([rgb, expected]) => {
        expect(rgbToHex(rgb[0], rgb[1], rgb[2])).toBe(expected);
      });
    });

    it('边界值处理', () => {
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    });
  });

  describe('rgbToHsv', () => {
    it('转换RGB到HSV颜色空间', () => {
      const cases = [
        // 基础颜色
        [[255, 0, 0], { h: 0, s: 1, v: 1 }],
        [[0, 255, 0], { h: 120, s: 1, v: 1 }],
        [[0, 0, 255], { h: 240, s: 1, v: 1 }],
        [[255, 255, 0], { h: 60, s: 1, v: 1 }],
        // 灰度颜色
        [[128, 128, 128], { h: 0, s: 0, v: 0.5019607843137255 }],
        [[0, 0, 0], { h: 0, s: 0, v: 0 }],
        [[255, 255, 255], { h: 0, s: 0, v: 1 }],
      ];
      cases.forEach(([rgb, expected]) => {
        expect(rgbToHsv(rgb[0] as number, rgb[1] as number, rgb[2] as number)).toEqual(expected);
      });
    });
  });

  describe('hsvToRgb', () => {
    it('转换HSV到RGB颜色空间', () => {
      const cases = [
        [[0, 1, 1], { r: 255, g: 0, b: 0 }],
        [[120, 1, 1], { r: 0, g: 255, b: 0 }],
        [[240, 1, 1], { r: 0, g: 0, b: 255 }],
        [[60, 1, 1], { r: 255, g: 255, b: 0 }],
        [[300, 1, 1], { r: 255, g: 0, b: 255 }],
        // 灰度颜色
        [[0, 0, 0], { r: 0, g: 0, b: 0 }],
        [[0, 0, 0.5], { r: 128, g: 128, b: 128 }],
        [[0, 0, 1], { r: 255, g: 255, b: 255 }],
        // hue值大于300
        [[300, 1, 1], { r: 255, g: 0, b: 255 }],
        [[330, 1, 1], { r: 255, g: 0, b: 128 }],
      ];
      cases.forEach(([hsv, expected]) => {
        expect(hsvToRgb(hsv[0] as number, hsv[1] as number, hsv[2] as number)).toEqual(expected);
      });
    });

    it('与rgbToHsv可逆转换', () => {
      const original = { r: 123, g: 45, b: 67 };
      const hsv = rgbToHsv(original.r, original.g, original.b);
      const converted = hsvToRgb(hsv.h, hsv.s, hsv.v);
      expect(converted).toEqual(original);
    });
  });
});
