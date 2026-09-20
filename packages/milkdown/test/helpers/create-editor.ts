import { cherryMilkdown, type CherryMilkdownInstance, type CherryMilkdownOptions } from '../../src';

interface TestEditorOptions extends Omit<CherryMilkdownOptions, 'root'> {
  el: HTMLElement;
}

/** Test-only alias retaining the existing fixture call shape. */
export function createTestEditor(options: TestEditorOptions): Promise<CherryMilkdownInstance> {
  const { el, ...editorOptions } = options;
  return cherryMilkdown({ root: el, ...editorOptions });
}
