import { defineComponent, h } from 'vue';

export default defineComponent({
  name: 'IconTooltip',
  props: {
    label: {
      type: String,
      required: true,
    },
    placement: {
      type: String,
      default: 'right',
    },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'span',
        {
          class: ['icon-tooltip', `placement-${props.placement}`],
          'data-tooltip': props.label,
        },
        slots.default?.(),
      );
  },
});
