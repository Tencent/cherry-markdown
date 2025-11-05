# 正确的测试示例

基于对Cherry Markdown源码的分析，正确的测试方式是：

## Paragraph测试示例
```typescript
import { describe, it, expect } from 'vitest';
import Paragraph from '../../../src/core/hooks/Paragraph';

describe('core/hooks/paragraph', () => {
  it('should parse simple paragraph', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'This is a simple paragraph';
    // sentenceMakeFunc是处理行内语法的函数，由引擎传递
    const sentenceMakeFunc = (text: string) => ({ html: text, sign: text });
    
    // makeHtml接受两个参数：文本和sentenceMakeFunc，返回字符串
    const result = paragraphHook.makeHtml(input, sentenceMakeFunc);
    
    // 直接验证返回的字符串，不使用result.html
    expect(result).toContain('<p>');
    expect(result).toContain('This is a simple paragraph');
  });
});
```

## 关键点：
1. **beforeMakeHtml/makeHtml/afterMakeHtml都直接返回字符串**，不是对象
2. **makeHtml的第二个参数是sentenceMakeFunc**，用于处理行内语法
3. **应该直接验证result**，而不是result.html
4. **sentenceMakeFunc应该返回对象** `{html: string, sign: string}`

## 错误的方式：
```typescript
// ❌ 错误：传入了多余的参数
let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
// ❌ 错误：期望返回对象而不是字符串
expect(result.html).toContain('<p>');
```

## 正确的方式：
```typescript
// ✅ 正确：只传一个参数给makeHtml
const sentenceMakeFunc = (text: string) => ({ html: text, sign: text });
const result = paragraphHook.makeHtml(input, sentenceMakeFunc);
// ✅ 正确：直接验证字符串
expect(result).toContain('<p>');
```
