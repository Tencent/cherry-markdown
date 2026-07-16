import { defineComponent, h } from 'vue';

// 固定宽度：矩形容器 + 两条竖线，示意"正文被限制在中间栏"
export default defineComponent({
  name: 'FixedWidthIcon',
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
          h('rect', { x: 3, y: 4, width: 18, height: 16, rx: 2 }),
          h('line', { x1: 8, y1: 4, x2: 8, y2: 20 }),
          h('line', { x1: 16, y1: 4, x2: 16, y2: 20 }),
        ],
      );
  },
});
