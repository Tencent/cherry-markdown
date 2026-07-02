import { describe, expect, it } from 'vitest';
import mergeWith from '@/utils/toolkit/mergeWith';
import { customizer } from '@/utils/config';

describe('utils/toolkit/mergeWith', () => {
  it('两参数深合并嵌套对象', () => {
    const target = { a: { b: 1 } };
    mergeWith(target, { a: { c: 2 } });
    expect(target).toEqual({ a: { b: 1, c: 2 } });
  });

  it('插件 install 场景：向 customRenderer 注入类实例', () => {
    class MermaidEngine {
      static TYPE = 'figure';
    }
    const cherryOptions = {
      engine: {
        syntax: {
          codeBlock: {
            customRenderer: {} as Record<string, unknown>,
          },
        },
      },
    };
    mergeWith(cherryOptions, {
      engine: {
        syntax: {
          codeBlock: {
            customRenderer: {
              mermaid: new MermaidEngine(),
            },
          },
        },
      },
    });
    expect(cherryOptions.engine.syntax.codeBlock.customRenderer.mermaid).toBeInstanceOf(MermaidEngine);
  });

  it('customizer 使数组整体替换', () => {
    const target = { arr: [1, 2] };
    mergeWith(target, { arr: [3] }, customizer);
    expect(target.arr).toEqual([3]);
  });

  it('Cherry 构造场景：多 source + customizer', () => {
    const defaults = { toolbars: { toolbar: ['bold'], config: { searcher: { enableReplace: true } } } };
    const options = { toolbars: { config: { searcher: { enableReplace: false } } } };
    const merged = mergeWith({}, defaults, options, customizer);
    expect(merged.toolbars.config.searcher.enableReplace).toBe(false);
  });

  it('多 source 依次合并', () => {
    const target = { a: 1 };
    mergeWith(target, { b: 2 }, { c: 3 });
    expect(target).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('customizer 返回具体值时覆盖默认逻辑', () => {
    const target = { n: 1 };
    mergeWith(target, { n: 2 }, (obj, src) => (typeof obj === 'number' ? obj + src : undefined));
    expect(target.n).toBe(3);
  });

  it('source 中 undefined 不覆盖 target 已有值', () => {
    const target = { a: 1 };
    mergeWith(target, { a: undefined });
    expect(target.a).toBe(1);
  });
});
