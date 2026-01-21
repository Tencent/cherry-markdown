/**
 * mathjax.js 测试
 * 测试公式转义函数
 */
import { describe, it, expect } from 'vitest';
import { escapeFormulaPunctuations } from '@/utils/mathjax';

describe('mathjax.js', () => {
  describe('escapeFormulaPunctuations', () => {
    describe('HTML 特殊字符转义', () => {
      it('转义 &', () => {
        const result = escapeFormulaPunctuations('a & b');
        expect(result).toContain('&amp;');
      });

      it('转义 <', () => {
        const result = escapeFormulaPunctuations('a < b');
        expect(result).toContain('&lt;');
      });

      it('转义 >', () => {
        const result = escapeFormulaPunctuations('a > b');
        expect(result).toContain('&gt;');
      });

      it('转义 "', () => {
        const result = escapeFormulaPunctuations('"quote"');
        expect(result).toContain('&quot;');
      });

      it("转义 '", () => {
        const result = escapeFormulaPunctuations("it's");
        expect(result).toContain('&#x27;');
      });

      it('多个 HTML 特殊字符', () => {
        const result = escapeFormulaPunctuations('a < b & c > d');
        expect(result).toContain('&lt;');
        expect(result).toContain('&amp;');
        expect(result).toContain('&gt;');
      });
    });

    describe('标点符号转义（添加反斜杠）', () => {
      it('转义 !', () => {
        const result = escapeFormulaPunctuations('x!');
        expect(result).toBe('x\\!');
      });

      it('转义 #', () => {
        const result = escapeFormulaPunctuations('#comment');
        expect(result).toBe('\\#comment');
      });

      it('转义 $', () => {
        const result = escapeFormulaPunctuations('$100');
        expect(result).toBe('\\$100');
      });

      it('转义 %', () => {
        const result = escapeFormulaPunctuations('50%');
        expect(result).toBe('50\\%');
      });

      it('转义 *', () => {
        const result = escapeFormulaPunctuations('a * b');
        expect(result).toBe('a \\* b');
      });

      it('转义 +', () => {
        const result = escapeFormulaPunctuations('a + b');
        expect(result).toBe('a \\+ b');
      });

      it('转义 -', () => {
        const result = escapeFormulaPunctuations('a - b');
        expect(result).toBe('a \\- b');
      });

      it('转义 .', () => {
        const result = escapeFormulaPunctuations('3.14');
        expect(result).toBe('3\\.14');
      });

      it('转义 /', () => {
        const result = escapeFormulaPunctuations('a/b');
        expect(result).toBe('a\\/b');
      });

      it('转义 :', () => {
        const result = escapeFormulaPunctuations('a:b');
        expect(result).toBe('a\\:b');
      });

      it('转义 ;', () => {
        const result = escapeFormulaPunctuations('a;b');
        expect(result).toBe('a\\;b');
      });

      it('转义 =', () => {
        const result = escapeFormulaPunctuations('a = b');
        expect(result).toBe('a \\= b');
      });

      it('转义 ?', () => {
        const result = escapeFormulaPunctuations('why?');
        expect(result).toBe('why\\?');
      });

      it('转义 @', () => {
        const result = escapeFormulaPunctuations('@user');
        expect(result).toBe('\\@user');
      });

      it('转义 [', () => {
        const result = escapeFormulaPunctuations('[array]');
        expect(result).toContain('\\[');
      });

      it('转义 ]', () => {
        const result = escapeFormulaPunctuations('[array]');
        expect(result).toContain('\\]');
      });

      it('转义 \\', () => {
        const result = escapeFormulaPunctuations('a\\b');
        expect(result).toBe('a\\\\b');
      });

      it('转义 ^', () => {
        const result = escapeFormulaPunctuations('x^2');
        expect(result).toBe('x\\^2');
      });

      it('转义 _', () => {
        const result = escapeFormulaPunctuations('x_1');
        expect(result).toBe('x\\_1');
      });

      it('转义 `', () => {
        const result = escapeFormulaPunctuations('`code`');
        expect(result).toBe('\\`code\\`');
      });

      it('转义 {', () => {
        const result = escapeFormulaPunctuations('{set}');
        expect(result).toContain('\\{');
      });

      it('转义 }', () => {
        const result = escapeFormulaPunctuations('{set}');
        expect(result).toContain('\\}');
      });

      it('转义 |', () => {
        const result = escapeFormulaPunctuations('a|b');
        expect(result).toBe('a\\|b');
      });

      it('转义 ~', () => {
        const result = escapeFormulaPunctuations('~approx');
        expect(result).toBe('\\~approx');
      });

      it('转义 (', () => {
        const result = escapeFormulaPunctuations('(x)');
        expect(result).toContain('\\(');
      });

      it('转义 )', () => {
        const result = escapeFormulaPunctuations('(x)');
        expect(result).toContain('\\)');
      });
    });

    describe('数学公式场景', () => {
      it('简单数学表达式', () => {
        const result = escapeFormulaPunctuations('x + y = z');
        expect(result).toBe('x \\+ y \\= z');
      });

      it('幂运算', () => {
        const result = escapeFormulaPunctuations('x^2 + y^2');
        expect(result).toBe('x\\^2 \\+ y\\^2');
      });

      it('下标', () => {
        const result = escapeFormulaPunctuations('a_1 + a_2');
        expect(result).toBe('a\\_1 \\+ a\\_2');
      });

      it('分数形式', () => {
        const result = escapeFormulaPunctuations('a/b');
        expect(result).toBe('a\\/b');
      });

      it('集合表示', () => {
        const result = escapeFormulaPunctuations('{x | x > 0}');
        // > 会被转为 HTML 实体
        expect(result).toContain('\\{');
        expect(result).toContain('\\|');
        expect(result).toContain('&gt;');
        expect(result).toContain('\\}');
      });

      it('绝对值', () => {
        const result = escapeFormulaPunctuations('|x|');
        expect(result).toBe('\\|x\\|');
      });

      it('括号嵌套', () => {
        const result = escapeFormulaPunctuations('[(a + b) * c]');
        expect(result).toContain('\\[');
        expect(result).toContain('\\(');
        expect(result).toContain('\\)');
        expect(result).toContain('\\]');
      });
    });

    describe('纯文本不受影响', () => {
      it('字母数字不转义', () => {
        const result = escapeFormulaPunctuations('abc123');
        expect(result).toBe('abc123');
      });

      it('空格不转义', () => {
        const result = escapeFormulaPunctuations('hello world');
        expect(result).toBe('hello world');
      });

      it('中文不转义', () => {
        const result = escapeFormulaPunctuations('你好世界');
        expect(result).toBe('你好世界');
      });

      it('空字符串', () => {
        const result = escapeFormulaPunctuations('');
        expect(result).toBe('');
      });
    });

    describe('复杂公式', () => {
      it('求和公式', () => {
        const result = escapeFormulaPunctuations('sum_{i=1}^{n} a_i');
        expect(result).toContain('\\_');
        expect(result).toContain('\\^');
        expect(result).toContain('\\{');
        expect(result).toContain('\\}');
        expect(result).toContain('\\=');
      });

      it('积分公式', () => {
        const result = escapeFormulaPunctuations('int_a^b f(x) dx');
        expect(result).toContain('\\_');
        expect(result).toContain('\\^');
        expect(result).toContain('\\(');
        expect(result).toContain('\\)');
      });

      it('矩阵', () => {
        const result = escapeFormulaPunctuations('[a & b; c & d]');
        expect(result).toContain('\\[');
        expect(result).toContain('&amp;');
        expect(result).toContain('\\;');
        expect(result).toContain('\\]');
      });

      it('不等式', () => {
        const result = escapeFormulaPunctuations('a < b <= c');
        expect(result).toContain('&lt;');
        expect(result).toContain('\\=');
      });

      it('逻辑表达式', () => {
        const result = escapeFormulaPunctuations('A & B | C');
        expect(result).toContain('&amp;');
        expect(result).toContain('\\|');
      });
    });

    describe('边界情况', () => {
      it('连续标点', () => {
        const result = escapeFormulaPunctuations('!!!');
        expect(result).toBe('\\!\\!\\!');
      });

      it('连续 HTML 特殊字符', () => {
        const result = escapeFormulaPunctuations('<<<');
        expect(result).toBe('&lt;&lt;&lt;');
      });

      it('混合标点和 HTML 特殊字符', () => {
        const result = escapeFormulaPunctuations('!<@>');
        expect(result).toContain('\\!');
        expect(result).toContain('&lt;');
        expect(result).toContain('\\@');
        expect(result).toContain('&gt;');
      });
    });
  });
});
