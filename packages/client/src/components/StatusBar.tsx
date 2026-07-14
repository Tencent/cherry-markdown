import { openPath, revealItemInDir } from '@tauri-apps/plugin-opener';
import { stat } from '@tauri-apps/plugin-fs';
import { computed, defineComponent, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { MESSAGES } from '../constants/i18n';
import { useFileStore } from '../store';
import { notifyError, notifyInfo } from '../utils/notifications';
import type { CherryEditorInstance } from './editorTypes';
import { getEditorInstance } from './composables/useEditor';
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

    onUnmounted(() => {
      if (waitTimer) window.clearTimeout(waitTimer);
      getEditorInstance()?.off?.('afterChange', onAfterChange);
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
