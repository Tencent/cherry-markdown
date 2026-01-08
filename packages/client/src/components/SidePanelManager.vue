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
            @click="triggerOpenDirectory"
          >
            打开目录
          </button>
          <button
            v-if="activePanelId === 'recent'"
            class="header-action"
            title="打开文件"
            @click="triggerOpenRecentFile"
          >
            打开文件
          </button>
          <button class="header-toggle" :title="isCollapsed ? '展开侧边栏' : '折叠侧边栏'" @click="toggleCollapse">
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
  background: #f4f6fb;
  border-right: 1px solid #dfe3ea;
  transition: width 0.25s ease;
}

.side-panel.collapsed {
  width: 64px;
}

.activity-bar {
  width: 64px;
  background: #1f2430;
  color: #c8ceda;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  justify-content: space-between;
}

.activity-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.activity-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.activity-btn:hover {
  background: #2a3040;
  color: #ffffff;
}

.activity-btn.active {
  background: #2d3442;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.version-info {
  padding: 8px 0;
  text-align: center;
}

.version-text {
  font-size: 10px;
  color: #7a8294;
  letter-spacing: 0.5px;
  font-weight: 500;
  line-height: 1.2;
}

.panel-surface {
  flex: 1;
  background: #fdfdfd;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-left: 1px solid #dfe3ea;
}

.side-panel.collapsed .panel-surface {
  display: none;
}

.panel-header {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #e5e9f0;
  color: #1f2430;
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
  gap: 8px;
}

.header-action {
  padding: 6px 10px;
  border: 1px solid #e5e9f0;
  border-radius: 8px;
  background: #eef1f7;
  color: #1f2430;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.header-action:hover {
  background: #dfe4ee;
}

.header-toggle {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e9f0;
  border-radius: 8px;
  background: #f7f9fc;
  color: #2d3442;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.header-toggle:hover {
  background: #e8ecf4;
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
