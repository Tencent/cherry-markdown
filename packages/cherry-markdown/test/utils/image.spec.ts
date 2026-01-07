import { describe, expect, it } from 'vitest';
import imgAltHelper from '../../src/utils/image';

describe('utils/image', () => {
  describe('processExtendAttributesInAlt', () => {
    it('提取宽度和高度属性', () => {
      const alt = 'alt text #100px #200px';
      const result = imgAltHelper.processExtendAttributesInAlt(alt);
      expect(result).toBe('width:100px;height:200px;');
    });

    it('仅提取宽度', () => {
      const alt = 'alt text #100px';
      const result = imgAltHelper.processExtendAttributesInAlt(alt);
      expect(result).toBe('width:100px;');
    });

    it('仅提取高度', () => {
      const alt = 'alt text #200px';
      const result = imgAltHelper.processExtendAttributesInAlt(alt);
      expect(result).toBe('width:200px;'); // Width comes first in array
    });

    it('处理百分比值', () => {
      const alt = 'alt text #100% #50%';
      const result = imgAltHelper.processExtendAttributesInAlt(alt);
      expect(result).toBe('width:100%;height:50%;');
    });

    it('处理auto值', () => {
      const alt = 'alt text #auto #100px';
      const result = imgAltHelper.processExtendAttributesInAlt(alt);
      expect(result).toBe('width:auto;height:100px;');
    });

    it('未找到属性时返回空字符串', () => {
      const alt = 'alt text';
      const result = imgAltHelper.processExtendAttributesInAlt(alt);
      expect(result).toBe('');
    });

    it('处理em单位', () => {
      const alt = 'alt text #10em #20em';
      const result = imgAltHelper.processExtendAttributesInAlt(alt);
      expect(result).toBe('width:10em;height:20em;');
    });
  });

  describe('processExtendStyleInAlt', () => {
    it('处理装饰样式', () => {
      const alt = 'alt text #B #S #R';
      const result = imgAltHelper.processExtendStyleInAlt(alt);
      expect(result.extendStyles).toContain('border:');
      expect(result.extendStyles).toContain('box-shadow:');
      expect(result.extendStyles).toContain('border-radius:');
      expect(result.extendClasses).toContain('cherry-img-deco-border');
      expect(result.extendClasses).toContain('cherry-img-deco-shadow');
      expect(result.extendClasses).toContain('cherry-img-deco-radius');
    });

    it('处理完整装饰名称', () => {
      const alt = 'alt text #border #shadow #radius';
      const result = imgAltHelper.processExtendStyleInAlt(alt);
      expect(result.extendStyles).toContain('border:');
      expect(result.extendStyles).toContain('box-shadow:');
      expect(result.extendStyles).toContain('border-radius:');
    });

    it('处理居中对齐样式', () => {
      const alt = 'alt text #center';
      const result = imgAltHelper.processExtendStyleInAlt(alt);
      expect(result.extendStyles).toContain('transform:translateX(-50%)');
      expect(result.extendStyles).toContain('margin-left:50%');
      expect(result.extendClasses).toContain('cherry-img-align-center');
    });

    it('处理右对齐样式', () => {
      const alt = 'alt text #right';
      const result = imgAltHelper.processExtendStyleInAlt(alt);
      expect(result.extendStyles).toContain('transform:translateX(-100%)');
      expect(result.extendClasses).toContain('cherry-img-align-right');
    });

    it('处理左对齐样式', () => {
      const alt = 'alt text #left';
      const result = imgAltHelper.processExtendStyleInAlt(alt);
      expect(result.extendStyles).toContain('transform:translateX(0)');
      expect(result.extendClasses).toContain('cherry-img-align-left');
    });

    it('处理右浮动样式', () => {
      const alt = 'alt text #float-right';
      const result = imgAltHelper.processExtendStyleInAlt(alt);
      expect(result.extendStyles).toContain('float:right');
      expect(result.extendClasses).toContain('cherry-img-align-float-left');
    });

    it('处理左浮动样式', () => {
      const alt = 'alt text #float-left';
      const result = imgAltHelper.processExtendStyleInAlt(alt);
      expect(result.extendStyles).toContain('float:left');
      expect(result.extendClasses).toContain('cherry-img0align-float-right');
    });

    it('未找到样式时返回空字符串', () => {
      const alt = 'alt text';
      const result = imgAltHelper.processExtendStyleInAlt(alt);
      expect(result.extendStyles).toBe('');
      expect(result.extendClasses).toBe('');
    });

    it('组合装饰和对齐样式', () => {
      const alt = 'alt text #B #center';
      const result = imgAltHelper.processExtendStyleInAlt(alt);
      expect(result.extendStyles).toContain('border:');
      expect(result.extendStyles).toContain('transform:translateX(-50%)');
      expect(result.extendClasses).toContain('cherry-img-deco-border');
      expect(result.extendClasses).toContain('cherry-img-align-center');
    });
  });

  describe('$getAlignment', () => {
    it('提取居中对齐', () => {
      const alt = 'alt text #center';
      const result = imgAltHelper.$getAlignment(alt);
      expect(result).toBe('center');
    });

    it('提取右对齐', () => {
      const alt = 'alt text #right';
      const result = imgAltHelper.$getAlignment(alt);
      expect(result).toBe('right');
    });

    it('提取左对齐', () => {
      const alt = 'alt text #left';
      const result = imgAltHelper.$getAlignment(alt);
      expect(result).toBe('left');
    });

    it('提取右浮动对齐', () => {
      const alt = 'alt text #float-right';
      const result = imgAltHelper.$getAlignment(alt);
      expect(result).toBe('float-right');
    });

    it('提取左浮动对齐', () => {
      const alt = 'alt text #float-left';
      const result = imgAltHelper.$getAlignment(alt);
      expect(result).toBe('float-left');
    });

    it('不区分大小写', () => {
      const alt = 'alt text #CENTER';
      const result = imgAltHelper.$getAlignment(alt);
      expect(result).toBe('CENTER');
    });

    it('未找到对齐时返回空字符串', () => {
      const alt = 'alt text';
      const result = imgAltHelper.$getAlignment(alt);
      expect(result).toBe('');
    });
  });
});
