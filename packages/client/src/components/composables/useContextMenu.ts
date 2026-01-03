import { ref } from 'vue';
import type { ContextMenuState, FileInfo, DirectoryNode } from '../types';

// 统一上下文菜单管理
export function useContextMenu(mapper: (input: FileInfo | DirectoryNode) => FileInfo) {
  const contextMenu = ref<ContextMenuState>({ visible: false, x: 0, y: 0, file: null });

  const handleGlobalClick = (event: MouseEvent): void => {
    if (!contextMenu.value.visible) return;
    const menuEl = document.querySelector('.context-menu');
    if (menuEl && !menuEl.contains(event.target as Node)) {
      hideContextMenu();
    }
  };

  const hideContextMenu = (): void => {
    contextMenu.value.visible = false;
    document.removeEventListener('click', handleGlobalClick);
  };

  const showContextMenu = (event: MouseEvent, file: FileInfo | DirectoryNode): void => {
    event.preventDefault();
    if (contextMenu.value.visible) hideContextMenu();

    const fileInfo = mapper(file);
    contextMenu.value = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      file: fileInfo,
    };

    setTimeout(() => document.addEventListener('click', handleGlobalClick, { once: true }), 0);
  };

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
  };
}
