import { computed, defineComponent, h } from 'vue';

export default defineComponent({
  name: 'ExpandIcon',
  props: {
    size: {
      type: Number,
      default: 14,
    },
    expanded: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const path = computed(() => (props.expanded ? 'M19,13H5V11H19V13Z' : 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z'));
    return () =>
      h('svg', { width: props.size, height: props.size, viewBox: '0 0 24 24', fill: 'currentColor' }, [
        h('path', { d: path.value }),
      ]);
  },
});
