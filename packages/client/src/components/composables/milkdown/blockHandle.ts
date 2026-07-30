import { commandsCtx, editorViewCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { NodeSelection, TextSelection } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';
import { block, BlockProvider } from '@milkdown/kit/plugin/block';
import { turnIntoTextCommand, wrapInBlockquoteCommand } from '@milkdown/kit/preset/commonmark';

/**
 * 段落把手（Block Handle）
 *
 * 提供三大能力：
 *  1. 鼠标移到段落 → 段落左侧浮出把手（six-dot 图标）
 *  2. 拖拽把手 → 整段拖动到别处（由 @milkdown/kit/plugin/block 内建实现，只要 element.draggable=true 即可）
 *  3. 点击把手 → 弹菜单：转为段落 / 转为引用 / 复制段落 / 删除段落
 *
 * 使用方式：
 *   .use(block)                                    // 注册核心 plugin（数组）
 *   ctx.set(block.key ... blockConfig)             // 可选 filterNodes 定制
 *   view 生命周期里 new BlockProvider(...)
 */
export { block };

/**
 * 找到当前把手指向的顶层 block 节点（用于菜单操作）
 * 若无 active，返回 null
 */
function getActiveBlockRange(view: EditorView, provider: BlockProvider): { pos: number; nodeSize: number } | null {
  const { active } = provider;
  if (!active) return null;
  try {
    // active.$pos 指向 block 起点前一个位置
    const { pos } = active.$pos;
    const node = view.state.doc.nodeAt(pos);
    if (!node) return null;
    return { pos, nodeSize: node.nodeSize };
  } catch {
    return null;
  }
}

function callCommand(ctx: Ctx, key: unknown, payload?: unknown): void {
  try {
    const commands = ctx.get(commandsCtx) as unknown as {
      call: (k: unknown, p?: unknown) => unknown;
    };
    commands.call(key, payload);
  } catch (e) {
    console.warn('[MilkdownBlockHandle] 命令执行失败:', e);
  }
}

interface BlockMenuItem {
  label: string;
  danger?: boolean;
  onSelect: (ctx: Ctx, view: EditorView, provider: BlockProvider) => void;
}

function buildMenu(
  ctx: Ctx,
  hideMenu: () => void,
): {
  dom: HTMLElement;
  showAt: (rect: DOMRect) => void;
  hide: () => void;
  providerRef: { current: BlockProvider | null };
} {
  const dom = document.createElement('div');
  dom.className = 'milkdown-block-menu';
  dom.dataset.show = 'false';
  const providerRef: { current: BlockProvider | null } = { current: null };

  const items: BlockMenuItem[] = [
    {
      label: '转为段落',
      onSelect: (c, view) => {
        selectBlock(view, providerRef.current);
        callCommand(c, turnIntoTextCommand.key);
      },
    },
    {
      label: '转为引用',
      onSelect: (c, view) => {
        selectBlock(view, providerRef.current);
        callCommand(c, wrapInBlockquoteCommand.key);
      },
    },
    {
      label: '复制段落',
      onSelect: (_c, view) => {
        copyBlock(view, providerRef.current);
      },
    },
    { label: '__DIVIDER__', onSelect: () => undefined },
    {
      label: '删除段落',
      danger: true,
      onSelect: (_c, view) => {
        deleteBlock(view, providerRef.current);
      },
    },
  ];

  items.forEach((item) => {
    if (item.label === '__DIVIDER__') {
      const d = document.createElement('div');
      d.className = 'milkdown-block-menu-divider';
      dom.appendChild(d);
      return;
    }
    const el = document.createElement('div');
    el.className = 'milkdown-block-menu-item';
    el.textContent = item.label;
    if (item.danger) el.dataset.danger = 'true';
    el.addEventListener('mousedown', (e) => e.preventDefault());
    el.addEventListener('click', () => {
      const view = ctx.get(editorViewCtx);
      const provider = providerRef.current;
      if (view && provider) item.onSelect(ctx, view, provider);
      hideMenu();
    });
    dom.appendChild(el);
  });

  const showAt = (rect: DOMRect): void => {
    document.body.appendChild(dom);
    dom.dataset.show = 'true';
    // 简单定位在把手右侧，避免遮挡内容
    dom.style.left = `${rect.right + 6}px`;
    dom.style.top = `${rect.top}px`;
  };

  const hide = (): void => {
    dom.dataset.show = 'false';
    if (dom.parentElement) dom.parentElement.removeChild(dom);
  };

  return { dom, showAt, hide, providerRef };
}

/**
 * 把当前 block 选中（NodeSelection），后续命令才能作用于整段
 */
function selectBlock(view: EditorView, provider: BlockProvider | null): void {
  if (!provider?.active) return;
  try {
    const { pos } = provider.active.$pos;
    const sel = NodeSelection.create(view.state.doc, pos);
    view.dispatch(view.state.tr.setSelection(sel));
    view.focus();
  } catch {
    // ignore
  }
}

function copyBlock(view: EditorView, provider: BlockProvider | null): void {
  if (!provider) return;
  const range = getActiveBlockRange(view, provider);
  if (!range) return;
  const { pos, nodeSize } = range;
  try {
    const slice = view.state.doc.slice(pos, pos + nodeSize);
    const tr = view.state.tr.insert(pos + nodeSize, slice.content);
    view.dispatch(tr);
  } catch (e) {
    console.warn('[MilkdownBlockHandle] 复制段落失败:', e);
  }
}

function deleteBlock(view: EditorView, provider: BlockProvider | null): void {
  if (!provider) return;
  const range = getActiveBlockRange(view, provider);
  if (!range) return;
  const { pos, nodeSize } = range;
  try {
    const tr = view.state.tr.delete(pos, pos + nodeSize);
    // 修正选区，避免落在已删除范围里
    const newPos = Math.max(0, pos - 1);
    tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(newPos, tr.doc.content.size))));
    view.dispatch(tr);
    view.focus();
  } catch (e) {
    console.warn('[MilkdownBlockHandle] 删除段落失败:', e);
  }
}

/**
 * 构建把手 DOM（six-dot 图标）
 */
function buildHandle(onMenu: (rect: DOMRect) => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'milkdown-block-handle';
  el.dataset.show = 'false';
  el.title = '拖动此处移动段落，或点击展开操作';
  const dots = document.createElement('div');
  dots.className = 'milkdown-block-handle-dots';
  for (let i = 0; i < 6; i += 1) dots.appendChild(document.createElement('span'));
  el.appendChild(dots);
  // 单击 → 弹菜单（拖拽由 plugin-block 内部接管，不冲突：click 在 mouseup 后触发）
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = el.getBoundingClientRect();
    onMenu(rect);
  });
  return el;
}

/**
 * 在 milkdownAdapter.mount 中调用：
 *   const cleanup = attachBlockHandle(ctx)
 *   editor.destroy() 时调用 cleanup()
 *
 * 返回一个清理函数，用于 destroy 时移除 DOM & unbind service
 */
export function attachBlockHandle(ctx: Ctx): () => void {
  let menu: ReturnType<typeof buildMenu> | null = null;
  const handle = buildHandle((rect) => {
    if (!menu) return;
    menu.showAt(rect);
  });

  menu = buildMenu(ctx, () => menu?.hide());

  const provider = new BlockProvider({
    ctx,
    content: handle,
  });
  menu.providerRef.current = provider;

  provider.update();

  // 点击外部关闭菜单
  const onDocClick = (e: MouseEvent): void => {
    if (!menu) return;
    if (menu.dom.contains(e.target as Node)) return;
    if (handle.contains(e.target as Node)) return;
    menu.hide();
  };
  document.addEventListener('click', onDocClick);

  // 触发 update，让 provider 完成 init & 挂 event
  // block-plugin 是 prose plugin，会自动在 editor state 变化时刷新，无需手动 update

  return () => {
    document.removeEventListener('click', onDocClick);
    menu?.hide();
    try {
      provider.destroy();
    } catch {
      // ignore
    }
  };
}
