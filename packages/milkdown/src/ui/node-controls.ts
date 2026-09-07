import { Plugin, NodeSelection } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';

/** Property controls belong to this editor, not Cherry's Previewer handlers. */
export function nodeControls(root: HTMLElement) {
  return $prose(
    () =>
      new Plugin({
        view(view) {
          const panel = document.createElement('div');
          panel.className = 'cherry-milkdown-node-controls cherry-milkdown-bubble';
          panel.setAttribute('role', 'toolbar');
          panel.setAttribute('aria-label', '节点属性');
          panel.hidden = true;
          root.append(panel);
          let disposed = false;
          const apply = (transform: (value: string) => string) => {
            const { selection } = view.state;
            if (!view.editable || !(selection instanceof NodeSelection)) return;
            const { node, from } = selection;
            const key = node.type.name === 'image' ? 'alt' : 'source';
            view.dispatch(
              view.state.tr.setNodeMarkup(from, undefined, {
                ...node.attrs,
                [key]: transform(String(node.attrs[key] ?? '')),
              }),
            );
          };
          const align = document.createElement('select');
          align.setAttribute('aria-label', '节点对齐');
          for (const [value, text] of [
            ['', '默认'],
            ['left', '左对齐'],
            ['center', '居中'],
            ['right', '右对齐'],
          ]) {
            const option = document.createElement('option');
            option.value = value!;
            option.textContent = text!;
            align.append(option);
          }
          const transformOpener = (source: string, transform: (value: string) => string) => {
            const lines = source.split('\n');
            lines[0] = transform(lines[0] ?? '');
            return lines.join('\n');
          };
          align.addEventListener('change', () =>
            apply((source) =>
              transformOpener(
                source,
                (line) =>
                  line.replace(/#(?:float-right|float-left|center|right|left)/g, '') +
                  (align.value ? `#${align.value}` : ''),
              ),
            ),
          );
          const width = document.createElement('input');
          width.type = 'number';
          width.min = '1';
          width.max = '10000';
          width.placeholder = '宽度 px';
          width.setAttribute('aria-label', '节点宽度');
          width.addEventListener('change', () => {
            const value = Number(width.value);
            if (!Number.isFinite(value) || value < 1 || value > 10000) return;
            apply((source) =>
              transformOpener(source, (line) => {
                const pattern = /#(?:[0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto)/;
                return pattern.test(line) ? line.replace(pattern, `#${value}px`) : `${line}#${value}px`;
              }),
            );
          });
          panel.append(align, width);
          const hide = () => {
            panel.hidden = true;
          };
          const update = () => {
            if (disposed) return;
            const { selection } = view.state;
            if (
              !view.editable ||
              !(selection instanceof NodeSelection) ||
              !(
                selection.node.type.name === 'image' ||
                (selection.node.type.name === 'cherry_diagram' && selection.node.attrs.diagramType === 'mermaid')
              )
            ) {
              hide();
              return;
            }
            const dom = view.nodeDOM(selection.from);
            if (!(dom instanceof Element)) {
              hide();
              return;
            }
            const source = String(selection.node.attrs[selection.node.type.name === 'image' ? 'alt' : 'source'] ?? '');
            if (document.activeElement !== align)
              align.value = source.split('\n')[0]?.match(/#(center|right|left)/)?.[1] ?? '';
            if (document.activeElement !== width) width.value = source.split('\n')[0]?.match(/#([0-9]+)px/)?.[1] ?? '';
            const rect = dom.getBoundingClientRect();
            panel.hidden = false;
            const size = panel.getBoundingClientRect();
            panel.style.left = `${Math.max(8, Math.min(innerWidth - size.width - 8, rect.right - size.width))}px`;
            panel.style.top = `${Math.max(8, rect.top - size.height - 8)}px`;
          };
          window.addEventListener('scroll', hide, true);
          window.addEventListener('resize', hide);
          return {
            update() {
              queueMicrotask(update);
            },
            destroy() {
              disposed = true;
              window.removeEventListener('scroll', hide, true);
              window.removeEventListener('resize', hide);
              panel.remove();
            },
          };
        },
      }),
  );
}
