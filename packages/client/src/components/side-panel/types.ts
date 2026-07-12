import type { Component } from 'vue';

export interface ActivityPanelDefinition {
  id: string;
  label: string;
  icon: Component;
}

export interface PanelHeaderAction {
  id: string;
  label: string;
  icon: Component;
  disabled?: boolean;
  disabledReason?: string;
}
