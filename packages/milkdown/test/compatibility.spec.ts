import { describe, expect, it } from 'vitest';
import { cherryCompatibilityCases } from './fixtures/compatibility';

describe('Cherry compatibility manifest', () => {
  it('has unique ids and an explicit handling mode for every case', () => {
    const ids = cherryCompatibilityCases.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(cherryCompatibilityCases).not.toHaveLength(0);
    for (const item of cherryCompatibilityCases) {
      expect(['structured', 'native-source', 'passthrough']).toContain(item.mode);
      expect(item.markdown.trim()).not.toBe('');
      expect(Boolean(item.selector || item.expectedText), `${item.id} browser assertion`).toBe(true);
      expect(item.interaction.create).toBeTruthy();
      expect(item.interaction.focus).toBeTruthy();
      expect(item.interaction.modify).toBeTruthy();
      expect(item.interaction.delete).toBeTruthy();
      expect(item.interaction.expectedMarkdown).toBe(item.markdown);
      expect(item.interaction.expectedDom).toBeTruthy();
      expect(item.interaction.sync).toContain('Milkdown');
    }
  });

  it('covers the native-source structures required by the browser gate', () => {
    const ids = new Set(cherryCompatibilityCases.map(({ id }) => id));
    for (const required of ['table-chart', 'toc', 'html', 'mermaid', 'echarts-code']) {
      expect(ids.has(required)).toBe(true);
    }
  });

  it('marks compound layouts as structurally editable', () => {
    for (const id of ['panel', 'detail', 'tabs', 'timeline']) {
      const item = cherryCompatibilityCases.find((candidate) => candidate.id === id);
      expect(item?.mode, id).toBe('structured');
      expect(item?.interaction.structured, id).toBe(true);
    }
  });
});
