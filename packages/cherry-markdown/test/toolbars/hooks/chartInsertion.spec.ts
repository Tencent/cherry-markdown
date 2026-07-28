import { describe, expect, it, vi } from 'vite-plus/test';
import Graph from '../../../src/toolbars/hooks/Graph';
import ProTable from '../../../src/toolbars/hooks/ProTable';
import { createMenuContext } from '../../helpers/menu';

function createGraph(locale = 'zh_CN') {
  const context = createMenuContext();
  Object.assign(context.cherry, { options: { locale } });
  return new Graph(context.cherry as never);
}

function createProTable() {
  const context = createMenuContext();
  Object.assign(context.cherry, { options: { locale: 'zh_CN' } });
  return new ProTable(context.cherry as never);
}

describe('toolbars/hooks chart insertion', () => {
  it('creates all localized Mermaid examples from numeric and named shortcuts', () => {
    const graph = createGraph();
    const types = [
      ['1', 'flow'],
      ['2', 'sequence'],
      ['3', 'state'],
      ['4', 'class'],
      ['5', 'pie'],
      ['6', 'gantt'],
    ] as const;

    for (const [shortcut, type] of types) {
      const result = graph.onClick('selected', shortcut);
      let marker: string = type;
      if (type === 'flow') {
        marker = 'graph LR';
      } else if (type === 'sequence') {
        marker = 'sequenceDiagram';
      }
      expect(result).toContain('```mermaid');
      expect(result).toContain(marker);
    }

    expect(graph.onClick('selected', 'pie')).toContain('title 饼图');
    expect(graph.onClick('selected', 'invalid' as never)).toBeUndefined();
    expect(graph.$getSampleCode('invalid')).toBeUndefined();
    expect(graph.getSubMenuConfig()).toHaveLength(6);
    expect(graph.afterClickCb).toBeTypeOf('function');
    const setLessSelection = vi.spyOn(graph, 'setLessSelection').mockImplementation(() => {});
    graph.$afterClick();
    expect(setLessSelection).toHaveBeenCalledWith('\n\n\n\n\n', '\n\n');
  });

  it('uses the English Mermaid examples outside Chinese locales', () => {
    const graph = createGraph('en_US');

    expect(graph.$getSampleCode('flow')).toContain('Company');
    expect(graph.onClick('', 'sequence')).toContain('text1');
    expect(graph.onClick('', '6')).toContain('title work');
  });

  it('generates every supported ECharts table source', () => {
    const table = createProTable();
    const types = [
      'lineTable',
      'barTable',
      'radarTable',
      'mapTable',
      'heatmapTable',
      'pieTable',
      'scatterTable',
      'sankeyTable',
    ];

    expect(table.getSubMenuConfig()).toHaveLength(types.length);
    for (const type of types) {
      const result = table.onClick('prefix', type as never);
      expect(result).toContain('prefix\n\n');
      expect(result).toContain(`:${type.replace('Table', '')}`);
    }

    expect(table.onClick('prefix', 'unknown' as never)).toContain(':line:');
  });

  it('uses localized titles and preserves the default line chart path', () => {
    const table = createProTable();

    expect(table.onClick('', 'lineTable' as never)).toContain('"title": "lineTable"');
    expect(table.onClick('', '')).toContain(':line:');
    expect(table.onClick('', 'sankeyTable' as never)).toContain('sankeyTable');
  });
});
