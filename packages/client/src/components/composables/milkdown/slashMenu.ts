import { commandsCtx, editorViewCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import type { EditorState } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';
import {
  createCodeBlockCommand,
  insertHrCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInHeadingCommand,
  wrapInOrderedListCommand,
} from '@milkdown/kit/preset/commonmark';
import { insertTableCommand } from '@milkdown/kit/preset/gfm';
import { slashFactory, SlashProvider } from '@milkdown/kit/plugin/slash';

/**
 * 斜杠菜单（Slash Menu）
 *
 * 触发：在段落起始输入 `/` 且后续字符匹配某个命令关键字。
 *
 * 实现要点：
 *  - `slashFactory` 生成 [spec, plugin]，同 tooltipFactory
 *  - 通过 provider.getContent(view) 拿到从触发字符 `/` 到光标的文本，用于过滤命令
 *  - Enter / ↑↓ / Esc 走 keydown 拦截，避免误提交
 *  - 选中命令后：先删掉 `/xxx` 触发文本，再执行对应命令
 */
export const slashMenu = slashFactory('milkdown-slash');

interface SlashItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
  keywords: string[];
  run: (ctx: Ctx) => void;
}

function callCommand(ctx: Ctx, key: unknown, payload?: unknown): void {
  try {
    const commands = ctx.get(commandsCtx) as unknown as {
      call: (k: unknown, p?: unknown) => unknown;
    };
    commands.call(key, payload);
  } catch (e) {
    console.warn('[MilkdownSlash] 命令执行失败:', e);
  }
}

const SLASH_ITEMS: SlashItem[] = [
  {
    id: 'h1',
    title: '一级标题',
    desc: 'Heading 1 · #',
    icon: 'H1',
    keywords: ['h1', 'heading1', 'title', '标题', 'yijibiaoti'],
    run: (ctx) => callCommand(ctx, wrapInHeadingCommand.key, 1),
  },
  {
    id: 'h2',
    title: '二级标题',
    desc: 'Heading 2 · ##',
    icon: 'H2',
    keywords: ['h2', 'heading2', 'ejibiaoti'],
    run: (ctx) => callCommand(ctx, wrapInHeadingCommand.key, 2),
  },
  {
    id: 'h3',
    title: '三级标题',
    desc: 'Heading 3 · ###',
    icon: 'H3',
    keywords: ['h3', 'heading3', 'sanjibiaoti'],
    run: (ctx) => callCommand(ctx, wrapInHeadingCommand.key, 3),
  },
  {
    id: 'ul',
    title: '无序列表',
    desc: 'Bulleted list',
    icon: '•',
    keywords: ['ul', 'list', 'bullet', 'liebiao', 'wuxuliebiao'],
    run: (ctx) => callCommand(ctx, wrapInBulletListCommand.key),
  },
  {
    id: 'ol',
    title: '有序列表',
    desc: 'Numbered list',
    icon: '1.',
    keywords: ['ol', 'ordered', 'number', 'youxuliebiao'],
    run: (ctx) => callCommand(ctx, wrapInOrderedListCommand.key),
  },
  {
    id: 'quote',
    title: '引用',
    desc: 'Blockquote',
    icon: '❞',
    keywords: ['quote', 'blockquote', 'yinyong'],
    run: (ctx) => callCommand(ctx, wrapInBlockquoteCommand.key),
  },
  {
    id: 'code',
    title: '代码块',
    desc: 'Code block',
    icon: '</>',
    keywords: ['code', 'codeblock', 'daimakuai'],
    run: (ctx) => callCommand(ctx, createCodeBlockCommand.key),
  },
  {
    id: 'hr',
    title: '分割线',
    desc: 'Horizontal rule',
    icon: '—',
    keywords: ['hr', 'divider', 'fengexian'],
    run: (ctx) => callCommand(ctx, insertHrCommand.key),
  },
  {
    id: 'table',
    title: '表格',
    desc: 'Insert table (3x3)',
    icon: '⊞',
    keywords: ['table', 'biaoge'],
    run: (ctx) => callCommand(ctx, insertTableCommand.key),
  },
];

function filterItems(query: string): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_ITEMS;
  return SLASH_ITEMS.filter((it) => {
    if (it.title.includes(q)) return true;
    return it.keywords.some((k) => k.includes(q));
  });
}

/**
 * 在插入命令前，删除掉从 `/` 开始到光标的这段 trigger 文本
 * （提取自 view.state.selection.$from 到 paragraph 起点扫描 `/`）
 */
function removeSlashTrigger(view: EditorView): void {
  const { state } = view;
  const { $from } = state.selection;
  const { parentOffset } = $from;
  const { parent } = $from;
  const text = parent.textBetween(0, parentOffset, undefined, '\uFFFC');
  const slashIndex = text.lastIndexOf('/');
  if (slashIndex < 0) return;
  const from = $from.pos - (parentOffset - slashIndex);
  const to = $from.pos;
  view.dispatch(state.tr.delete(from, to));
}

/**
 * 配置 slash 菜单。挂 keydown 到 editor view，接管 Enter/↑↓/Esc
 */
export function configureSlashMenu(ctx: Ctx): {
  view: (view: EditorView) => {
    update: (view: EditorView, prevState?: EditorState) => void;
    destroy: () => void;
  };
} {
  const dom = document.createElement('div');
  dom.className = 'milkdown-slash-menu';
  dom.dataset.show = 'false';
  // 根容器兜底：任何落在菜单空白/滚动条区域的 mousedown 也阻止默认，
  // 保证 editor 不会因为鼠标点在菜单外框而失焦，从而触发 SlashProvider
  // 的 shouldShow → hide 链路。
  dom.addEventListener('mousedown', (e) => {
    e.preventDefault();
  });

  let filtered: SlashItem[] = SLASH_ITEMS;
  let activeIndex = 0;
  let currentView: EditorView | null = null;

  const render = (): void => {
    dom.innerHTML = '';
    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'milkdown-slash-menu-empty';
      empty.textContent = '未匹配到命令';
      dom.appendChild(empty);
      return;
    }
    filtered.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'milkdown-slash-item';
      el.dataset.active = idx === activeIndex ? 'true' : 'false';
      el.dataset.id = item.id;
      el.innerHTML = `
        <span class="milkdown-slash-item-icon">${item.icon}</span>
        <span class="milkdown-slash-item-body">
          <span class="milkdown-slash-item-title"></span>
          <span class="milkdown-slash-item-desc"></span>
        </span>
      `;
      (el.querySelector('.milkdown-slash-item-title') as HTMLElement).textContent = item.title;
      (el.querySelector('.milkdown-slash-item-desc') as HTMLElement).textContent = item.desc;
      // 使用 mousedown 直接触发命令：
      // 1) preventDefault 阻止 editor 失焦 —— 保证 SlashProvider.getContent
      //    在下一个 update 周期里仍然把菜单视作 focus 内元素；
      // 2) 直接在 mousedown 里执行 pickCurrent，避免等到 click（其间可能被
      //    SlashProvider 的 30ms debounce hide 掉、pointer-events 变 none 而
      //    导致 click 完全打不上）。
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        activeIndex = idx;
        pickCurrent();
      });
      el.addEventListener('mouseenter', () => {
        activeIndex = idx;
        render();
      });
      dom.appendChild(el);
    });
  };

  const pickCurrent = (): void => {
    const item = filtered[activeIndex];
    if (!item || !currentView) return;
    // 先移除 `/xxx` 触发文本再执行命令，保证命令作用在干净段落上
    removeSlashTrigger(currentView);
    item.run(ctx);
    currentView.focus();
    provider.hide();
  };

  // 键盘事件必须挂在 editor view 上，因为浮层没有 focus
  const onKeyDown = (e: KeyboardEvent): void => {
    if (dom.dataset.show !== 'true') return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % Math.max(filtered.length, 1);
      render();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + filtered.length) % Math.max(filtered.length, 1);
      render();
      return;
    }
    if (e.key === 'Enter') {
      if (filtered.length === 0) {
        provider.hide();
        return;
      }
      e.preventDefault();
      pickCurrent();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      provider.hide();
    }
  };

  const provider = new SlashProvider({
    content: dom,
    debounce: 30,
    offset: 8,
    trigger: '/',
    shouldShow(this: SlashProvider, view) {
      const content = this.getContent(view);
      if (!content) return false;
      const slashIndex = content.lastIndexOf('/');
      if (slashIndex < 0) return false;
      // 只有当 `/` 及其之后的字符不含空格时才继续展示（模拟 Notion）
      const query = content.slice(slashIndex + 1);
      if (/\s/.test(query)) return false;
      filtered = filterItems(query);
      activeIndex = 0;
      render();
      return true;
    },
  });

  render();

  return {
    view: (view) => {
      currentView = view;
      view.dom.addEventListener('keydown', onKeyDown, true);
      return {
        update: (v, prev) => {
          currentView = v;
          provider.update(v, prev);
        },
        destroy: () => {
          view.dom.removeEventListener('keydown', onKeyDown, true);
          provider.destroy();
          dom.remove();
          currentView = null;
        },
      };
    },
  };
}

// editorViewCtx 保留 import 以便未来扩展命令内部读取 view，此处并未直接使用
void editorViewCtx;
