import { computed, ref, watch } from 'vue';
import { usePreferencesStore, type EditorEngine } from '../../store';
import type { CherryEditorMode } from '../editorTypes';
import { useCherryEditor } from './useCherryEditor';
import { useMilkdownEditor } from './useMilkdownEditor';

/**
 * 编辑器引擎适配器
 *
 * 对上层（App.tsx / useAppFileOperations）暴露与 useCherryEditor 完全一致的接口，
 * 内部根据 usePreferencesStore().engine 分发到 Cherry 或 Milkdown 实例。
 *
 * 引擎切换策略：
 *  1. 用户点击「引擎切换」→ store.setEngine(newEngine)
 *  2. watch(engine) 触发 switchEngine：读取当前 markdown → 卸载旧引擎 → 挂载新引擎 → 灌入内容
 *  3. 切换过程会临时 skip 一次 onContentChanged 回调，避免误标记未保存
 */
interface UseEditorAdapterOptions {
  onContentChanged: () => void;
}

export function useEditorAdapter({ onContentChanged }: UseEditorAdapterOptions) {
  const preferences = usePreferencesStore();

  // 切换过程中屏蔽 onContentChanged
  let suppressChange = false;
  const wrappedOnChange = () => {
    if (suppressChange) return;
    onContentChanged();
  };

  const cherry = useCherryEditor({ onContentChanged: wrappedOnChange });
  const milkdown = useMilkdownEditor({ onContentChanged: wrappedOnChange });

  /** 当前活跃引擎（响应式） */
  const activeEngine = ref<EditorEngine>(preferences.engine);
  const isCherry = computed(() => activeEngine.value === 'cherry');

  // setup 阶段立即根据持久化的引擎打 body class，避免首屏两个容器同时可见的闪烁
  applyContainerVisibility(activeEngine.value);

  // toolbarVisible 跟随当前引擎
  const toolbarVisible = computed(() => (isCherry.value ? cherry.toolbarVisible.value : milkdown.toolbarVisible.value));

  const current = () => (isCherry.value ? cherry : milkdown);

  const initEditor = (): void => {
    // 根据当前引擎初始化对应容器；另一个容器由 CSS 隐藏
    applyContainerVisibility(activeEngine.value);
    current().initEditor();
  };

  const disposeEditor = (): void => {
    // 卸载时把两个都清一遍，避免残留
    try {
      cherry.disposeEditor();
    } catch {
      /* ignore */
    }
    try {
      milkdown.disposeEditor();
    } catch {
      /* ignore */
    }
  };

  const getMarkdown = (): string => current().getMarkdown();

  // setMarkdown 抑制窗口计时器：避免 Milkdown 内部规范化/tableBlock NodeView 补事件
  // 引发的 markdownUpdated 被误判为"用户编辑"。窗口内一切 onContentChanged 都被吞掉。
  let setMarkdownSuppressTimer: ReturnType<typeof setTimeout> | null = null;
  const SET_MARKDOWN_SUPPRESS_MS = 300;

  const setMarkdown = (markdown: string): void => {
    // 打开抑制窗口 —— 覆盖 setMarkdown 后 300ms 内所有 onContentChanged 事件。
    // 300ms 足够覆盖：ProseMirror 同步事务派发 + trailing 补空段落 + tableBlock
    // NodeView 异步补 transaction + 上层 await markClean 中的 async 让出。
    suppressChange = true;
    if (setMarkdownSuppressTimer) clearTimeout(setMarkdownSuppressTimer);
    setMarkdownSuppressTimer = setTimeout(() => {
      suppressChange = false;
      setMarkdownSuppressTimer = null;
    }, SET_MARKDOWN_SUPPRESS_MS);

    current().setMarkdown(markdown);
  };

  const scrollPreviewToTop = (): void => current().scrollPreviewToTop();

  const toggleToolbar = (): void => current().toggleToolbar();

  const switchEditorMode = (mode: CherryEditorMode, needSyncToolbar = true): void => {
    current().switchEditorMode(mode, needSyncToolbar);
  };

  /**
   * 引擎切换：由外部 UI（StatusBar 按钮）触发 preferences.setEngine 后自动执行
   */
  const switchEngine = async (next: EditorEngine): Promise<void> => {
    if (next === activeEngine.value) return;
    const from = isCherry.value ? cherry : milkdown;
    const to = next === 'cherry' ? cherry : milkdown;

    // 1. 保存旧引擎当前内容
    const md = from.getMarkdown();

    // 2. 卸载旧引擎
    suppressChange = true;
    try {
      from.disposeEditor();
    } catch (e) {
      console.warn('[EditorAdapter] 旧引擎卸载异常:', e);
    }

    // 3. 切换容器可见性
    activeEngine.value = next;
    applyContainerVisibility(next);

    // 4. 挂载新引擎并灌入内容（等待 DOM 更新一帧再灌，兼容 Cherry 的 setTimeout 初始化）
    to.initEditor();
    await new Promise((r) => setTimeout(r, 50));
    to.setMarkdown(md);
    // 再放开一帧，避免 setMarkdown 触发的 change 被判为“用户改动”
    await new Promise((r) => setTimeout(r, 30));
    suppressChange = false;
  };

  // 监听 store.engine 变化 → 触发 switchEngine
  watch(
    () => preferences.engine,
    (next) => {
      void switchEngine(next);
    },
  );

  return {
    toolbarVisible,
    activeEngine,
    getMarkdown,
    initEditor,
    setMarkdown,
    scrollPreviewToTop,
    toggleToolbar,
    switchEditorMode,
    disposeEditor,
  };
}

/**
 * 通过 body class 控制两个编辑器容器的显隐，
 * 样式规则见 app.css 中 `.engine-cherry` / `.engine-milkdown` 选择器。
 */
function applyContainerVisibility(engine: EditorEngine): void {
  document.body.classList.remove('engine-cherry', 'engine-milkdown');
  document.body.classList.add(engine === 'cherry' ? 'engine-cherry' : 'engine-milkdown');
}
