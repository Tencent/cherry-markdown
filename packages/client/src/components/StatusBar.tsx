import { openPath, revealItemInDir } from '@tauri-apps/plugin-opener';
import { stat } from '@tauri-apps/plugin-fs';
import { computed, defineComponent, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { MESSAGES } from '../constants/i18n';
import { useFileStore, usePreferencesStore } from '../store';
import { notifyError, notifyInfo } from '../utils/notifications';
import type { CherryEditorInstance } from './editorTypes';
import { getEditorInstance } from './composables/useEditor';
import { AutoWidthIcon, FixedWidthIcon, FocusIcon } from './icons';
import './status-bar.css';

const pad2 = (n: number): string => String(n).padStart(2, '0');

const formatChangeTime = (ts: number): string => {
  const d = new Date(ts);
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const formatFullTime = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const formatClockTime = (ts: number): string => {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

export default defineComponent({
  name: 'StatusBar',
  props: {
    unsaved: {
      type: Boolean,
      default: false,
    },
    toolbarVisible: {
      type: Boolean,
      default: true,
    },
    /** 最近一次本地版本自动保存时间戳（毫秒），由 App.tsx 传入 */
    lastAutoSavedAt: {
      type: Number as unknown as import('vue').PropType<number | null>,
      default: null,
    },
    /** 当前文件是否存在本地历史版本（决定“查看历史版本”按钮显隐） */
    hasVersion: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    toggleToolbar: () => true,
    openVersionHistory: () => true,
  },
  setup(props, { emit }) {
    const fileStore = useFileStore();
    const preferences = usePreferencesStore();
    const wordCount = ref(0);
    const wordWords = ref(0);
    const wordLine = ref(0);
    const lastChangeTime = ref<number | null>(null);
    // 自动快照提示的“可见时间戳”：仅在 3s 展示窗口内保持为 props.lastAutoSavedAt 的值
    // 展示窗口结束后置 null 隐藏提示；下次 props.lastAutoSavedAt 变化时重新显示 3s
    const visibleAutoSavedAt = ref<number | null>(null);
    let autoSavedHideTimer: number | undefined;
    watch(
      () => props.lastAutoSavedAt,
      (ts) => {
        if (!ts) {
          visibleAutoSavedAt.value = null;
          if (autoSavedHideTimer) {
            window.clearTimeout(autoSavedHideTimer);
            autoSavedHideTimer = undefined;
          }
          return;
        }
        visibleAutoSavedAt.value = ts;
        if (autoSavedHideTimer) window.clearTimeout(autoSavedHideTimer);
        autoSavedHideTimer = window.setTimeout(() => {
          visibleAutoSavedAt.value = null;
          autoSavedHideTimer = undefined;
        }, 3000);
      },
      { immediate: true },
    );
    // 当前编辑器引擎（cherry / milkdown），点击按钮时写回持久化
    const engine = ref<'cherry' | 'milkdown'>(preferences.engine);
    const toggleEngine = (): void => {
      const next = engine.value === 'cherry' ? 'milkdown' : 'cherry';
      engine.value = next;
      preferences.setEngine(next);
    };
    // 从持久化存储初始化专注模式与宽度模式
    const focusMode = ref<boolean>(preferences.focusMode);
    // 记录进入专注模式时 cherry 是否处于纯预览模式（此时不切换编辑器 model）
    const enteredInPreviewOnly = ref(false);
    // 专注模式下的宽度模式：'fixed' → 容器.fixed-width；'auto' → 容器.auto-width
    // 默认 fixed（限制正文宽度，阅读体验更好）
    const widthMode = ref<'fixed' | 'auto'>(preferences.widthMode);
    let waitTimer: number | undefined;

    const FOCUS_MODE_CLASS = 'cherry-focus-mode';
    const WIDTH_CLASSES = ['fixed-width', 'auto-width'] as const;

    // 将“固定宽度”数值同步为 CSS 变量，供 global.css / app.css 中的 fixed-width 样式使用
    const applyFixedWidthCssVar = (px: number): void => {
      document.body.style.setProperty('--fixed-content-width', `${px}px`);
    };
    // 初始化：无论是否处于专注模式，都先把 CSS 变量写好，进入专注模式时即刻生效
    applyFixedWidthCssVar(preferences.fixedWidthValue);

    // 用户在设置弹窗里修改固定宽度后，实时反映到 DOM
    watch(
      () => preferences.fixedWidthValue,
      (v) => applyFixedWidthCssVar(v),
    );

    // 根据当前引擎返回激活的编辑器容器 id：cherry → #markdown-editor，milkdown → #milkdown-editor
    const getActiveContainerId = (): string => (engine.value === 'milkdown' ? 'milkdown-editor' : 'markdown-editor');

    const getActiveContainer = (): HTMLElement | null => document.getElementById(getActiveContainerId());

    // 若持久化的专注模式为 true，setup 阶段立即隐藏侧栏，避免首屏“侧栏闪现”
    // 编辑器就绪后再由 enterFocusMode 完成 editor model 切换和宽度类应用
    if (preferences.focusMode) {
      document.body.classList.add(FOCUS_MODE_CLASS);
    }

    const applyWidthModeToDom = (mode: 'fixed' | 'auto'): void => {
      // 同时清理两个容器上的宽度类，避免切换引擎后残留
      ['markdown-editor', 'milkdown-editor'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.remove(...WIDTH_CLASSES);
      });
      const active = getActiveContainer();
      if (!active) return;
      active.classList.add(mode === 'fixed' ? 'fixed-width' : 'auto-width');
    };

    const clearWidthModeOnDom = (): void => {
      ['markdown-editor', 'milkdown-editor'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.remove(...WIDTH_CLASSES);
      });
    };

    const toggleWidthMode = (): void => {
      widthMode.value = widthMode.value === 'fixed' ? 'auto' : 'fixed';
      applyWidthModeToDom(widthMode.value);
      preferences.setWidthMode(widthMode.value);
      // 宽度变化后刷新 CodeMirror，避免测量残留（仅 Cherry 需要）
      if (engine.value === 'cherry') {
        setTimeout(() => getEditorInstance()?.editor?.refresh?.(), 50);
      }
    };

    const fileName = computed(() => {
      const path = fileStore.currentFilePath;
      if (!path) return '未命名';
      const parts = path.split(/[\\/]/);
      return parts[parts.length - 1] || path;
    });

    const filePath = computed(() => fileStore.currentFilePath ?? '');

    const withEditor = (callback: (editor: CherryEditorInstance) => void): void => {
      const editor = getEditorInstance();
      if (editor) {
        callback(editor);
      }
    };

    const refreshLastChangeTimeFromDisk = async (): Promise<void> => {
      const path = fileStore.currentFilePath;
      if (!path) {
        lastChangeTime.value = null;
        return;
      }
      try {
        const info = await stat(path);
        const mtime = info.mtime ? new Date(info.mtime).getTime() : null;
        lastChangeTime.value = Number.isFinite(mtime as number) ? (mtime as number) : null;
      } catch {
        lastChangeTime.value = null;
      }
    };

    watch(
      () => fileStore.currentFilePath,
      () => {
        lastChangeTime.value = null;
        void refreshLastChangeTimeFromDisk();
      },
    );

    const currentFileLastSaved = computed(() => {
      const path = fileStore.currentFilePath;
      if (!path) return null;
      const record = fileStore.recentFiles.find((f) => f.path === path);
      return record?.lastSaved ?? null;
    });

    watch(currentFileLastSaved, () => {
      void refreshLastChangeTimeFromDisk();
    });

    const openFileInFolder = async (): Promise<void> => {
      const path = filePath.value;
      if (!path) return;
      try {
        try {
          await revealItemInDir(path);
          return;
        } catch {
          // fallback: open containing directory
        }

        const directoryPath = path.replace(/\\/g, '/').replace(/\/[^/]*$/, '');
        await openPath(directoryPath);
      } catch (error) {
        notifyError(
          `${MESSAGES.EXPLORER.OPEN_FAILED}: ${error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR}`,
        );
        try {
          await navigator.clipboard.writeText(path);
          notifyInfo(`${MESSAGES.CLIPBOARD.COPY_PATH_FALLBACK}: ${path}`);
        } catch (clipboardError) {
          notifyError(
            `${MESSAGES.CLIPBOARD.COPY_PATH_FAILED}: ${clipboardError instanceof Error ? clipboardError.message : MESSAGES.UNKNOWN_ERROR}`,
          );
        }
      }
    };

    const updateStats = (): void => {
      withEditor((editor) => {
        const stats = editor.editor?.wordCount?.(1);
        if (stats) {
          wordCount.value = stats.characters ?? 0;
          wordWords.value = stats.words ?? 0;
          wordLine.value = stats.lines ?? 0;
        }
      });
    };

    const onAfterChange = (): void => updateStats();

    const waitForEditor = (): void => {
      // Milkdown 模式下不存在 Cherry 实例，直接走恢复分支
      if (engine.value === 'milkdown') {
        if (preferences.focusMode) {
          focusMode.value = false;
          enterFocusMode(false);
        }
        return;
      }
      const editor = getEditorInstance();
      if (editor) {
        editor.on?.('afterChange', onAfterChange);
        // 如果持久化的专注模式为 true，则在编辑器就绪后自动恢复
        // 注意此时 focusMode.value 已从持久化值初始化为 true，
        // enterFocusMode 需要“幂等”——它会重新读取 focusMode 判断当前状态，
        // 因此恢复时先将 focusMode 重置为 false 再进入，确保 DOM 副作用被正确执行
        if (preferences.focusMode) {
          focusMode.value = false;
          enterFocusMode(false);
        }
      } else {
        waitTimer = window.setTimeout(waitForEditor, 100);
      }
    };

    onMounted(() => {
      waitForEditor();
      void refreshLastChangeTimeFromDisk();
    });

    /**
     * 进入专注模式
     * @param persist 是否写回持久化存储（自动恢复时为 false，避免多余写入）
     *
     * 与引擎解耦：
     *  - 侧栏隐藏（body class）+ 宽度类：对两种引擎都生效
     *  - Cherry 独占：切换 editor model 到 editOnly、刷新 CodeMirror
     *  - Milkdown 独占：暂无额外操作（本身就是所见即所得单栏）
     */
    const enterFocusMode = (persist = true): void => {
      if (focusMode.value) return;

      // 通过 body class 彻底隐藏整个 .side-panel（含活动栏），
      // 不修改 fileStore.sidebarCollapsed，避免污染持久化的折叠偏好
      document.body.classList.add(FOCUS_MODE_CLASS);

      // Cherry 引擎才需要处理 editor model 切换
      if (engine.value === 'cherry') {
        const editor = getEditorInstance();
        if (editor) {
          editor.focusMode = true;
          // 若 cherry 当前处于纯预览模式（editor === 'hide'），只隐藏侧栏，不改动编辑器 model
          const isPreviewOnly = editor.status?.editor !== 'show';
          enteredInPreviewOnly.value = isPreviewOnly;
          if (!isPreviewOnly) {
            try {
              editor.switchModel('editOnly', false);
              setTimeout(() => editor.editor?.refresh?.(), 200);
            } catch {
              // 切换失败则回退侧栏隐藏
              document.body.classList.remove(FOCUS_MODE_CLASS);
              return;
            }
          }
        } else {
          // Cherry 尚未就绪：保守起见按“非纯预览”处理，稍后由 waitForEditor 补上
          enteredInPreviewOnly.value = false;
        }
      } else {
        // Milkdown 引擎不涉及 model 切换
        enteredInPreviewOnly.value = false;
      }

      // 进入专注模式时应用当前宽度模式（作用于当前激活的容器）
      applyWidthModeToDom(widthMode.value);
      focusMode.value = true;
      if (persist) preferences.setFocusMode(true);
    };

    const exitFocusMode = (persist = true): void => {
      if (!focusMode.value) return;

      // 退出专注模式：恢复侧栏
      document.body.classList.remove(FOCUS_MODE_CLASS);

      // Cherry 引擎才需要还原 editor model
      if (engine.value === 'cherry') {
        const editor = getEditorInstance();
        if (editor) {
          editor.focusMode = false;
          if (!enteredInPreviewOnly.value) {
            try {
              editor.switchModel('edit&preview', true);
              setTimeout(() => editor.editor?.refresh?.(), 200);
            } catch {
              // 忽略还原失败
            }
          }
        }
      }

      // 退出专注模式时清理宽度类，恢复默认布局
      clearWidthModeOnDom();
      focusMode.value = false;
      if (persist) preferences.setFocusMode(false);
    };

    const toggleFocusMode = (): void => {
      if (focusMode.value) {
        exitFocusMode(true);
      } else {
        enterFocusMode(true);
      }
    };

    // 引擎切换时同步专注模式副作用：
    //  1. 保持本地 engine.value 与持久化一致（其他入口可能修改 preferences.engine）
    //  2. 若正处于专注模式，将宽度类从旧容器迁移到新容器（applyWidthModeToDom 内部会先清理再应用）
    //  3. 切回 Cherry 时，若专注模式仍开且 Cherry 已就绪，需要重新走一次 model 切换到 editOnly
    watch(
      () => preferences.engine,
      (next, prev) => {
        engine.value = next;
        if (!focusMode.value) return;
        // 宽度类迁移到新容器
        // 新容器可能在下一帧才渲染完成（引擎 mount 是异步），因此延迟一次
        setTimeout(() => applyWidthModeToDom(widthMode.value), 0);

        // 从 milkdown 切回 cherry：等 Cherry 就绪后，把 model 切到 editOnly
        if (prev === 'milkdown' && next === 'cherry') {
          const trySync = (): void => {
            const editor = getEditorInstance();
            if (!editor) {
              window.setTimeout(trySync, 100);
              return;
            }
            editor.focusMode = true;
            const isPreviewOnly = editor.status?.editor !== 'show';
            enteredInPreviewOnly.value = isPreviewOnly;
            if (!isPreviewOnly) {
              try {
                editor.switchModel('editOnly', false);
                setTimeout(() => editor.editor?.refresh?.(), 200);
              } catch {
                // ignore
              }
            }
          };
          trySync();
        }
      },
    );

    onUnmounted(() => {
      if (waitTimer) window.clearTimeout(waitTimer);
      if (autoSavedHideTimer) {
        window.clearTimeout(autoSavedHideTimer);
        autoSavedHideTimer = undefined;
      }
      getEditorInstance()?.off?.('afterChange', onAfterChange);
      // 组件卸载时若仍处于专注模式，清理 body class 避免副作用残留
      document.body.classList.remove(FOCUS_MODE_CLASS);
      // 同时清理宽度模式类，避免残留影响
      clearWidthModeOnDom();
    });

    return () =>
      h('footer', { class: 'status-bar' }, [
        h('div', { class: 'status-left' }, [
          h('span', { class: ['save-dot', { dirty: props.unsaved }], title: props.unsaved ? '未保存' : '已保存' }),
          h(
            'span',
            {
              class: ['file-name', { clickable: Boolean(filePath.value) }],
              title: filePath.value ? `在资源管理器中打开所在文件夹\n${filePath.value}` : fileName.value,
              onClick: openFileInFolder,
            },
            fileName.value,
          ),
          lastChangeTime.value
            ? h(
                'span',
                { class: 'file-change-time', title: `上次变更：${formatFullTime(lastChangeTime.value)}` },
                formatChangeTime(lastChangeTime.value),
              )
            : null,
        ]),
        h('div', { class: 'status-center' }, [
          h(
            'button',
            {
              type: 'button',
              class: ['status-action', 'status-action-primary', { active: focusMode.value }],
              'aria-pressed': focusMode.value,
              onClick: toggleFocusMode,
            },
            [h(FocusIcon), h('span', { class: 'status-action-label' }, focusMode.value ? '专注中' : '专注')],
          ),
          focusMode.value
            ? h(
                'button',
                {
                  type: 'button',
                  class: ['status-action', 'status-action-width'],
                  title:
                    widthMode.value === 'fixed'
                      ? '当前：固定宽度，点击切换为 100% 宽度'
                      : '当前：100% 宽度，点击切换为固定宽度',
                  onClick: toggleWidthMode,
                },
                [
                  widthMode.value === 'fixed' ? h(FixedWidthIcon) : h(AutoWidthIcon),
                  h('span', { class: 'status-action-label' }, widthMode.value === 'fixed' ? '固定宽度' : '100% 宽度'),
                ],
              )
            : null,
          h(
            'button',
            {
              type: 'button',
              class: ['status-action', 'status-action-engine', { active: engine.value === 'milkdown' }],
              title:
                engine.value === 'cherry'
                  ? '当前：源码/分屏模式（Cherry），点击切换为所见即所得（Milkdown）'
                  : '当前：所见即所得（Milkdown），点击切换回源码/分屏模式（Cherry）',
              onClick: toggleEngine,
            },
            [
              h(
                'span',
                { class: 'status-action-label' },
                engine.value === 'cherry' ? 'Cherry 双栏编辑' : 'Milkdown 所见即所得编辑',
              ),
            ],
          ),
        ]),
        h('div', { class: 'status-right' }, [
          visibleAutoSavedAt.value
            ? h(
                'span',
                {
                  class: 'auto-saved-hint',
                  title: `已自动快照，可点击「查看历史版本」进行查看\n${formatFullTime(visibleAutoSavedAt.value)}`,
                },
                [h('span', { class: 'auto-saved-dot' }), `自动快照 ${formatClockTime(visibleAutoSavedAt.value)}`],
              )
            : null,
          visibleAutoSavedAt.value ? h('span', { class: 'status-sep' }) : null,
          props.hasVersion
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'status-action status-action-history',
                  title: '查看当前文件的本地历史版本',
                  onClick: () => emit('openVersionHistory'),
                },
                [h('span', { class: 'status-action-label' }, '查看历史版本')],
              )
            : null,
          h('span', { class: 'status-item' }, `${wordCount.value} 字`),
          h('span', { class: 'status-sep' }),
          h('span', { class: 'status-item' }, `${wordWords.value} 词`),
          h('span', { class: 'status-sep' }),
          h('span', { class: 'status-item' }, `${wordLine.value} 行`),
        ]),
      ]);
  },
});
