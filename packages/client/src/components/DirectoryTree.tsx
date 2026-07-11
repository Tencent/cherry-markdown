import { defineComponent, h, type PropType } from 'vue';
import DirectoryNode from './DirectoryNode';
import type { DirectoryNode as DirectoryNodeType } from './types';
import './directory.css';

export default defineComponent({
  name: 'DirectoryTree',
  props: {
    nodes: {
      type: Array as PropType<DirectoryNodeType[]>,
      required: true,
    },
    currentFilePath: {
      type: String as PropType<string | null>,
      default: null,
    },
  },
  emits: {
    toggleDirectory: (_dirPath: string, _node: DirectoryNodeType) => true,
    openFile: (_filePath: string) => true,
    contextMenu: (_event: MouseEvent, _file: DirectoryNodeType) => true,
  },
  setup(props, { emit }) {
    return () =>
      h(
        'div',
        { class: 'directory-tree', role: 'tree' },
        props.nodes.map((node) =>
          h(DirectoryNode, {
            key: node.path,
            node,
            depth: 0,
            currentFilePath: props.currentFilePath,
            onToggleDirectory: (dir: string, directoryNode: DirectoryNodeType) =>
              emit('toggleDirectory', dir, directoryNode),
            onOpenFile: (path: string) => emit('openFile', path),
            onContextMenu: (event: MouseEvent, file: DirectoryNodeType) => emit('contextMenu', event, file),
          }),
        ),
      );
  },
});
