<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useFileStore } from '../store';
import { getEditorInstance } from './composables/useEditor';
import { openPath, revealItemInDir } from '@tauri-apps/plugin-opener';
import { stat } from '@tauri-apps/plugin-fs';
import { notifyError, notifyInfo } from '../utils/notifications';
import { MESSAGES } from '../constants/i18n';

const fileStore = useFileStore();

const props = defineProps<{
  unsaved?: boolean;
  toolbarVisible?: boolean;
}>();

const fileName = computed(() => {
  const path = fileStore.currentFilePath;
  if (!path) return '未命名';
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
});

const filePath = computed(() => fileStore.currentFilePath ?? '');

// 从磁盘读取当前文件的真实最后修改时间（mtime）
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
    // 文件可能尚未落盘（如未命名新文件）或无权限访问，忽略错误
    lastChangeTime.value = null;
  }
};

// 切换文件（打开/新建）时，先重置再从磁盘读取真实 mtime
watch(
  () => fileStore.currentFilePath,
  () => {
    lastChangeTime.value = null;
    void refreshLastChangeTimeFromDisk();
  },
);

// 监听当前文件在 store 中的 lastSaved 变化：保存成功后重新读取磁盘 mtime
const currentFileLastSaved = computed(() => {
  const path = fileStore.currentFilePath;
  if (!path) return null;
  const record = fileStore.recentFiles.find((f) => f.path === path);
  return record?.lastSaved ?? null;
});

watch(currentFileLastSaved, () => {
  void refreshLastChangeTimeFromDisk();
});

// 点击文件名：在资源管理器中定位文件所在文件夹
const openFileInFolder = async (): Promise<void> => {
  const path = filePath.value;
  if (!path) return;
  try {
    // 优先直接在资源管理器中定位文件
    try {
      await revealItemInDir(path);
      return;
    } catch {
      // fallback: 打开所在目录
    }

    const directoryPath = path.replace(/\\/g, '/').replace(/\/[^/]*$/, '');
    await openPath(directoryPath);
  } catch (error) {
    notifyError(`${MESSAGES.EXPLORER.OPEN_FAILED}: ${error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR}`);
    // 备选方案：复制文件路径到剪贴板
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

const wordCount = ref(0); // 字符数（去空白）
const wordWords = ref(0); // 词数（中英文合计）
const wordLine = ref(0); // 行数
const lastChangeTime = ref<number | null>(null); // 内容最后变更时间

const pad2 = (n: number): string => String(n).padStart(2, '0');

const formatChangeTime = (ts: number): string => {
  const d = new Date(ts);
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const formatFullTime = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

let waitTimer: number | undefined;

const updateStats = (): void => {
  const editor = getEditorInstance() as any;
  if (!editor) return;

  // 字数统计：复用 cherry 内置统计（字符 / 单词 / 行）
  const stats = editor.editor?.wordCount?.(1);
  if (stats) {
    wordCount.value = stats.characters ?? 0;
    wordWords.value = stats.words ?? 0;
    wordLine.value = stats.lines ?? 0;
  }
};

// 内容变更回调：仅刷新字数统计。`lastChangeTime` 表示磁盘文件真实 mtime，
// 仅在文件切换或保存成功后更新，不随编辑器内输入而变化。
const onAfterChange = (): void => updateStats();

// 子组件 onMounted 早于父组件，编辑器实例可能尚未注册，轮询等待就绪后做首次统计
const waitForEditor = (): void => {
  // 监听内容变化，实时刷新字数并记录最后变更时间
  const editor = getEditorInstance() as any;
  if (editor) {
    editor.on?.('afterChange', onAfterChange);
  } else {
    waitTimer = window.setTimeout(waitForEditor, 100);
  }
};

onMounted(() => {
  waitForEditor();
  // 初次挂载时读取一次当前文件的真实 mtime
  void refreshLastChangeTimeFromDisk();
});

onUnmounted(() => {
  if (waitTimer) window.clearTimeout(waitTimer);
  const editor = getEditorInstance() as any;
  editor?.off?.('afterChange', onAfterChange);
});
</script>

<template>
  <footer class="status-bar">
    <div class="status-left">
      <span class="save-dot" :class="{ dirty: props.unsaved }" :title="props.unsaved ? '未保存' : '已保存'"></span>
      <span
        class="file-name"
        :class="{ clickable: filePath }"
        :title="filePath ? `在资源管理器中打开所在文件夹\n${filePath}` : fileName"
        @click="openFileInFolder"
        >{{ fileName }}</span
      >
      <span v-if="lastChangeTime" class="file-change-time" :title="`上次变更：${formatFullTime(lastChangeTime)}`">{{
        formatChangeTime(lastChangeTime)
      }}</span>
    </div>
    <div class="status-right">
      <span class="status-item">{{ wordCount }} 字</span>
      <span class="status-sep"></span>
      <span class="status-item">{{ wordWords }} 词</span>
      <span class="status-sep"></span>
      <span class="status-item">{{ wordLine }} 行</span>
    </div>
  </footer>
</template>

<style scoped>
.status-bar {
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: var(--color-surface-panel);
  border-top: 1px solid var(--color-border-strong);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-family: var(--font-sans);
  user-select: none;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.save-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-muted);
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.save-dot.dirty {
  background: var(--color-danger);
}

.file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  color: var(--color-text);
  max-width: 320px;
}

.file-name.clickable {
  cursor: pointer;
  transition: color 0.18s ease;
}

.file-name.clickable:hover {
  color: var(--color-accent-strong);
  text-decoration: underline;
}

.file-name.clickable:active {
  opacity: 0.8;
}

.file-change-time {
  white-space: nowrap;
  color: var(--color-text-muted);
  font-size: 11px;
}

.status-item {
  white-space: nowrap;
  color: var(--color-text-secondary);
}

.status-sep {
  width: 1px;
  height: 12px;
  background: var(--color-border-strong);
}

.status-toolbar-btn {
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.18s ease;
}

.status-toolbar-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.status-toolbar-btn.active {
  color: var(--color-accent-strong);
}
</style>
