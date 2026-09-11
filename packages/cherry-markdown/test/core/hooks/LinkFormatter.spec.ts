import { describe, expect, it, afterEach } from 'vite-plus/test';
import LinkFormatter from '../../../src/core/hooks/LinkFormatter';
import Link from '../../../src/core/hooks/Link';
import UrlCache from '../../../src/UrlCache';

function createLinkFormatter() {
  return new LinkFormatter();
}

function createLinkHook() {
  const hook = new Link({ config: {}, globalConfig: {} });
  Object.defineProperty(hook, '$engine', {
    value: {
      urlProcessor: (url: string) => url,
      $cherry: {
        options: {
          engine: {
            syntax: {
              link: { attrRender: () => '' },
            },
          },
        },
      },
    },
  });
  return hook;
}

afterEach(() => {
  UrlCache.clear();
});

describe('core/hooks/LinkFormatter', () => {
  it('escapes ~D inside link text and URL during beforeMakeHtml', () => {
    const formatter = createLinkFormatter();
    const input = 'plain ~D outside [price ~D5](https://example.com/~Dvalue) tail';
    const escaped = formatter.beforeMakeHtml(input);

    // 链接内部的 ~D 被替换为占位符
    expect(escaped).toContain('[price ~1D5](https://example.com/~1Dvalue)');
    // 链接外的 ~D 保持原样，避免误伤
    expect(escaped).toContain('plain ~D outside ');
    expect(escaped).toContain(' tail');
  });

  it('escapes \\[ \\] \\( \\) inside link text and URL', () => {
    const formatter = createLinkFormatter();
    const input = 'ctx [a\\[b\\]c](https://example.com/x\\(y\\)z) ctx';
    const escaped = formatter.beforeMakeHtml(input);

    expect(escaped).toContain('[a~1LBb~1RBc](https://example.com/x~1LPy~1RPz)');
    // 上下文中的 \[ 与 \( 未被替换
    expect(escaped).toBe('ctx [a~1LBb~1RBc](https://example.com/x~1LPy~1RPz) ctx');
  });

  it('does not touch \\[ \\( that appear outside of links', () => {
    const formatter = createLinkFormatter();
    const input = 'formula: \\[x=1\\] and \\(y=2\\), no link here';

    expect(formatter.beforeMakeHtml(input)).toBe(input);
  });

  it('afterMakeHtml restores all escape placeholders back to their original characters', () => {
    const formatter = createLinkFormatter();
    const input = '[price ~D5 \\[unit\\]](https://example.com/x\\(y\\)/~Dq)';
    const escaped = formatter.beforeMakeHtml(input);
    const restored = formatter.afterMakeHtml(escaped);

    expect(restored).toBe(input);
  });

  it('handles empty and null-ish input gracefully', () => {
    const formatter = createLinkFormatter();

    expect(formatter.beforeMakeHtml('')).toBe('');
    // @ts-expect-error 明确传入 undefined 验证兜底
    expect(formatter.beforeMakeHtml(undefined)).toBe(undefined);
    expect(formatter.afterMakeHtml('')).toBe('');
  });

  it('leaves non-link text unchanged in both phases', () => {
    const formatter = createLinkFormatter();
    const input = 'no link content, ~D and \\[ should stay';

    expect(formatter.beforeMakeHtml(input)).toBe(input);
    expect(formatter.afterMakeHtml(input)).toBe(input);
  });

  it('makeHtml is a no-op passthrough', () => {
    const formatter = createLinkFormatter();

    expect(formatter.makeHtml('anything')).toBe('anything');
  });

  it('integrates with Link hook: pre-escaped input is restored before Link.makeHtml runs', () => {
    const formatter = createLinkFormatter();
    const link = createLinkHook();

    const input = '[docs ~D](https://example.com/\\[q\\])';
    const escaped = formatter.beforeMakeHtml(input);
    // 段落阶段的 afterMakeHtml 会先执行，link 行内 hook 拿到的应是还原后的内容
    const restored = formatter.afterMakeHtml(escaped);
    const html = UrlCache.restoreAll(link.makeHtml(restored));

    expect(html).toContain('>docs ~D</a>');
    // 已成功渲染成 <a> 标签且不含任何 LinkFormatter 占位符残留
    expect(html).toMatch(/<a\s+href="https:\/\/example\.com\/[^"]+"/);
    expect(html).not.toContain('~1D');
    expect(html).not.toContain('~1LB');
    expect(html).not.toContain('~1RB');
  });

  it('protects link URL against math delimiter mis-detection in a math-heavy paragraph', () => {
    const formatter = createLinkFormatter();
    // 模拟经过 Engine.$encodeReservedKeywords 处理后的字符串：$ 已变 ~D
    // 完整段落里包含一个 URL 中含有 \[ 的链接，若不做保护，后续 MathBlock 会把 URL 里的 \[ 归一化成 ~D~D
    const input = 'total is ~D100, see [ref](https://a.com/\\[x\\]) done';
    const escaped = formatter.beforeMakeHtml(input);

    // 链接外的 ~D 不受影响
    expect(escaped).toContain('total is ~D100,');
    // 链接内的 \[ \] 已被替换为占位符，不会再被数学 hook 识别成公式定界符
    expect(escaped).toContain('(https://a.com/~1LBx~1RB)');
    expect(escaped).not.toMatch(/\(https:\/\/a\.com\/\\\[/);
  });
});
