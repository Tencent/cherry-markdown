import { ref } from 'vue';
import { cherryInstance } from '../CherryMarkdown';
import { setEditorInstance } from './useEditor';

export type CherryEditorInstance = ReturnType<typeof cherryInstance>;

interface UseCherryEditorOptions {
  onContentChanged: () => void;
}

export function useCherryEditor({ onContentChanged }: UseCherryEditorOptions) {
  const toolbarVisible = ref(true);
  let editor: CherryEditorInstance | null = null;
  let skipNextChange = true;

  const getEditor = (): CherryEditorInstance => {
    if (!editor) {
      throw new Error('Cherry Markdown editor is not initialized');
    }
    return editor;
  };

  const handleAfterChange = (): void => {
    if (skipNextChange) {
      skipNextChange = false;
      return;
    }
    onContentChanged();
  };

  const initEditor = (): void => {
    toolbarVisible.value = !document.querySelector('.cherry--no-toolbar');
    editor = cherryInstance();
    setEditorInstance(editor);
    editor.on('afterChange', handleAfterChange);
  };

  const setMarkdown = (markdown: string): void => {
    skipNextChange = true;
    getEditor().setMarkdown(markdown);
  };

  const getMarkdown = (): string => getEditor().getMarkdown();

  const scrollPreviewToTop = (): void => {
    getEditor().previewer.scrollToTop(0, 'instant');
  };

  const toggleToolbar = (): void => {
    getEditor().toolbar.toolbarHandlers.settings('toggleToolbar');
    toolbarVisible.value = !toolbarVisible.value;
  };

  const disposeEditor = (): void => {
    editor?.off?.('afterChange', handleAfterChange);
    setEditorInstance(null);
    editor = null;
  };

  return {
    toolbarVisible,
    getEditor,
    getMarkdown,
    initEditor,
    setMarkdown,
    scrollPreviewToTop,
    toggleToolbar,
    disposeEditor,
  };
}
