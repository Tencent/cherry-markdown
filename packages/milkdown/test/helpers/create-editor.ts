import type { Editor } from '@milkdown/kit/core';
import { cherryMilkdown, type CherryMilkdownInstance, type CherryMilkdownOptions } from '../../src';
import { getInternalEditor } from '../../src/editor';

interface TestEditorOptions extends Omit<CherryMilkdownOptions, 'root'> {
  el: HTMLElement;
}

/** Test-only alias retaining the existing fixture call shape. */
export async function createTestEditor(options: TestEditorOptions): Promise<TestCherryMilkdownInstance> {
  const { el, ...editorOptions } = options;
  const instance = await cherryMilkdown({ root: el, ...editorOptions });
  return Object.assign(instance, { editor: getInternalEditor(instance) });
}

export type TestCherryMilkdownInstance = CherryMilkdownInstance & { editor: Editor };

export function editorShadow(container: ParentNode = document): ShadowRoot {
  const root = container.querySelector('[data-cherry-milkdown]')?.shadowRoot;
  if (!root) throw new Error('Expected a mounted Milkdown editor');
  return root;
}
