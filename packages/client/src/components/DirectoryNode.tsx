import { defineComponent, h, type PropType, type VNode } from 'vue';
import { ArrowIcon, FileIcon, FolderIcon } from './icons';
import type { DirectoryNode as DirectoryNodeType } from './types';
import './directory.css';

export default defineComponent({
  name: 'DirectoryNode',
  props: {
    node: {
      type: Object as PropType<DirectoryNodeType>,
      required: true,
    },
    depth: {
      type: Number,
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
    const renderDirectory = (node: DirectoryNodeType, depth: number): VNode =>
      h('div', { class: ['directory-item', { expanded: node.expanded }] }, [
        h(
          'div',
          {
            class: 'directory-header',
            'data-path': node.path,
            onClick: () => emit('toggleDirectory', node.path, node),
          },
          [
            h('div', { class: 'directory-icon' }, [h(FolderIcon, { size: 14 })]),
            h('div', { class: 'directory-name' }, node.name),
            h('div', { class: 'directory-arrow' }, [
              h(ArrowIcon, { size: 12, direction: node.expanded ? 'down' : 'right' }),
            ]),
          ],
        ),
        node.expanded
          ? h(
              'div',
              { class: 'directory-children' },
              node.children?.map((child) => renderNode(child, depth + 1)),
            )
          : null,
      ]);

    const renderFile = (node: DirectoryNodeType): VNode =>
      h(
        'div',
        {
          class: ['file-item', { active: node.path === props.currentFilePath }],
          'data-path': node.path,
          onClick: () => emit('openFile', node.path),
          onContextmenu: (event: MouseEvent) => {
            event.preventDefault();
            emit('contextMenu', event, node);
          },
        },
        [h('div', { class: 'file-icon' }, [h(FileIcon, { size: 14 })]), h('div', { class: 'file-name' }, node.name)],
      );

    const renderNode = (node: DirectoryNodeType, depth: number): VNode =>
      h('div', { key: node.path, class: ['directory-node', `depth-${depth}`] }, [
        node.type === 'directory' ? renderDirectory(node, depth) : renderFile(node),
      ]);

    return () => renderNode(props.node, props.depth);
  },
});
