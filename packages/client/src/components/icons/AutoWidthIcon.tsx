import { defineComponent, h } from 'vue';

// 100% 宽度：左右双向箭头 + 中线，示意"撑满可用宽度"
export default defineComponent({
  name: 'AutoWidthIcon',
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
          h('polyline', { points: '7 8 3 12 7 16' }),
          h('polyline', { points: '17 8 21 12 17 16' }),
          h('line', { x1: 3, y1: 12, x2: 21, y2: 12 }),
        ],
      );
  },
});
