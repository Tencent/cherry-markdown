import { ref } from 'vue';
import type { CherryEditorMode } from '../editorTypes';

/**
 * Milkdown 适配器（MVP 骨架）
 *
 * 目标：在不引入 @milkdown/kit 依赖的前提下，先把上层调用面 & 引擎切换 & 数据回环
 * 打通。真正的 Milkdown 实例通过 `registerMilkdownAdapter` 惰性注入，实现位于
 * `milkdownAdapter.ts`（依赖 @milkdown/kit 聚合包，见 MILKDOWN_MVP_TODO.md 第 3 步）。
 *
 * 与 useCherryEditor 保持相同的返回签名，供 useEditorAdapter 分发使用。
 */

/** 由具体实现（Milkdown 封装文件）填充的适配器契约 */
export interface MilkdownAdapter {
  /**
   * 挂载 Milkdown 到 `#milkdown-editor` 容器
   * @param initialMarkdown 初始内容
   * @param onChange 内容变更回调（由适配器内部 debounce 后调用）
   */
  mount(initialMarkdown: string, onChange: () => void): Promise<void> | void;
  /** 卸载并释放资源 */
  destroy(): void | Promise<void>;
  getMarkdown(): string;
  setMarkdown(markdown: string): void;
  /** 显示/隐藏工具栏（若适配器实现了自定义 toolbar） */
  toggleToolbar?(): void;
}

let registeredAdapter: MilkdownAdapter | null = null;

/**
 * 惰性注册真实 Milkdown 适配器。
 * 在 `main.ts` 或首次切换到 milkdown 引擎前调用。
 * 未注册时 useMilkdownEditor 将进入降级分支（提示尚未接入）。
 */
export function registerMilkdownAdapter(adapter: MilkdownAdapter | null): void {
  registeredAdapter = adapter;
}

export function isMilkdownAdapterReady(): boolean {
  return registeredAdapter !== null;
}

interface UseMilkdownEditorOptions {
  onContentChanged: () => void;
}

export function useMilkdownEditor({ onContentChanged }: UseMilkdownEditorOptions) {
  // Milkdown 天然 WYSIWYG，没有独立的 toolbarVisible 状态，这里保留字段与 Cherry 对齐
  const toolbarVisible = ref(true);
  let pendingMarkdown = '';
  let mounted = false;

  const warnNotReady = (action: string): void => {
    // 只在开发态提示，避免生产 console 噪音
    if (import.meta.env?.DEV) {
      console.warn(`[Milkdown] 适配器尚未注册，${action} 已回退为 no-op。请先 registerMilkdownAdapter()。`);
    }
  };

  const initEditor = (): void => {
    if (!registeredAdapter) {
      warnNotReady('initEditor');
      // 骨架阶段：即便未注册，也要把容器插入一段占位提示，方便预览产品形态
      const el = document.getElementById('milkdown-editor');
      if (el && !el.hasChildNodes()) {
        el.innerHTML =
          '<div style="padding:24px;color:var(--fg-secondary,#888);font-size:14px;line-height:1.7;">' +
          '<b>Milkdown 引擎尚未接入</b><br/>' +
          '这里将在完成 <code>npm i @milkdown/kit @milkdown/theme-nord</code> ' +
          '并实现 <code>milkdownAdapter.ts</code> 后启用所见即所得编辑。<br/><br/>' +
          '切回 Cherry 引擎可继续正常编辑。' +
          '</div>';
      }
      return;
    }
    void registeredAdapter.mount(pendingMarkdown, onContentChanged);
    mounted = true;
  };

  const disposeEditor = (): void => {
    if (registeredAdapter && mounted) {
      registeredAdapter.destroy();
    }
    mounted = false;
    // 清理占位内容
    const el = document.getElementById('milkdown-editor');
    if (el) el.innerHTML = '';
  };

  const getMarkdown = (): string => {
    if (!registeredAdapter || !mounted) return pendingMarkdown;
    return registeredAdapter.getMarkdown();
  };

  const setMarkdown = (markdown: string): void => {
    pendingMarkdown = markdown;
    if (registeredAdapter && mounted) {
      registeredAdapter.setMarkdown(markdown);
    }
  };

  /**
   * 与 Cherry 引擎的 clearUndoRedo 保持签名一致；Milkdown 由 ProseMirror 管理
   * 历史，当前未接入清空逻辑，先作为 no-op 占位。后续如需支持，可在此调用
   * ProseMirror 的 history 插件重置 API。
   */
  const clearUndoRedo = (): void => {
    // no-op
  };

  const scrollPreviewToTop = (): void => {
    // Milkdown 无独立预览区；直接滚动编辑容器到顶部
    const el = document.getElementById('milkdown-editor');
    if (el) el.scrollTop = 0;
  };

  const toggleToolbar = (): void => {
    toolbarVisible.value = !toolbarVisible.value;
    registeredAdapter?.toggleToolbar?.();
  };

  const switchEditorMode = (_mode: CherryEditorMode, _needSyncToolbar = true): void => {
    // Milkdown 只有单一 WYSIWYG 模式，此方法保留签名以兼容 useEditorAdapter，
    // 后续如需加入「源码模式切换」，可在此扩展。
    void _mode;
    void _needSyncToolbar;
  };

  return {
    toolbarVisible,
    getMarkdown,
    initEditor,
    setMarkdown,
    clearUndoRedo,
    scrollPreviewToTop,
    toggleToolbar,
    switchEditorMode,
    disposeEditor,
  };
}
