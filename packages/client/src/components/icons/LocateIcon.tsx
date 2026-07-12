import { defineComponent, h } from 'vue';

export default defineComponent({
  name: 'LocateIcon',
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
          d: 'M12,8A4,4 0 1,0 12,16A4,4 0 0,0 12,8M20.94,11A9.004,9.004 0 0,0 13,3.06V1H11V3.06A9.004,9.004 0 0,0 3.06,11H1V13H3.06A9.004,9.004 0 0,0 11,20.94V23H13V20.94A9.004,9.004 0 0,0 20.94,13H23V11H20.94M12,19A7,7 0 1,1 12,5A7,7 0 0,1 12,19Z',
        }),
      ]);
  },
});
