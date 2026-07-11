import { computed, defineComponent, h, type PropType } from 'vue';

type Direction = 'up' | 'down' | 'left' | 'right';

const PATHS: Record<Direction, string> = {
  down: 'M7.41,8.59L12,13.17L16.59,8.59L18,10L12,16L6,10L7.41,8.59Z',
  up: 'M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z',
  left: 'M15.41,7.41L14,6L8,12L14,18L15.41,16.59L10.83,12L15.41,7.41Z',
  right: 'M8.59,16.59L10,18L16,12L10,6L8.59,7.41L13.17,12L8.59,16.59Z',
};

export default defineComponent({
  name: 'ArrowIcon',
  props: {
    size: {
      type: Number,
      default: 12,
    },
    direction: {
      type: String as PropType<Direction>,
      default: 'down',
    },
  },
  setup(props) {
    const path = computed(() => PATHS[props.direction]);
    return () =>
      h('svg', { width: props.size, height: props.size, viewBox: '0 0 24 24', fill: 'currentColor' }, [
        h('path', { d: path.value }),
      ]);
  },
});
