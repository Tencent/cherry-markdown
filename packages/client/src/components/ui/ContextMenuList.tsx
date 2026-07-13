import { computed, defineComponent, h, type PropType } from 'vue';
import type { FileInfo } from '../types';

export default defineComponent({
  name: 'ContextMenuList',
  props: {
    file: {
      type: Object as PropType<FileInfo | null>,
      default: null,
    },
    menuType: {
      type: String as PropType<'directory' | 'recent'>,
      default: 'directory',
    },
  },
  emits: {
    remove: (_filePath: string) => true,
    copyPath: (_filePath: string) => true,
    openInExplorer: (_filePath: string) => true,
  },
  setup(props, { emit }) {
    const filePath = computed(() => props.file?.path ?? '');

    return () =>
      h('div', [
        props.menuType === 'recent'
          ? h('div', { class: 'menu-item', onClick: () => emit('remove', filePath.value) }, '从列表中移除')
          : null,
        h('div', { class: 'menu-item', onClick: () => emit('copyPath', filePath.value) }, '复制文件路径'),
        h('div', { class: 'menu-item', onClick: () => emit('openInExplorer', filePath.value) }, '在资源管理器中打开'),
      ]);
  },
});
