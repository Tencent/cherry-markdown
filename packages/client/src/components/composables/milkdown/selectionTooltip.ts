import { commandsCtx, editorViewCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import type { EditorState } from '@milkdown/kit/prose/state';
import { TextSelection } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';
import {
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleLinkCommand,
  toggleStrongCommand,
} from '@milkdown/kit/preset/commonmark';
import { toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm';
import { tooltipFactory, TooltipProvider } from '@milkdown/kit/plugin/tooltip';

/**
 * 选区工具栏（Selection Tooltip）
 *
 * 当用户在编辑区选中一段非空文本时，浮出格式化按钮组：
 *  加粗 / 斜体 / 删除线 / 行内代码 / 链接
 *
 * 实现要点：
 *  - `tooltipFactory` 生成一对 [spec, plugin]，两者需要同时 use()
 *  - 通过 `ctx.set(factory.key, {...})` 在 view 生命周期里创建 TooltipProvider
 *  - 每个按钮点击 → `commandsCtx.call(commandKey)` 触发对应命令
 *  - 按钮激活态：读取当前选区里是否已应用相应 mark，动态给 data-active 属性
 *  - shouldShow：跳过空选区、代码块内、只读态
 */
export const selectionTooltip = tooltipFactory('milkdown-selection');

interface TooltipButtonSpec {
  key: string;
  label: string;
  title: string;
  markName: string; // schema.marks 里的 name，用于计算 active
  onClick: (ctx: Ctx) => void;
}

/**
 * 检查选区是否命中某个 mark（用于按钮 active 态）
 */
function isMarkActive(state: EditorState, markName: string): boolean {
  const type = state.schema.marks[markName];
  if (!type) return false;
  const { from, $from, to, empty } = state.selection;
  if (empty) {
    return !!type.isInSet(state.storedMarks || $from.marks());
  }
  return state.doc.rangeHasMark(from, to, type);
}

/**
 * 判断当前选区是否落在纯 code_block / math_block 等不支持行内格式化的节点中
 */
function isInsideRestrictedBlock(state: EditorState): boolean {
  const { $from } = state.selection;
  for (let d = $from.depth; d >= 0; d -= 1) {
    const node = $from.node(d);
    if (['code_block', 'math_block'].includes(node.type.name)) return true;
  }
  return false;
}

function createButton(ctx: Ctx, spec: TooltipButtonSpec, refreshState: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.dataset.mark = spec.markName;
  btn.dataset.key = spec.key;
  btn.title = spec.title;
  btn.innerHTML = spec.label;
  // 阻止 mousedown 让编辑器失焦（否则命令拿到的 selection 已经无效）
  btn.addEventListener('mousedown', (e) => e.preventDefault());
  btn.addEventListener('click', () => {
    spec.onClick(ctx);
    // 命令执行完后立即刷新一次高亮状态
    refreshState();
  });
  return btn;
}

function callCommand(ctx: Ctx, commandKey: unknown): void {
  try {
    // commandsCtx.call 的类型约束比较宽泛，用 unknown 桥接一层即可
    const commands = ctx.get(commandsCtx) as unknown as {
      call: (key: unknown, payload?: unknown) => unknown;
    };
    commands.call(commandKey);
  } catch (e) {
    console.warn('[MilkdownTooltip] 命令执行失败:', commandKey, e);
  }
}

/**
 * 组装 tooltip 内容 DOM。
 * 每次 shouldShow 命中都会 refreshState 一次，用于同步按钮 active 态。
 */
function buildContent(ctx: Ctx): { dom: HTMLElement; refresh: () => void } {
  const dom = document.createElement('div');
  dom.className = 'milkdown-selection-tooltip';
  dom.setAttribute('data-show', 'false');

  const buttons: TooltipButtonSpec[] = [
    {
      key: 'bold',
      label: '<b>B</b>',
      title: '加粗 (Ctrl+B)',
      markName: 'strong',
      onClick: (c) => callCommand(c, toggleStrongCommand.key),
    },
    {
      key: 'italic',
      label: '<i>I</i>',
      title: '斜体 (Ctrl+I)',
      markName: 'emphasis',
      onClick: (c) => callCommand(c, toggleEmphasisCommand.key),
    },
    {
      key: 'strike',
      label: '<span style="text-decoration:line-through">S</span>',
      title: '删除线',
      markName: 'strike_through',
      onClick: (c) => callCommand(c, toggleStrikethroughCommand.key),
    },
    {
      key: 'code',
      label: '<code style="font-family:monospace;font-size:12px">&lt;/&gt;</code>',
      title: '行内代码',
      markName: 'code_inline',
      onClick: (c) => callCommand(c, toggleInlineCodeCommand.key),
    },
    {
      key: 'link',
      label: '<span style="font-size:13px">🔗</span>',
      title: '链接',
      markName: 'link',
      onClick: (c) => {
        // toggleLinkCommand 要求 href；简单起见，弹一次原生 prompt
        const href = window.prompt('输入链接地址', 'https://');
        if (!href) return;
        try {
          const commands = c.get(commandsCtx) as unknown as {
            call: (key: unknown, payload?: unknown) => unknown;
          };
          commands.call(toggleLinkCommand.key, { href });
        } catch (e) {
          console.warn('[MilkdownTooltip] 插入链接失败:', e);
        }
      },
    },
  ];

  const refs: { spec: TooltipButtonSpec; el: HTMLButtonElement }[] = [];
  buttons.forEach((spec, i) => {
    if (i === buttons.length - 1) {
      const divider = document.createElement('span');
      divider.className = 'mkd-divider';
      dom.appendChild(divider);
    }
    const el = createButton(ctx, spec, () => refresh());
    dom.appendChild(el);
    refs.push({ spec, el });
  });

  const refresh = (): void => {
    try {
      const view = ctx.get(editorViewCtx);
      const { state } = view;
      for (const ref of refs) {
        const target = ref.el;
        target.dataset.active = isMarkActive(state, ref.spec.markName) ? 'true' : 'false';
      }
    } catch {
      // ignore
    }
  };

  return { dom, refresh };
}

/**
 * 在 milkdownAdapter.mount 内调用此函数：
 *  ctx.set(selectionTooltip.key, configureSelectionTooltip(ctx))
 */
export function configureSelectionTooltip(ctx: Ctx): {
  view: (view: EditorView) => {
    update: (view: EditorView, prevState?: EditorState) => void;
    destroy: () => void;
  };
} {
  const { dom, refresh } = buildContent(ctx);

  return {
    view: (_view) => {
      const provider = new TooltipProvider({
        content: dom,
        debounce: 60,
        offset: 8,
        shouldShow: (view) => {
          const { doc, selection } = view.state;
          const { empty, from, to } = selection;
          if (!view.hasFocus() && !dom.contains(document.activeElement)) return false;
          if (!view.editable) return false;
          if (empty) return false;
          if (!(selection instanceof TextSelection)) return false;
          if (!doc.textBetween(from, to).length) return false;
          if (isInsideRestrictedBlock(view.state)) return false;
          return true;
        },
      });
      return {
        update: (view, prevState) => {
          provider.update(view, prevState);
          if (dom.dataset.show === 'true') refresh();
        },
        destroy: () => {
          provider.destroy();
          dom.remove();
        },
      };
    },
  };
}
