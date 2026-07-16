import { defineComponent, h } from 'vue';

export default defineComponent({
  name: 'FocusIcon',
  props: {
    size: {
      type: Number,
      default: 14,
    },
  },
  setup(props) {
    return () =>
      h(
        'svg',
        {
          width: props.size,
          height: props.size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 2,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
        [
          h('circle', { cx: 12, cy: 12, r: 3 }),
          h('path', {
            d: 'M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
          }),
        ],
      );
  },
});
