<template>
  <div class="side-panel" :class="{ collapsed: isCollapsed }">
    <nav class="activity-bar">
      <div class="activity-buttons">
        <button
          v-for="panel in panels"
          :key="panel.id"
          class="activity-btn"
          :class="{ active: panel.id === activePanelId }"
          :title="panel.label"
          @click="selectPanel(panel.id)"
        >
          <component :is="panel.icon" :size="18" />
          <span class="sr-only">{{ panel.label }}</span>
        </button>
      </div>
      <div class="version-info">
        <span class="version-text">v{{ version }}</span>
      </div>
    </nav>

    <section class="panel-surface" :class="{ collapsed: isCollapsed }">
      <header class="panel-header">
        <h3>{{ activePanel?.label }}</h3>
        <div class="header-actions">
          <button
            v-if="activePanelId === 'explorer'"
            class="header-action"
            title="打开目录"
            aria-label="打开目录"
            @click="triggerOpenDirectory"
          >
            <FolderIcon :size="16" />
          </button>
          <button
            v-if="activePanelId === 'recent'"
            class="header-action"
            title="打开文件"
            aria-label="打开文件"
            @click="triggerOpenRecentFile"
          >
            <FileIcon :size="16" />
          </button>
          <button
            class="header-toggle"
            :title="isCollapsed ? '展开侧边栏' : '折叠侧边栏'"
            :aria-label="isCollapsed ? '展开侧边栏' : '折叠侧边栏'"
            @click="toggleCollapse"
          >
            <ArrowIcon :size="14" :direction="isCollapsed ? 'right' : 'left'" />
          </button>
        </div>
      </header>
      <component v-show="!isCollapsed" :is="activePanel?.component" ref="panelRef" class="panel-content" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, type Component } from 'vue';
import ExplorerPanel from './ExplorerPanel.vue';
import RecentPanel from './RecentPanel.vue';
import { FolderIcon, FileIcon, ArrowIcon } from './icons';
import { useFileStore } from '../store';

// 导入 package.json 中的版本信息
const version = __APP_VERSION__;

interface PanelDefinition {
  id: string;
  label: string;
  icon: Component;
  component: Component;
}

const ACTIVE_PANEL_KEY = 'cherry-sidebar-active-panel';

const panels = shallowRef<PanelDefinition[]>([
  { id: 'recent', label: '最近文件', icon: FileIcon, component: RecentPanel },
  { id: 'explorer', label: '资源管理器', icon: FolderIcon, component: ExplorerPanel },
]);

const fileStore = useFileStore();

const loadActivePanel = (): string => {
  const saved = localStorage.getItem(ACTIVE_PANEL_KEY);
  const exists = panels.value.some((panel) => panel.id === saved);
  return exists ? (saved as string) : 'explorer';
};

const activePanelId = ref<string>(loadActivePanel());
const panelRef = ref<Component | null>(null);

const isCollapsed = computed(() => fileStore.sidebarCollapsed);
const activePanel = computed(() => panels.value.find((panel) => panel.id === activePanelId.value) || panels.value[0]);

const ensureExpanded = (): void => {
  if (fileStore.sidebarCollapsed) {
    fileStore.toggleSidebar();
  }
};

const selectPanel = (panelId: string): void => {
  if (panelId === activePanelId.value) {
    // 再次点击当前图标则收起/展开侧边栏
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

const triggerOpenDirectory = (): void => {
  if (activePanelId.value === 'explorer' && (panelRef.value as any)?.openDirectory) {
    (panelRef.value as any).openDirectory();
  }
};

const triggerOpenRecentFile = (): void => {
  if (activePanelId.value === 'recent' && (panelRef.value as any)?.openRecentFile) {
    (panelRef.value as any).openRecentFile();
  }
};
</script>

<style scoped>
.side-panel {
  display: flex;
  height: 100vh;
  width: 404px; /* 64 (bar) + 340 (panel) */
  background: var(--color-surface);
  border-right: 1px solid var(--color-border-strong);
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.side-panel.collapsed {
  width: 64px;
}

.activity-bar {
  width: 64px;
  background: var(--color-bar-bg);
  color: var(--color-bar-fg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 0 12px;
  justify-content: space-between;
}

.activity-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.activity-btn {
  position: relative;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.1s ease;
}

.activity-btn :deep(svg) {
  display: block;
  flex-shrink: 0;
  transition: transform 0.18s ease;
}

.activity-btn:hover {
  background: var(--color-bar-bg-hover);
  color: var(--color-bar-fg-active);
}

.activity-btn:active {
  transform: scale(0.94);
}

.activity-btn.active {
  background: var(--color-bar-bg-active);
  color: var(--color-bar-fg-active);
}

/* accent indicator bar (modern editor style) */
.activity-btn.active::before {
  content: '';
  position: absolute;
  left: -14px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 22px;
  border-radius: 0 3px 3px 0;
  background: var(--color-accent);
}

.version-info {
  padding: 8px 0;
  text-align: center;
}

.version-text {
  font-size: 10px;
  color: #6b7384;
  letter-spacing: 0.5px;
  font-weight: 600;
  line-height: 1.2;
}

.panel-surface {
  flex: 1;
  background: var(--color-surface-panel);
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-left: 1px solid var(--color-border-strong);
}

.side-panel.collapsed .panel-surface {
  display: none;
}

.panel-header {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 14px 0 18px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2px;
  gap: 8px;
}

.panel-header h3 {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.header-action {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.18s ease;
}

.header-action :deep(svg) {
  display: block;
}

.header-action:hover {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  border-color: rgba(59, 130, 246, 0.25);
}

.header-toggle {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.18s ease;
}

.header-toggle :deep(svg) {
  display: block;
}

.header-toggle:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.panel-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
