import { describe, it, expect, vi } from 'vitest';
import Table from '../../../src/core/hooks/Table';

/**
 * 创建 Table hook 实例用于测试
 */
function createTableHook(config = {}, externals = {}, cherry = null) {
  const hook = new Table({
    externals,
    config: {
      enableChart: false,
      selfClosing: false,
      ...config,
    },
    cherry,
  }) as any;

  // Mock $engine
  hook.$engine = {
    hash: (str: string) => `hash_${str}`,
    $cherry: cherry || {
      options: {
        engine: {
          global: {},
        },
      },
    },
  };

  return hook;
}

describe('core/hooks/Table', () => {
  describe('第1批：基础方法测试', () => {
    describe('$extendColumns', () => {
      it('当 colCount <= row.length 时，原样返回 row', () => {
        const hook = createTableHook();
        const row = ['a', 'b', 'c'];
        // colCount = 2, row.length = 3, delta < 1
        expect(hook.$extendColumns(row, 2)).toBe(row);
        // colCount = 3, row.length = 3, delta = 0
        expect(hook.$extendColumns(row, 3)).toBe(row);
      });

      it('当 colCount > row.length 时，扩展列数', () => {
        const hook = createTableHook();
        const row = ['a', 'b'];
        // colCount = 4, row.length = 2, delta = 2
        const result = hook.$extendColumns(row, 4);
        expect(result.length).toBe(4);
        expect(result[0]).toBe('a');
        expect(result[1]).toBe('b');
        // 扩展的列应该是 &nbsp;
        expect(result[2]).toBe('&nbsp;');
        expect(result[3]).toBe('&nbsp;');
      });

      it('扩展1列时正常工作', () => {
        const hook = createTableHook();
        const row = ['a', 'b', 'c'];
        const result = hook.$extendColumns(row, 4);
        expect(result.length).toBe(4);
        expect(result[3]).toBe('&nbsp;');
      });
    });

    describe('$parseChartOptions', () => {
      it('chartRenderEngine 未初始化时返回 null', () => {
        const hook = createTableHook();
        expect(hook.chartRenderEngine).toBeNull();
        expect(hook.$parseChartOptions(':bar:')).toBeNull();
      });

      it('单元格不符合图表语法时返回 null', () => {
        const hook = createTableHook({ enableChart: true });
        // 如果没有实际的 ChartRenderEngine，chartRenderEngine 仍然是 null
        expect(hook.$parseChartOptions('normal cell')).toBeNull();
      });

      it('匹配图表语法时返回解析结果', () => {
        const hook = createTableHook();
        // 手动设置 chartRenderEngine 以测试解析逻辑
        hook.chartRenderEngine = {};

        const result = hook.$parseChartOptions(':bar:');
        expect(result).toEqual({ type: 'bar', options: {} });
      });

      it('解析带选项的图表语法', () => {
        const hook = createTableHook();
        hook.chartRenderEngine = {};

        const result = hook.$parseChartOptions(':line: { "title": "My Chart" }');
        expect(result.type).toBe('line');
        expect(result.options).toEqual({ title: 'My Chart' });
      });

      it('图表类型匹配各种类型', () => {
        const hook = createTableHook();
        hook.chartRenderEngine = {};

        expect(hook.$parseChartOptions(':pie:')?.type).toBe('pie');
        expect(hook.$parseChartOptions(':line:')?.type).toBe('line');
        expect(hook.$parseChartOptions(':scatter:')?.type).toBe('scatter');
      });
    });

    describe('$parseColumnAlignRules', () => {
      it('解析左对齐规则', () => {
        const hook = createTableHook();
        const { textAlignRules, COLUMN_ALIGN_MAP } = hook.$parseColumnAlignRules([':---', ':--']);

        expect(textAlignRules[0]).toBe('L'); // :--- => L (left)
        expect(textAlignRules[1]).toBe('L'); // :--  => L (left)
        expect(COLUMN_ALIGN_MAP['L']).toBe('left');
      });

      it('解析右对齐规则', () => {
        const hook = createTableHook();
        const { textAlignRules } = hook.$parseColumnAlignRules(['---:', '--:']);

        expect(textAlignRules[0]).toBe('R'); // ---: => R (right)
        expect(textAlignRules[1]).toBe('R'); // --:  => R (right)
      });

      it('解析居中对齐规则', () => {
        const hook = createTableHook();
        const { textAlignRules, COLUMN_ALIGN_MAP } = hook.$parseColumnAlignRules([':---:', ':-:']);

        expect(textAlignRules[0]).toBe('C'); // :---: => C (center)
        expect(textAlignRules[1]).toBe('C'); // :-:   => C (center)
        expect(COLUMN_ALIGN_MAP['C']).toBe('center');
      });

      it('解析默认（无对齐）规则', () => {
        const hook = createTableHook();
        const { textAlignRules, COLUMN_ALIGN_MAP } = hook.$parseColumnAlignRules(['---', '--']);

        expect(textAlignRules[0]).toBe('U'); // --- => U (undefined)
        expect(textAlignRules[1]).toBe('U'); // --  => U (undefined)
        expect(COLUMN_ALIGN_MAP['U']).toBeUndefined();
      });

      it('解析混合对齐规则', () => {
        const hook = createTableHook();
        const { textAlignRules, COLUMN_ALIGN_MAP } = hook.$parseColumnAlignRules([':---', '---:', ':---:', '---']);

        expect(textAlignRules).toEqual(['L', 'R', 'C', 'U']);
        expect(COLUMN_ALIGN_MAP).toEqual({ L: 'left', R: 'right', C: 'center' });
      });
    });

    describe('$testHeadEmpty', () => {
      it('空字符串返回 false', () => {
        const hook = createTableHook();
        expect(hook.$testHeadEmpty('')).toBe(false);
      });

      it('只有空格返回 false', () => {
        const hook = createTableHook();
        expect(hook.$testHeadEmpty('   ')).toBe(false);
      });

      it('只有 &nbsp; 返回 false', () => {
        const hook = createTableHook();
        expect(hook.$testHeadEmpty('&nbsp;')).toBe(false);
      });

      it('有实际内容返回 true', () => {
        const hook = createTableHook();
        expect(hook.$testHeadEmpty('Header')).toBe(true);
        expect(hook.$testHeadEmpty('~CTHU Content ~CTH$')).toBe(true);
      });

      it('忽略表格标记后判断内容', () => {
        const hook = createTableHook();
        // 只有标记，没有内容
        expect(hook.$testHeadEmpty('~CTHU~CTH$')).toBe(false);
        expect(hook.$testHeadEmpty('~CTHL~CTH$')).toBe(false);
        expect(hook.$testHeadEmpty('~CTHR~CTH$')).toBe(false);
        expect(hook.$testHeadEmpty('~CTHC~CTH$')).toBe(false);
      });

      it('包含标记和内容返回 true', () => {
        const hook = createTableHook();
        expect(hook.$testHeadEmpty('~CTHU Header ~CTH$')).toBe(true);
      });
    });

    describe('constructor - 图表引擎初始化', () => {
      it('enableChart 为 false 时不初始化 chartRenderEngine', () => {
        const hook = createTableHook({ enableChart: false });
        expect(hook.chartRenderEngine).toBeNull();
      });

      it('selfClosing 配置正确存储', () => {
        const hook = createTableHook({ selfClosing: true });
        expect(hook.selfClosing).toBe(true);
      });

      it('默认 selfClosing 为 false', () => {
        const hook = createTableHook();
        expect(hook.selfClosing).toBe(false);
      });
    });
  });
});
