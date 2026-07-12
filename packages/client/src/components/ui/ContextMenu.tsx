import { computed, defineComponent, h, type PropType } from 'vue';
import type { FileInfo } from '../types';
import ContextMenuList from './ContextMenuList';
import './ui.css';

export default defineComponent({
  name: 'ContextMenu',
  props: {
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
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
    close: () => true,
  },
  setup(props, { emit }) {
    const menuPosition = computed(() => {
      const padding = 8;
      const estimatedWidth = 180;
      const estimatedHeight = props.menuType === 'recent' ? 116 : 82;
      const maxLeft = Math.max(padding, window.innerWidth - estimatedWidth - padding);
      const maxTop = Math.max(padding, window.innerHeight - estimatedHeight - padding);

      return {
        left: `${Math.min(Math.max(props.x, padding), maxLeft)}px`,
        top: `${Math.min(Math.max(props.y, padding), maxTop)}px`,
      };
    });

    return () =>
      h(
        'div',
        {
          class: 'context-menu',
          style: menuPosition.value,
          onClick: (event: MouseEvent) => event.stopPropagation(),
        },
        [
          h(ContextMenuList, {
            file: props.file,
            menuType: props.menuType,
            onRemove: (filePath: string) => emit('remove', filePath),
            onCopyPath: (filePath: string) => emit('copyPath', filePath),
            onOpenInExplorer: (filePath: string) => emit('openInExplorer', filePath),
          }),
        ],
      );
  },
});
