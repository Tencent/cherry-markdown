import { defineComponent, h, type PropType } from 'vue';
import type { PanelHeaderAction } from './types';

export default defineComponent({
  name: 'PanelHeader',
  props: {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    actions: {
      type: Array as PropType<PanelHeaderAction[]>,
      required: true,
    },
  },
  emits: {
    action: (_actionId: string) => true,
  },
  setup(props, { emit }) {
    return () =>
      h('header', { class: 'panel-header' }, [
        h('div', { class: 'panel-title' }, [
          h('h3', props.title),
          props.subtitle ? h('p', { title: props.subtitle }, props.subtitle) : null,
        ]),
        h(
          'div',
          { class: 'header-actions' },
          props.actions.map((action) =>
            h(
              'button',
              {
                key: action.id,
                class: 'header-action',
                title: action.label,
                'aria-label': action.label,
                disabled: action.disabled,
                onClick: () => emit('action', action.id),
              },
              [h(action.icon, { size: 16 })],
            ),
          ),
        ),
      ]);
  },
});
