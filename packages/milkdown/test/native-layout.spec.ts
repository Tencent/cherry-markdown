import { describe, expect, it } from 'vitest';
import { updateImageLayout, updateMermaidLayout } from '../src/native-layout';

describe('native Cherry layout directives', () => {
  it('updates image size without losing decorations or alignment', () => {
    expect(updateImageLayout('dog#100px#80px#B#S#center', { width: 160, height: 120 })).toBe(
      'dog#160px#120px#B#S#center',
    );
    expect(updateImageLayout('dog#B#center', { type: 'border' })).toBe('dog#center');
    expect(updateImageLayout('dog#S#center', { type: 'right' })).toBe('dog#S#right');
  });

  it('updates only the Mermaid fence layout and preserves source', () => {
    const source = '```mermaid #100px #center\ngraph LR\nA-->B\n```';
    expect(updateMermaidLayout(source, { width: 240, height: 160 })).toBe(
      '```mermaid #240px #160px #center\ngraph LR\nA-->B\n```',
    );
    expect(updateMermaidLayout(source, { type: 'float-right' })).toBe(
      '```mermaid #100px #float-right\ngraph LR\nA-->B\n```',
    );
  });
});
