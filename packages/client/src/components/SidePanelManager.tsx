import { computed, defineComponent, h, ref, shallowRef, type Component } from 'vue';
import ExplorerPanel from './ExplorerPanel';
import RecentPanel from './RecentPanel';
import { FileIcon, FolderIcon, LocateIcon, NewFileIcon, OpenFileIcon, OpenFolderIcon, RefreshIcon } from './icons';
import { useSidePanelState } from './composables/useSidePanelState';
import { useFileStore } from '../store';
import ActivityBar from './side-panel/ActivityBar';
import PanelHeader from './side-panel/PanelHeader';
import type { ActivityPanelDefinition, PanelHeaderAction } from './side-panel/types';
import './side-panel/side-panel.css';

type PanelId = 'recent' | 'explorer';

interface PanelDefinition extends ActivityPanelDefinition {
  id: PanelId;
  subtitle: string;
  component: Component;
}

interface PanelExposeApi {
  openDirectory?: () => void | Promise<void>;
  refreshDirectory?: () => void | Promise<void>;
  revealCurrentFile?: () => void | Promise<void>;
  openRecentFile?: () => void | Promise<void>;
}

const actionMap: Record<string, keyof PanelExposeApi> = {
  'open-directory': 'openDirectory',
  'refresh-directory': 'refreshDirectory',
  'reveal-current': 'revealCurrentFile',
  'open-file': 'openRecentFile',
};

export default defineComponent({
  name: 'SidePanelManager',
  emits: {
    newFile: () => true,
    openSettings: () => true,
  },
  setup(_, { emit }) {
    const version = __APP_VERSION__;
    const fileStore = useFileStore();
    const panels = shallowRef<PanelDefinition[]>([
      {
        id: 'explorer',
        label: '资源管理器',
        subtitle: '',
        icon: FolderIcon,
        component: ExplorerPanel,
      },
      { id: 'recent', label: '最近文件', subtitle: '', icon: FileIcon, component: RecentPanel },
    ]);
    const panelIds = computed(() => panels.value.map((panel) => panel.id));
    const panelRef = ref<PanelExposeApi | null>(null);

    const {
      activePanelId,
      isCollapsed,
      isResizing,
      panelWidth,
      sidePanelWidth,
      selectPanel,
      toggleCollapse,
      startResize,
    } = useSidePanelState({ panelIds });

    const activePanel = computed(
      () => panels.value.find((panel) => panel.id === activePanelId.value) || panels.value[0],
    );

    const activePanelActions = computed<PanelHeaderAction[]>(() => {
      if (activePanelId.value === 'explorer') {
        return [
          { id: 'new-file', label: '新建文件', icon: NewFileIcon },
          { id: 'open-directory', label: '打开目录', icon: OpenFolderIcon },
          { id: 'refresh-directory', label: '刷新目录', icon: RefreshIcon },
          {
            id: 'reveal-current',
            label: '定位当前文件',
            icon: LocateIcon,
            disabled: !fileStore.currentFilePath,
            disabledReason: '当前没有打开的文件',
          },
        ];
      }

      return [
        { id: 'open-file', label: '打开文件', icon: OpenFileIcon },
        { id: 'new-file', label: '新建文件', icon: NewFileIcon },
      ];
    });

    const handlePanelAction = (actionId: string): void => {
      if (actionId === 'new-file') {
        emit('newFile');
        return;
      }

      const panel = panelRef.value;
      if (!panel) return;

      const method = actionMap[actionId];
      if (method && panel[method]) {
        void panel[method]?.();
      }
    };

    return () => {
      const panel = activePanel.value;
      return h(
        'div',
        {
          class: ['side-panel', { collapsed: isCollapsed.value, resizing: isResizing.value }],
          style: { width: `${sidePanelWidth.value}px` },
        },
        [
          h(ActivityBar, {
            panels: panels.value,
            activePanelId: activePanelId.value,
            isCollapsed: isCollapsed.value,
            version,
            onSelectPanel: selectPanel,
            onToggleCollapse: toggleCollapse,
            onOpenSettings: () => emit('openSettings'),
          }),
          !isCollapsed.value
            ? h('section', { class: 'panel-surface', style: { width: `${panelWidth.value}px` } }, [
                h(PanelHeader, {
                  title: panel?.label || '',
                  subtitle: panel?.subtitle,
                  actions: activePanelActions.value,
                  onAction: handlePanelAction,
                }),
                panel ? h(panel.component, { ref: panelRef, class: 'panel-content' }) : null,
              ])
            : null,
          !isCollapsed.value
            ? h('div', {
                class: 'resize-handle',
                role: 'separator',
                'aria-orientation': 'vertical',
                onMousedown: startResize,
              })
            : null,
        ],
      );
    };
  },
});
