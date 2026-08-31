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
    }
  });

  it('covers the native-source structures required by the browser gate', () => {
    const ids = new Set(cherryCompatibilityCases.map(({ id }) => id));
    for (const required of ['table-chart', 'toc', 'html', 'mermaid', 'echarts-code']) {
      expect(ids.has(required)).toBe(true);
    }
  });
});
