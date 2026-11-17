import { editorViewCtx } from '@milkdown/kit/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { echarts, tableChart } from '../src/renderers/echarts';
import { createTestEditor, type TestCherryMilkdownInstance } from './helpers/create-editor';

vi.mock('echarts', () => {
  throw new Error('Simulated ECharts module failure');
});

let instance: TestCherryMilkdownInstance | undefined;
afterEach(async () => {
  await instance?.destroy();
  instance = undefined;
  document.body.replaceChildren();
});

it('reports a chart module failure and retains the document for editing', async () => {
  const root = document.createElement('div');
  document.body.append(root);
  const onError = vi.fn();
  const value = 'Editable\n\n```echarts\n{"series":[]}\n```';
  instance = await createTestEditor({ el: root, value, renderers: { echarts }, onError });
  await vi.waitFor(() => expect(onError).toHaveBeenCalled());
  const [error, phase] = onError.mock.calls[0];
  expect(phase).toBe('render');
  expect(String((error as { cause?: unknown }).cause)).toContain('Simulated ECharts module failure');
  expect(root.querySelector('[data-render-error="true"] [role="alert"]')).not.toBeNull();
  const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
  view.dispatch(view.state.tr.insertText('X', 2));
  expect(instance.getMarkdown()).toContain('EXditable');
  expect(instance.getMarkdown()).toContain('```echarts\n{"series":[]}\n```');
});

it('reports a table chart module failure while preserving table and ordinary text', async () => {
  const root = document.createElement('div');
  document.body.append(root);
  const onError = vi.fn();
  const table = '| :line: | Value |\n| --- | --- |\n| A | 1 |';
  instance = await createTestEditor({ el: root, value: `Editable\n\n${table}`, renderers: { tableChart }, onError });
  await vi.waitFor(() => expect(onError).toHaveBeenCalled());
  const [error, phase] = onError.mock.calls[0];
  expect(phase).toBe('render');
  expect(String((error as { cause?: unknown }).cause)).toContain('Simulated ECharts module failure');
  expect(root.querySelector('[data-render-error="true"] [role="alert"]')).not.toBeNull();
  const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
  view.dispatch(view.state.tr.insertText('X', 2));
  expect(instance.getMarkdown()).toContain('EXditable');
  expect(instance.getMarkdown()).toContain(table);
});
