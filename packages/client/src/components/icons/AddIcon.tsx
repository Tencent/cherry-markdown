import { defineComponent, h } from 'vue';

export default defineComponent({
  name: 'AddIcon',
  props: {
    size: {
      type: Number,
      default: 16,
    },
  },
  setup(props) {
    return () =>
      h('svg', { width: props.size, height: props.size, viewBox: '0 0 24 24', fill: 'currentColor' }, [
        h('path', { d: 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z' }),
      ]);
  },
});
