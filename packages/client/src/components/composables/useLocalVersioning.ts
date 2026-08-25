/**
 * Composable：本地版本 & 自动保存
 *
 * 职责：
 *  1. 监听编辑器 onContentChanged → 防抖后写 IndexedDB latest & 版本快照
 *  2. 派发自动保存时间戳（供 StatusBar 显示“已自动保存 HH:mm:ss”）
 *  3. 对外暴露：openRestoreCheck（打开文件后检查是否有更新的本地版本）
 *              hasVersionRef（当前文件是否有历史版本，用于状态栏按钮显隐）
 */
import { ref, onUnmounted, watch } from 'vue';
import { stat } from '@tauri-apps/plugin-fs';
import { useFileStore } from '../../store';
import { DRAFT_KEY, getLatest, hasAnyVersion, saveLatest, type LatestRecord } from '../../services/localVersions';

/** 300ms 防抖窗口，避免高频输入触发大量 IDB 写入 */
const AUTOSAVE_DEBOUNCE_MS = 300;

export interface LocalVersioningApi {
  /** 最近一次自动保存时间戳（毫秒），null 表示尚未保存 */
  lastAutoSavedAt: ReturnType<typeof ref<number | null>>;
  /** 当前文件是否存在历史版本记录 */
  hasVersion: ReturnType<typeof ref<boolean>>;
  /** 手动触发一次刷新 hasVersion */
  refreshHasVersion: () => Promise<void>;
  /**
   * 打开文件后调用：若 IDB latest.updatedAt > 磁盘 mtime，则返回可应用的本地内容，
   * 否则返回 null（调用方决定是否弹出“应用本地版本”对话框）。
   */
  checkNewerLocalVersion: (filePath: string) => Promise<LatestRecord | null>;
  /** 编辑器内容变更钩子（由 App.tsx 挂到 onContentChanged 上） */
  onContentChanged: (getContent: () => string) => void;
  /** 强制立即冲写（避免关闭窗口时丢失最后 300ms 内的编辑） */
  flushNow: (getContent: () => string) => Promise<void>;
}

export function useLocalVersioning(): LocalVersioningApi {
  const fileStore = useFileStore();
  const lastAutoSavedAt = ref<number | null>(null);
  const hasVersion = ref<boolean>(false);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingContent: string | null = null;

  const currentKey = (): string => fileStore.currentFilePath ?? DRAFT_KEY;

  const doSave = async (key: string, content: string): Promise<void> => {
    try {
      const ts = await saveLatest(key, content);
      lastAutoSavedAt.value = ts;
      hasVersion.value = true;
    } catch (err) {
      console.warn('[localVersions] saveLatest failed:', err);
    }
  };

  const onContentChanged = (getContent: () => string): void => {
    pendingContent = getContent();
    const key = currentKey();
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const content = pendingContent ?? '';
      pendingContent = null;
      debounceTimer = null;
      void doSave(key, content);
    }, AUTOSAVE_DEBOUNCE_MS);
  };

  const flushNow = async (getContent: () => string): Promise<void> => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    pendingContent = null;
    await doSave(currentKey(), getContent());
  };

  const refreshHasVersion = async (): Promise<void> => {
    try {
      const key = currentKey();
      hasVersion.value = await hasAnyVersion(key);
    } catch {
      hasVersion.value = false;
    }
  };

  /**
   * 检查 IDB 中的本地版本是否比磁盘更新。
   * - 无 latest 记录 → null（无需提醒）
   * - 无 currentFilePath（新建草稿）→ null（此路径由 restoreDraft 独立处理，不弹此框）
   * - latest.updatedAt <= 磁盘 mtime → null
   * - 否则返回可应用的 LatestRecord
   */
  const checkNewerLocalVersion = async (filePath: string): Promise<LatestRecord | null> => {
    try {
      const latest = await getLatest(filePath);
      if (!latest) return null;
      let diskMtime = 0;
      try {
        const info = await stat(filePath);
        diskMtime = info.mtime ? new Date(info.mtime).getTime() : 0;
      } catch {
        diskMtime = 0;
      }
      // 留出 1 秒容差，避免刚刚保存磁盘就误判为“本地更新”
      if (latest.updatedAt > diskMtime + 1000) {
        return latest;
      }
      return null;
    } catch (err) {
      console.warn('[localVersions] checkNewerLocalVersion failed:', err);
      return null;
    }
  };

  // 文件切换时：刷新版本按钮状态、清空最近自动保存显示
  watch(
    () => fileStore.currentFilePath,
    () => {
      lastAutoSavedAt.value = null;
      void refreshHasVersion();
    },
    { immediate: true },
  );

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  return {
    lastAutoSavedAt,
    hasVersion,
    refreshHasVersion,
    checkNewerLocalVersion,
    onContentChanged,
    flushNow,
  };
}
