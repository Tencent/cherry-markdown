import { editorViewCtx, parserCtx } from '@milkdown/kit/core';
import type { Node } from '@milkdown/kit/prose/model';
import { describe, expect, it } from 'vitest';
import { createTestEditor } from './helpers/create-editor';

const literalCases = [
  ['indented', '    [[toc]]', '[[toc]]'],
  ['unclosed', '```text\n[[toc]]', '[[toc]]'],
  ['longer closer', '```text\n[[toc]]\n````', '[[toc]]'],
  ['different closer indentation', ' ```text\n[[toc]]\n  ```', '[[toc]]'],
  ['tilde fence', '~~~text\n[[toc]]\n~~~~', '[[toc]]'],
  ['CRLF', '```text\r\n[[toc]]\r\n```', '[[toc]]'],
  ['nested in list', '- item\n\n      [[toc]]', '[[toc]]'],
  ['nested in quote', '> ```text\n> [[toc]]\n> ```', '[[toc]]'],
  ['panel example', '```text\n:::info Example\ncontent\n:::\n````', ':::info Example\ncontent\n:::'],
  ['detail example', '```text\n+++ Example\ncontent\n+++\n````', '+++ Example\ncontent\n+++'],
  ['reference example', '```text\n[label]: https://example.com\n````', '[label]: https://example.com'],
] as const;

function codeValues(doc: Node) {
  const values: string[] = [];
  doc.descendants((node) => {
    if (node.type.name === 'code_block') values.push(node.textContent);
    expect(node.type.name).not.toMatch(/^cherry_(?:toc|panel|detail|comment_definition)$/);
  });
  return values;
}

describe('Markdown literal boundaries', () => {
  it('does not use reference definitions from code when native blocks split the document', async () => {
    const el = document.body.appendChild(document.createElement('div'));
    const instance = await createTestEditor({
      el,
      value:
        '[ref]: https://example.com/real\n\n[[toc]]\n\n[link][ref]\n\n```text\n[ref]: https://example.com/code\n```',
    });
    try {
      const doc = instance.editor.action((ctx) => ctx.get(editorViewCtx).state.doc);
      const links: string[] = [];
      doc.descendants((node) =>
        node.marks.forEach((mark) => {
          if (mark.type.name === 'link') links.push(mark.attrs.href);
        }),
      );
      expect(links).toEqual(['https://example.com/real']);
    } finally {
      await instance.destroy();
      el.remove();
    }
  });

  it('keeps directives inside authored HTML on the HTML source path', async () => {
    const el = document.body.appendChild(document.createElement('div'));
    const source = '<div>\n[[toc]]\n</div>';
    const instance = await createTestEditor({ el, value: source });
    try {
      const doc = instance.editor.action((ctx) => ctx.get(editorViewCtx).state.doc);
      expect(doc.firstChild?.type.name).toBe('cherry_html_block');
      expect(doc.firstChild?.attrs.source).toBe(source);
      expect(instance.getMarkdown()).toBe(source);
    } finally {
      await instance.destroy();
      el.remove();
    }
  });

  it.each(literalCases)('preserves %s code through edit, save and reload', async (_label, source, value) => {
    const el = document.body.appendChild(document.createElement('div'));
    const instance = await createTestEditor({ el, value: source });
    try {
      const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
      expect(codeValues(view.state.doc)).toEqual([value]);
      expect(instance.getMarkdown()).toBe(source);
      view.dispatch(view.state.tr.insertText('tail', view.state.doc.content.size - 1));
      const saved = instance.getMarkdown();
      const parsed = instance.editor.action((ctx) => ctx.get(parserCtx)(saved));
      expect(codeValues(parsed!)).toEqual([value]);
      instance.setMarkdown(saved);
      expect(codeValues(view.state.doc)).toEqual([value]);
    } finally {
      await instance.destroy();
      el.remove();
    }
  });

  it.each(['```custom-chart\npayload', '~~~custom-chart\npayload\n~~~~'])(
    'uses the parsed payload for a visual fence: %s',
    async (source) => {
      const el = document.body.appendChild(document.createElement('div'));
      const instance = await createTestEditor({ el, value: source, renderers: { 'custom-chart': () => {} } });
      try {
        const doc = instance.editor.action((ctx) => ctx.get(editorViewCtx).state.doc);
        expect(doc.firstChild?.type.name).toBe('cherry_diagram');
        expect(doc.firstChild?.attrs.value).toBe('payload');
        expect(instance.getMarkdown()).toBe(source);
      } finally {
        await instance.destroy();
        el.remove();
      }
    },
  );
});
