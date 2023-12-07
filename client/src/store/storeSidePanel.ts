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
      id: 'toc',
      name: "目录列表",
      icon: "material-symbols-light:lists-rounded",
      color: "#000000",
      size: 24,
    },
    isSidePanelOpen: true,
  }),
}) 