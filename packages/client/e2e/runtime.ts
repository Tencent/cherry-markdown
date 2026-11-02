import { createPinia, setActivePinia } from 'pinia';
import 'cherry-markdown/dist/cherry-markdown.css';
import '../src/components/composables/milkdownAdapter';
import { usePreferencesStore } from '../src/store';
import { useEditorAdapter } from '../src/components/composables/useEditorAdapter';

setActivePinia(createPinia());
const preferences = usePreferencesStore();
preferences.setEngine('cherry');
let changes = 0;
const controller = useEditorAdapter({
  onContentChanged: () => {
    changes += 1;
  },
});
controller.setMarkdown('Initial');
await controller.initEditor();

const api = {
  setMarkdown: controller.setMarkdown,
  getMarkdown: controller.getMarkdown,
  clearUndoRedo: controller.clearUndoRedo,
  dispose: controller.disposeEditor,
  changes: () => changes,
  switch: async (engine: 'cherry' | 'milkdown') => {
    preferences.setEngine(engine);
    await controller.initEditor();
  },
};
declare global {
  interface Window {
    clientEditor: typeof api;
  }
}
window.clientEditor = api;
