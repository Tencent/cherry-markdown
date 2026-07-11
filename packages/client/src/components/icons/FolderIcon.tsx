import { defineComponent, h } from 'vue';

export default defineComponent({
  name: 'FolderIcon',
  props: {
    size: {
      type: Number,
      default: 16,
    },
  },
  setup(props) {
    return () =>
      h('svg', { width: props.size, height: props.size, viewBox: '0 0 24 24', fill: 'currentColor' }, [
        h('path', {
          d: 'M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z',
        }),
      ]);
  },
});
