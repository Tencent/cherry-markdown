import { defineComponent, h, type PropType } from 'vue';
import { ArrowIcon } from '../icons';
import IconTooltip from './IconTooltip';
import type { ActivityPanelDefinition } from './types';

export default defineComponent({
  name: 'ActivityBar',
  props: {
    panels: {
      type: Array as PropType<ActivityPanelDefinition[]>,
      required: true,
    },
    activePanelId: {
      type: String,
      required: true,
    },
    isCollapsed: {
      type: Boolean,
      required: true,
    },
    version: {
      type: String,
      required: true,
    },
  },
  emits: {
    selectPanel: (_panelId: string) => true,
    toggleCollapse: () => true,
  },
  setup(props, { emit }) {
    return () =>
      h('nav', { class: 'activity-bar', 'aria-label': '侧边栏功能' }, [
        h(
          'div',
          { class: 'activity-buttons' },
          props.panels.map((panel) =>
            h(
              IconTooltip,
              { key: panel.id, label: panel.label, placement: 'right' },
              {
                default: () =>
                  h(
                    'button',
                    {
                      class: ['activity-btn', { active: panel.id === props.activePanelId }],
                      title: panel.label,
                      'aria-label': panel.label,
                      onClick: () => emit('selectPanel', panel.id),
                    },
                    [h(panel.icon, { size: 18 })],
                  ),
              },
            ),
          ),
        ),
        h('div', { class: 'activity-footer' }, [
          h(
            IconTooltip,
            { label: props.isCollapsed ? '展开侧边栏' : '折叠侧边栏', placement: 'right' },
            {
              default: () =>
                h(
                  'button',
                  {
                    class: 'activity-btn compact',
                    title: props.isCollapsed ? '展开侧边栏' : '折叠侧边栏',
                    'aria-label': props.isCollapsed ? '展开侧边栏' : '折叠侧边栏',
                    onClick: () => emit('toggleCollapse'),
                  },
                  [h(ArrowIcon, { size: 14, direction: props.isCollapsed ? 'right' : 'left' })],
                ),
            },
          ),
          h('span', { class: 'version-text', title: '当前版本' }, `v${props.version}`),
        ]),
      ]);
  },
});
