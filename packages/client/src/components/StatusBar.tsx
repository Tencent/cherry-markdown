import { openPath, revealItemInDir } from '@tauri-apps/plugin-opener';
import { stat } from '@tauri-apps/plugin-fs';
import { computed, defineComponent, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { MESSAGES } from '../constants/i18n';
import { useFileStore } from '../store';
import { notifyError, notifyInfo } from '../utils/notifications';
import type { CherryEditorInstance } from './editorTypes';
import { getEditorInstance } from './composables/useEditor';
import './status-bar.css';

const FocusIcon = () =>
  h(
    'svg',
    {
      width: 14,
      height: 14,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    },
    [
      h('circle', { cx: 12, cy: 12, r: 3 }),
      h('path', { d: 'M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1' }),
    ],
  );

const pad2 = (n: number): string => String(n).padStart(2, '0');

const formatChangeTime = (ts: number): string => {
  const d = new Date(ts);
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const formatFullTime = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
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
  },
  emits: {
    toggleToolbar: () => true,
  },
  setup(props) {
    const fileStore = useFileStore();
    const wordCount = ref(0);
    const wordWords = ref(0);
    const wordLine = ref(0);
    const lastChangeTime = ref<number | null>(null);
    const focusMode = ref(false);
    // 记录进入专注模式时 cherry 是否处于纯预览模式（此时不切换编辑器 model）
    const enteredInPreviewOnly = ref(false);
    let waitTimer: number | undefined;

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
      const editor = getEditorInstance();
      if (editor) {
        editor.on?.('afterChange', onAfterChange);
      } else {
        waitTimer = window.setTimeout(waitForEditor, 100);
      }
    };

    onMounted(() => {
      waitForEditor();
      void refreshLastChangeTimeFromDisk();
    });

    const FOCUS_MODE_CLASS = 'cherry-focus-mode';

    const toggleFocusMode = (): void => {
      const editor = getEditorInstance();
      if (!editor) return;

      editor.focusMode = !focusMode.value;
      if (!focusMode.value) {
        // 进入专注模式
        // 若 cherry 当前处于纯预览模式（editor === 'hide'），只隐藏侧栏，不改动编辑器 model
        const isPreviewOnly = editor.status?.editor !== 'show';
        enteredInPreviewOnly.value = isPreviewOnly;

        // 通过 body class 彻底隐藏整个 .side-panel（含活动栏），
        // 不修改 fileStore.sidebarCollapsed，避免污染持久化的折叠偏好
        document.body.classList.add(FOCUS_MODE_CLASS);

        if (!isPreviewOnly) {
          try {
            editor.switchModel('editOnly', false);
          } catch {
            // 切换失败则回退侧栏隐藏
            document.body.classList.remove(FOCUS_MODE_CLASS);
            return;
          }
        }
        focusMode.value = true;
      } else {
        // 退出专注模式：恢复侧栏；若进入时非纯预览，则切回 edit&preview
        document.body.classList.remove(FOCUS_MODE_CLASS);
        if (!enteredInPreviewOnly.value) {
          try {
            editor.switchModel('edit&preview', true);
          } catch {
            // 忽略还原失败
          }
        }
        focusMode.value = false;
      }
    };

    onUnmounted(() => {
      if (waitTimer) window.clearTimeout(waitTimer);
      getEditorInstance()?.off?.('afterChange', onAfterChange);
      // 组件卸载时若仍处于专注模式，清理 body class 避免副作用残留
      document.body.classList.remove(FOCUS_MODE_CLASS);
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
        ]),
        h('div', { class: 'status-right' }, [
          h('span', { class: 'status-item' }, `${wordCount.value} 字`),
          h('span', { class: 'status-sep' }),
          h('span', { class: 'status-item' }, `${wordWords.value} 词`),
          h('span', { class: 'status-sep' }),
          h('span', { class: 'status-item' }, `${wordLine.value} 行`),
        ]),
      ]);
  },
});
