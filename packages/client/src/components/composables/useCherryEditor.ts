import { ref } from 'vue';
import { cherryInstance } from '../CherryMarkdown';
import type { CherryEditorInstance } from '../editorTypes';
import { setEditorInstance } from './useEditor';
import { useImageLightbox, setCurrentLightbox, getCurrentLightbox } from './useImageLightbox';

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
    // 内容变更后同步刷新大图预览的图片列表
    getCurrentLightbox()?.refresh();
    if (skipNextChange) {
      skipNextChange = false;
      return;
    }
    onContentChanged();
  };

  const initEditor = (): void => {
    toolbarVisible.value = !document.querySelector('.cherry--no-toolbar');
    const instance = cherryInstance();
    // Cherry 官方类型的部分字段（如 status）被推断为宽泛类型，与内部收窄接口存在结构差异，
    // 通过 unknown 显式桥接，避免 TS 结构兼容报错
    const editorInstance = instance as unknown as CherryEditorInstance;
    editor = editorInstance;
    setEditorInstance(editorInstance);
    instance.on('afterChange', handleAfterChange);
    // 初始化图片大图预览（viewerjs），延迟到 DOM 就绪后创建
    setTimeout(() => {
      const lightbox = useImageLightbox(editorInstance);
      setCurrentLightbox(lightbox);
    }, 0);
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
    const toggleHandler = getEditor().toolbar.toolbarHandlers.settings;
    if (typeof toggleHandler === 'function') {
      toggleHandler('toggleToolbar');
    }
    toolbarVisible.value = !toolbarVisible.value;
  };

  const disposeEditor = (): void => {
    editor?.off?.('afterChange', handleAfterChange);
    getCurrentLightbox()?.destroy();
    setCurrentLightbox(null);
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
