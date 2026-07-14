import { defineComponent, h } from 'vue';

export default defineComponent({
  name: 'OpenFileIcon',
  props: {
    size: {
      type: Number,
      default: 16,
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
          // Document body with folded corner (matches NewFileIcon)
          h('path', { d: 'M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8' }),
          h('path', { d: 'M13 3v5h5' }),
          h('path', { d: 'M18 8 13 3' }),
          // "O" label at bottom-right
          h(
            'text',
            {
              x: 22,
              y: 20,
              'text-anchor': 'end',
              'font-size': 12,
              'font-weight': 700,
              'font-family': 'system-ui, -apple-system, Segoe UI, sans-serif',
              fill: 'currentColor',
              stroke: 'none',
            },
            'O',
          ),
        ],
      );
  },
});
