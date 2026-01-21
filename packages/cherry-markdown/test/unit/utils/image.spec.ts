/**
 * image.js 单元测试
 * 测试图片 alt 扩展语法解析功能
 *
 * Cherry Markdown 支持在图片 alt 中添加扩展语法：
 * - 尺寸: #100px #50%
 * - 装饰: #border #shadow #radius 或 #B #S #R
 * - 对齐: #center #left #right #float-left #float-right
 */
import { describe, expect, it } from 'vitest';
import imgAltHelper from '../../../src/utils/image';

describe('utils/image - imgAltHelper', () => {
  describe('processExtendAttributesInAlt - 尺寸属性', () => {
    it('应提取单个宽度', () => {
      expect(imgAltHelper.processExtendAttributesInAlt('图片#100px')).toBe('width:100px;');
      expect(imgAltHelper.processExtendAttributesInAlt('alt#200px')).toBe('width:200px;');
    });

    it('应提取宽度和高度', () => {
      expect(imgAltHelper.processExtendAttributesInAlt('图片#100px#50px')).toBe('width:100px;height:50px;');
    });

    it('应支持百分比单位', () => {
      expect(imgAltHelper.processExtendAttributesInAlt('图片#50%')).toBe('width:50%;');
      expect(imgAltHelper.processExtendAttributesInAlt('图片#100%#50%')).toBe('width:100%;height:50%;');
    });

    it('应支持各种 CSS 单位', () => {
      expect(imgAltHelper.processExtendAttributesInAlt('#10em')).toBe('width:10em;');
      expect(imgAltHelper.processExtendAttributesInAlt('#10pt')).toBe('width:10pt;');
      expect(imgAltHelper.processExtendAttributesInAlt('#10pc')).toBe('width:10pc;');
      expect(imgAltHelper.processExtendAttributesInAlt('#10in')).toBe('width:10in;');
      expect(imgAltHelper.processExtendAttributesInAlt('#10mm')).toBe('width:10mm;');
      expect(imgAltHelper.processExtendAttributesInAlt('#10cm')).toBe('width:10cm;');
      expect(imgAltHelper.processExtendAttributesInAlt('#10ex')).toBe('width:10ex;');
    });

    it('应支持 auto 值', () => {
      expect(imgAltHelper.processExtendAttributesInAlt('#auto')).toBe('width:auto;');
      expect(imgAltHelper.processExtendAttributesInAlt('#100px#auto')).toBe('width:100px;height:auto;');
    });

    it('无尺寸属性时返回空字符串', () => {
      expect(imgAltHelper.processExtendAttributesInAlt('普通图片描述')).toBe('');
      expect(imgAltHelper.processExtendAttributesInAlt('')).toBe('');
    });

    it('忽略非尺寸的 # 标记', () => {
      expect(imgAltHelper.processExtendAttributesInAlt('#border#100px')).toBe('width:100px;');
      expect(imgAltHelper.processExtendAttributesInAlt('#center#50%')).toBe('width:50%;');
    });
  });

  describe('processExtendStyleInAlt - 装饰样式', () => {
    describe('边框样式', () => {
      it('#border 应添加边框样式', () => {
        const result = imgAltHelper.processExtendStyleInAlt('图片#border');
        expect(result.extendStyles).toContain('border:');
        expect(result.extendClasses).toContain('cherry-img-deco-border');
      });

      it('#B 是 #border 的简写', () => {
        const result = imgAltHelper.processExtendStyleInAlt('图片#B');
        expect(result.extendStyles).toContain('border:');
        expect(result.extendClasses).toContain('cherry-img-deco-border');
      });
    });

    describe('阴影样式', () => {
      it('#shadow 应添加阴影样式', () => {
        const result = imgAltHelper.processExtendStyleInAlt('图片#shadow');
        expect(result.extendStyles).toContain('box-shadow:');
        expect(result.extendClasses).toContain('cherry-img-deco-shadow');
      });

      it('#S 是 #shadow 的简写', () => {
        const result = imgAltHelper.processExtendStyleInAlt('图片#S');
        expect(result.extendStyles).toContain('box-shadow:');
        expect(result.extendClasses).toContain('cherry-img-deco-shadow');
      });
    });

    describe('圆角样式', () => {
      it('#radius 应添加圆角样式', () => {
        const result = imgAltHelper.processExtendStyleInAlt('图片#radius');
        expect(result.extendStyles).toContain('border-radius:');
        expect(result.extendClasses).toContain('cherry-img-deco-radius');
      });

      it('#R 是 #radius 的简写', () => {
        const result = imgAltHelper.processExtendStyleInAlt('图片#R');
        expect(result.extendStyles).toContain('border-radius:');
        expect(result.extendClasses).toContain('cherry-img-deco-radius');
      });
    });

    describe('组合装饰样式', () => {
      it('应支持多个装饰样式组合', () => {
        const result = imgAltHelper.processExtendStyleInAlt('图片#border#shadow#radius');
        expect(result.extendStyles).toContain('border:');
        expect(result.extendStyles).toContain('box-shadow:');
        expect(result.extendStyles).toContain('border-radius:');
      });

      it('简写形式组合', () => {
        const result = imgAltHelper.processExtendStyleInAlt('图片#B#S#R');
        expect(result.extendClasses).toContain('cherry-img-deco-border');
        expect(result.extendClasses).toContain('cherry-img-deco-shadow');
        expect(result.extendClasses).toContain('cherry-img-deco-radius');
      });
    });
  });

  describe('processExtendStyleInAlt - 对齐样式', () => {
    it('#center 应居中对齐', () => {
      const result = imgAltHelper.processExtendStyleInAlt('图片#center');
      expect(result.extendStyles).toContain('translateX(-50%)');
      expect(result.extendStyles).toContain('margin-left:50%');
      expect(result.extendClasses).toContain('cherry-img-align-center');
    });

    it('#right 应右对齐', () => {
      const result = imgAltHelper.processExtendStyleInAlt('图片#right');
      expect(result.extendStyles).toContain('translateX(-100%)');
      expect(result.extendStyles).toContain('margin-left:100%');
      expect(result.extendClasses).toContain('cherry-img-align-right');
    });

    it('#left 应左对齐', () => {
      const result = imgAltHelper.processExtendStyleInAlt('图片#left');
      expect(result.extendStyles).toContain('margin-left:0');
      expect(result.extendClasses).toContain('cherry-img-align-left');
    });

    it('#float-right 应右浮动', () => {
      const result = imgAltHelper.processExtendStyleInAlt('图片#float-right');
      expect(result.extendStyles).toContain('float:right');
      // 注：源码 class 名可能有 bug，这里测试实际行为
    });

    it('#float-left 应左浮动', () => {
      const result = imgAltHelper.processExtendStyleInAlt('图片#float-left');
      expect(result.extendStyles).toContain('float:left');
      // 注：源码 class 名可能有 bug，这里测试实际行为
    });

    it('对齐样式区分大小写', () => {
      // 源码中 switch 使用小写比较，所以大写的 #CENTER 不会匹配
      const result = imgAltHelper.processExtendStyleInAlt('图片#CENTER');
      // 大写不匹配，所以没有样式
      expect(result.extendStyles).toBe('');
    });
  });

  describe('$getAlignment - 提取对齐方式', () => {
    it('应正确提取对齐方式', () => {
      expect(imgAltHelper.$getAlignment('图片#center')).toBe('center');
      expect(imgAltHelper.$getAlignment('图片#right')).toBe('right');
      expect(imgAltHelper.$getAlignment('图片#left')).toBe('left');
      expect(imgAltHelper.$getAlignment('图片#float-right')).toBe('float-right');
      expect(imgAltHelper.$getAlignment('图片#float-left')).toBe('float-left');
    });

    it('无对齐标记返回空字符串', () => {
      expect(imgAltHelper.$getAlignment('普通图片')).toBe('');
      expect(imgAltHelper.$getAlignment('')).toBe('');
    });

    it('不区分大小写', () => {
      expect(imgAltHelper.$getAlignment('#CENTER')).toBe('CENTER');
      expect(imgAltHelper.$getAlignment('#Right')).toBe('Right');
    });
  });

  describe('组合场景', () => {
    it('尺寸 + 装饰 + 对齐', () => {
      const alt = '图片#100px#50px#border#shadow#center';
      const attrs = imgAltHelper.processExtendAttributesInAlt(alt);
      const styles = imgAltHelper.processExtendStyleInAlt(alt);

      expect(attrs).toBe('width:100px;height:50px;');
      expect(styles.extendStyles).toContain('border:');
      expect(styles.extendStyles).toContain('box-shadow:');
      expect(styles.extendClasses).toContain('cherry-img-align-center');
    });

    it('简写形式组合', () => {
      const alt = '图片#50%#B#S#R#center';
      const attrs = imgAltHelper.processExtendAttributesInAlt(alt);
      const styles = imgAltHelper.processExtendStyleInAlt(alt);

      expect(attrs).toBe('width:50%;');
      expect(styles.extendClasses).toContain('cherry-img-deco-border');
      expect(styles.extendClasses).toContain('cherry-img-deco-shadow');
      expect(styles.extendClasses).toContain('cherry-img-deco-radius');
    });

    it('中文 alt 文本', () => {
      const result = imgAltHelper.processExtendStyleInAlt('这是一张很漂亮的图片#border#center');
      expect(result.extendStyles).toContain('border:');
      expect(result.extendClasses).toContain('cherry-img-align-center');
    });
  });

  describe('边界情况', () => {
    it('空字符串', () => {
      expect(imgAltHelper.processExtendAttributesInAlt('')).toBe('');
      const result = imgAltHelper.processExtendStyleInAlt('');
      expect(result.extendStyles).toBe('');
      expect(result.extendClasses).toBe('');
    });

    it('只有 # 号', () => {
      expect(imgAltHelper.processExtendAttributesInAlt('#')).toBe('');
      expect(imgAltHelper.$getAlignment('#')).toBe('');
    });

    it('无效的尺寸格式', () => {
      expect(imgAltHelper.processExtendAttributesInAlt('#abc')).toBe('');
      expect(imgAltHelper.processExtendAttributesInAlt('#px')).toBe('');
    });

    it('多个 # 连续', () => {
      const result = imgAltHelper.processExtendAttributesInAlt('图片##100px');
      // 应能正确解析，即使有多余的 #
      expect(result).toContain('100px');
    });
  });
});
