import { defineComponent, h } from 'vue';

export default defineComponent({
  name: 'OpenFolderIcon',
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
          // Back panel of the folder (with left tab) — the "closed" outline behind
          h('path', {
            d: 'M3 6a2 2 0 0 1 2-2h3.5l2 2H17a2 2 0 0 1 2 2v2',
          }),
          // Front flap of the opened folder — trapezoid suggesting the lid is tilted open
          h('path', {
            d: 'M3 10h16.5a1 1 0 0 1 .97 1.24l-1.6 6.4A2 2 0 0 1 16.93 19H5.5a2 2 0 0 1-1.95-1.55L2 10z',
          }),
        ],
      );
  },
});
