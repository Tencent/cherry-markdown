import { CheckedSidePanelType } from '@/types';
import { defineStore } from 'pinia'

/**
 * 
 * @param sidePanel- 侧边栏的选项
 * @param isSidePanelOpen- 侧边栏是否打开
 */
type SidePanel = {
  checkedSidePanel: CheckedSidePanelType;
  isSidePanelOpen: boolean;
}

export const useStoreSidePanel = defineStore('side-panel', {
  state: (): SidePanel => ({
    checkedSidePanel: {
      id: 'files',
      name: "文件目录",
      icon: "ph:files-bold",
      color: "#000000",
      size: 32,
    },
    isSidePanelOpen: false,
  }),
}) 