import { computed, defineComponent, h, ref } from 'vue';
import { useFileStore } from '../store';
import ContextMenu from './ui/ContextMenu';
import { useFileManager } from './composables/useFileManager';
import type { FileInfo } from './types';
import './panels.css';

const formatTime = (time: FileInfo['lastAccessed']): string => {
  if (!time) return '';
  const date = new Date(time);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const formatDateKey = (time: FileInfo['lastAccessed']): string => {
  const date = new Date(time || 0);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDateLabel = (dateKey: string): string => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return '今天';
  if (date.toDateString() === yesterday.toDateString()) return '昨天';

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${year}年${String(month).padStart(2, '0')}月${String(day).padStart(2, '0')}日 ${weekdays[date.getDay()]}`;
};

const formatDirectory = (path: string): string => {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/');
  parts.pop();
  const directory = parts.join('/');
  if (!directory) return normalized;
  const tail = parts.slice(-2).join('/');
  return tail || directory;
};

export default defineComponent({
  name: 'RecentPanel',
  setup(_, { expose }) {
    const fileStore = useFileStore();
    const {
      sortedRecentFiles,
      currentFilePath,
      openExistingFile,
      openFile,
      openInExplorer,
      copyFilePath,
      removeFromRecent,
      contextMenu,
      showContextMenu,
      hideContextMenu,
    } = useFileManager(fileStore, ref(null));

    const groupedRecentFiles = computed(() => {
      const groups = new Map<string, FileInfo[]>();
      if (fileStore.untitledDraft) {
        groups.set('draft', [fileStore.untitledDraft]);
      }
      for (const file of sortedRecentFiles.value) {
        const key = formatDateKey(file.lastAccessed);
        const group = groups.get(key) || [];
        group.push(file);
        groups.set(key, group);
      }
      return Array.from(groups.entries()).map(([dateKey, files]) => ({
        dateKey,
        label: dateKey === 'draft' ? '临时文件' : formatDateLabel(dateKey),
        files,
      }));
    });

    const openRecentFile = async (): Promise<void> => {
      await openExistingFile();
    };

    const openRecent = async (filePath: string): Promise<void> => {
      await openFile(filePath, false, false);
    };

    const isActiveFile = (file: FileInfo): boolean => {
      if (file.isDraft) return !currentFilePath.value;
      return file.path === currentFilePath.value;
    };

    const remove = (filePath: string): void => {
      removeFromRecent(filePath);
      hideContextMenu();
    };

    expose({ openRecentFile });

    return () =>
      h('div', { class: 'recent-panel' }, [
        !sortedRecentFiles.value.length && !fileStore.untitledDraft
          ? h('div', { class: 'empty' }, [
              h('p', '暂无最近访问文件'),
              h('button', { type: 'button', onClick: openRecentFile }, '打开文件'),
            ])
          : h(
              'div',
              { class: 'recent-list' },
              groupedRecentFiles.value.map((group) =>
                h('section', { key: group.dateKey, class: 'recent-group' }, [
                  h('div', { class: 'recent-group-title' }, [
                    h('span', group.label),
                    h('span', `${group.files.length} 个文件`),
                  ]),
                  h(
                    'ul',
                    group.files.map((file) =>
                      h(
                        'li',
                        {
                          key: file.path,
                          class: { active: isActiveFile(file), draft: file.isDraft },
                          title: file.isDraft ? '未保存的新建文件，保存后会写入磁盘' : file.path,
                          onClick: () => {
                            if (!file.isDraft) void openRecent(file.path);
                          },
                          onContextmenu: (event: MouseEvent) => {
                            if (file.isDraft) return;
                            event.preventDefault();
                            showContextMenu(event, file);
                          },
                        },
                        [
                          h('div', { class: 'file-row' }, [
                            h('span', { class: 'file-name' }, file.name),
                            h('span', { class: 'file-time' }, file.isDraft ? '未保存' : formatTime(file.lastAccessed)),
                          ]),
                          h(
                            'div',
                            { class: 'file-path' },
                            file.isDraft ? '临时文档 - 保存后写入磁盘' : formatDirectory(file.path),
                          ),
                        ],
                      ),
                    ),
                  ),
                ]),
              ),
            ),
        contextMenu.value.visible
          ? h(ContextMenu, {
              x: contextMenu.value.x,
              y: contextMenu.value.y,
              file: contextMenu.value.file,
              menuType: 'recent',
              onRemove: remove,
              onCopyPath: copyFilePath,
              onOpenInExplorer: openInExplorer,
              onClose: hideContextMenu,
            })
          : null,
      ]);
  },
});
