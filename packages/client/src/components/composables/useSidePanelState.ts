import { computed, ref, type Ref } from 'vue';
import { useFileStore } from '../../store';

const ACTIVE_PANEL_KEY = 'cherry-sidebar-active-panel';
const SIDEBAR_WIDTH_KEY = 'cherry-sidebar-width';
const DEFAULT_ACTIVE_PANEL = 'explorer';
const DEFAULT_PANEL_WIDTH = 340;
const MIN_PANEL_WIDTH = 280;
const MAX_PANEL_WIDTH = 520;
export const ACTIVITY_BAR_WIDTH = 64;

interface UseSidePanelStateOptions {
  panelIds: Ref<string[]>;
}

const clampPanelWidth = (width: number): number => Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, width));

const loadPanelWidth = (): number => {
  const saved = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
  return Number.isFinite(saved) ? clampPanelWidth(saved) : DEFAULT_PANEL_WIDTH;
};

export function useSidePanelState({ panelIds }: UseSidePanelStateOptions) {
  const fileStore = useFileStore();
  const panelWidth = ref(loadPanelWidth());
  const isResizing = ref(false);

  const loadActivePanel = (): string => {
    const saved = localStorage.getItem(ACTIVE_PANEL_KEY);
    return saved && panelIds.value.includes(saved) ? saved : DEFAULT_ACTIVE_PANEL;
  };

  const activePanelId = ref(loadActivePanel());
  const isCollapsed = computed(() => fileStore.sidebarCollapsed);
  const sidePanelWidth = computed(() =>
    isCollapsed.value ? ACTIVITY_BAR_WIDTH : ACTIVITY_BAR_WIDTH + panelWidth.value,
  );

  const ensureExpanded = (): void => {
    if (fileStore.sidebarCollapsed) {
      fileStore.toggleSidebar();
    }
  };

  const selectPanel = (panelId: string): void => {
    if (panelId === activePanelId.value) {
      fileStore.toggleSidebar();
      return;
    }

    activePanelId.value = panelId;
    localStorage.setItem(ACTIVE_PANEL_KEY, panelId);
    ensureExpanded();
  };

  const toggleCollapse = (): void => {
    fileStore.toggleSidebar();
  };

  const startResize = (event: MouseEvent): void => {
    if (isCollapsed.value) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = panelWidth.value;
    isResizing.value = true;

    const handleMove = (moveEvent: MouseEvent): void => {
      panelWidth.value = clampPanelWidth(startWidth + moveEvent.clientX - startX);
    };

    const handleUp = (): void => {
      isResizing.value = false;
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(panelWidth.value));
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return {
    activePanelId,
    isCollapsed,
    isResizing,
    panelWidth,
    sidePanelWidth,
    selectPanel,
    toggleCollapse,
    startResize,
  };
}
