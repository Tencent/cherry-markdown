import { defineComponent, h, ref } from 'vue';
import { useFileStore } from '../store';
import ContextMenu from './ui/ContextMenu';
import { useFileManager } from './composables/useFileManager';
import type { FileInfo } from './types';
import './panels.css';

const formatTime = (time: FileInfo['lastAccessed']): string => {
  if (!time) return '';
  const date = new Date(time);
  const today = new Date();
  const isSameDay = date.toDateString() === today.toDateString();
  const timeText = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (isSameDay) return timeText;
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${timeText}`;
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

    const openRecentFile = async (): Promise<void> => {
      await openExistingFile();
    };

    const openRecent = async (filePath: string): Promise<void> => {
      await openFile(filePath, false, false);
    };

    const remove = (filePath: string): void => {
      removeFromRecent(filePath);
      hideContextMenu();
    };

    expose({ openRecentFile });

    return () =>
      h('div', { class: 'recent-panel' }, [
        !sortedRecentFiles.value.length
          ? h('div', { class: 'empty' }, [
              h('p', '暂无最近访问文件'),
              h('button', { type: 'button', onClick: openRecentFile }, '打开文件'),
            ])
          : h(
              'ul',
              { class: 'recent-list' },
              sortedRecentFiles.value.map((file) =>
                h(
                  'li',
                  {
                    key: file.path,
                    class: { active: file.path === currentFilePath.value },
                    title: file.path,
                    onClick: () => openRecent(file.path),
                    onContextmenu: (event: MouseEvent) => {
                      event.preventDefault();
                      showContextMenu(event, file);
                    },
                  },
                  [
                    h('div', { class: 'file-row' }, [
                      h('span', { class: 'file-name' }, file.name),
                      h('span', { class: 'file-time' }, formatTime(file.lastAccessed)),
                    ]),
                    h('div', { class: 'file-path' }, formatDirectory(file.path)),
                  ],
                ),
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
