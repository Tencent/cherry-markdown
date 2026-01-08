import { describe, expect, it } from 'vitest';
import imgAltHelper from '../../src/utils/image';

describe('utils/image', () => {
  describe('processExtendAttributesInAlt', () => {
    it('提取宽度和高度属性', () => {
      const cases = [
        ['alt text #100px #200px', 'width:100px;height:200px;'],
        ['alt text #100px', 'width:100px;'],
        ['alt text #200px', 'width:200px;'],
        ['alt text #100% #50%', 'width:100%;height:50%;'],
        ['alt text #auto #100px', 'width:auto;height:100px;'],
        ['alt text #10em #20em', 'width:10em;height:20em;'],
        ['alt text', ''],
      ];
      cases.forEach(([alt, expected]) => {
        expect(imgAltHelper.processExtendAttributesInAlt(alt as string)).toBe(expected);
      });
    });
  });

  describe('processExtendStyleInAlt', () => {
    it('处理装饰样式', () => {
      const cases = [
        ['alt text #B #S #R', ['border:', 'box-shadow:', 'border-radius:', 'cherry-img-deco-border', 'cherry-img-deco-shadow', 'cherry-img-deco-radius']],
        ['alt text #border #shadow #radius', ['border:', 'box-shadow:', 'border-radius:']],
        ['alt text #center', ['transform:translateX(-50%)', 'margin-left:50%', 'cherry-img-align-center']],
        ['alt text #right', ['transform:translateX(-100%)', 'cherry-img-align-right']],
        ['alt text #left', ['transform:translateX(0)', 'cherry-img-align-left']],
        ['alt text #float-right', ['float:right', 'cherry-img-align-float-left']],
        ['alt text #float-left', ['float:left', 'cherry-img0align-float-right']],
      ];
      cases.forEach(([alt, contains]) => {
        const result = imgAltHelper.processExtendStyleInAlt(alt as string);
        (contains as string[]).forEach((str) => {
          if (str.includes(':')) {
            expect(result.extendStyles).toContain(str);
          } else {
            expect(result.extendClasses).toContain(str);
          }
        });
      });
    });

    it('未找到样式时返回空字符串', () => {
      const result = imgAltHelper.processExtendStyleInAlt('alt text');
      expect(result.extendStyles).toBe('');
      expect(result.extendClasses).toBe('');
    });

    it('组合装饰和对齐样式', () => {
      const result = imgAltHelper.processExtendStyleInAlt('alt text #B #center');
      expect(result.extendStyles).toContain('border:');
      expect(result.extendStyles).toContain('transform:translateX(-50%)');
      expect(result.extendClasses).toContain('cherry-img-deco-border');
      expect(result.extendClasses).toContain('cherry-img-align-center');
    });
  });

  describe('$getAlignment', () => {
    it('提取对齐方式', () => {
      const cases = [
        ['alt text #center', 'center'],
        ['alt text #right', 'right'],
        ['alt text #left', 'left'],
        ['alt text #float-right', 'float-right'],
        ['alt text #float-left', 'float-left'],
        ['alt text #CENTER', 'CENTER'],
        ['alt text', ''],
      ];
      cases.forEach(([alt, expected]) => {
        expect(imgAltHelper.$getAlignment(alt as string)).toBe(expected);
      });
    });
  });
});
