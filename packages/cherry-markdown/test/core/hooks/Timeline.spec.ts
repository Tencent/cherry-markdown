import { describe, it, expect } from 'vitest';
import CherryEngine from '../../../src/index.engine.core';

function createEngine(overrides: Record<string, any> = {}): any {
  return new CherryEngine({
    engine: {
      global: { classicBr: false },
      syntax: {
        header: { anchorStyle: 'none' },
        ...overrides,
      },
    },
  });
}

describe('core/hooks/timeline', () => {
  describe('makeHtml via CherryEngine', () => {
    it('renders basic timeline', () => {
      const engine = createEngine();
      const md = ':::timeline project\n:: [done] 2024-01-15 A\n:: [doing] 2024-03-20 B\n:: [todo] 2024-06-01 C\n:::';
      const html = engine.makeHtml(md);
      expect(html).toContain('cherry-timeline');
      expect(html).toContain('cherry-timeline--item__done');
      expect(html).toContain('cherry-timeline--item__doing');
      expect(html).toContain('cherry-timeline--item__todo');
    });

    it('milestone status', () => {
      const engine = createEngine();
      const md = ':::timeline\n:: [milestone] M\n:::';
      const html = engine.makeHtml(md);
      expect(html).toContain('cherry-timeline--item__milestone');
    });

    it('error status', () => {
      const engine = createEngine();
      const md = ':::timeline\n:: [error] E\n:::';
      const html = engine.makeHtml(md);
      expect(html).toContain('cherry-timeline--item__error');
    });

    it('unicode aliases', () => {
      const engine = createEngine();
      const md = ':::timeline\n:: [\u2713] done\n:: [\u2026] doing\n:: [\u2605] mile\n:: [\u2717] err\n:::';
      const html = engine.makeHtml(md);
      expect(html).toContain('cherry-timeline--item__done');
      expect(html).toContain('cherry-timeline--item__doing');
      expect(html).toContain('cherry-timeline--item__milestone');
      expect(html).toContain('cherry-timeline--item__error');
    });

    it('ascii aliases x * ! ~', () => {
      const engine = createEngine();
      const md = ':::timeline\n:: [x] x-done\n:: [*] star\n:: [!] err\n:: [~] doing\n:::';
      const html = engine.makeHtml(md);
      expect(html).toContain('cherry-timeline--item__done');
      expect(html).toContain('cherry-timeline--item__milestone');
      expect(html).toContain('cherry-timeline--item__error');
      expect(html).toContain('cherry-timeline--item__doing');
    });

    it('~ alias in isolation', () => {
      const engine = createEngine();
      const md = ':::timeline\n:: [~] test\n:::';
      const html = engine.makeHtml(md);
      expect(html).toContain('cherry-timeline--item__doing');
    });

    it('× alias maps to error', () => {
      const engine = createEngine();
      const md = ':::timeline\n:: [×] cross\n:::';
      const html = engine.makeHtml(md);
      expect(html).toContain('cherry-timeline--item__error');
    });

    it('no status defaults to todo', () => {
      const engine = createEngine();
      const md = ':::timeline\n:: 2024-01-01 plain\n:::';
      const html = engine.makeHtml(md);
      expect(html).toContain('cherry-timeline--item__todo');
    });

    it('empty timeline', () => {
      const engine = createEngine();
      const md = ':::timeline empty\n\n:::';
      const html = engine.makeHtml(md);
      expect(html).toContain('cherry-timeline');
    });

    it('disabled', () => {
      const engine = createEngine({ panel: { enableTimeline: false } });
      const md = ':::timeline\n:: [done] A\n:::';
      const html = engine.makeHtml(md);
      expect(html).not.toContain('cherry-timeline');
    });

    it('not timeline panel', () => {
      const engine = createEngine();
      const md = ':::warning\ncontent\n:::';
      const html = engine.makeHtml(md);
      expect(html).toContain('cherry-panel');
      expect(html).not.toContain('cherry-timeline');
    });
  });
});
