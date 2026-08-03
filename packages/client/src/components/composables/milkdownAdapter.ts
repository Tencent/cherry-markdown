import { tableBlock, tableBlockConfig } from '@milkdown/components/table-block';
import { Editor, defaultValueCtx, editorViewOptionsCtx, rootCtx } from '@milkdown/kit/core';
import { block } from '@milkdown/kit/plugin/block';
import { clipboard } from '@milkdown/kit/plugin/clipboard';
import { cursor } from '@milkdown/kit/plugin/cursor';
import { history } from '@milkdown/kit/plugin/history';
import { indent } from '@milkdown/kit/plugin/indent';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { math } from '@milkdown/plugin-math';
import { trailing } from '@milkdown/kit/plugin/trailing';
import { upload, uploadConfig } from '@milkdown/kit/plugin/upload';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import type { Node } from '@milkdown/kit/prose/model';
import { nord } from '@milkdown/theme-nord';
import { getMarkdown, replaceAll } from '@milkdown/kit/utils';
import '@milkdown/theme-nord/style.css';
import 'katex/dist/katex.min.css';
import '../../styles/milkdown-plugins.css';

import { attachBlockHandle } from './milkdown/blockHandle';
import { configureSelectionTooltip, selectionTooltip } from './milkdown/selectionTooltip';
import { configureSlashMenu, slashMenu } from './milkdown/slashMenu';
import { uploadImageFile } from './useImageBedUploader';
import { registerMilkdownAdapter, type MilkdownAdapter } from './useMilkdownEditor';

/**
 * Milkdown 真实适配器（完整形态）
 *
 * 已启用的能力：
 *  - preset-commonmark / preset-gfm：CommonMark + 表格 / 删除线 / 任务列表 / 自动链接
 *  - plugin-history：撤销重做（Mod-Z / Mod-Shift-Z）
 *  - plugin-clipboard：Markdown 感知的复制粘贴
 *  - plugin-cursor：块级拖拽指示光标 & gap cursor
 *  - plugin-listener：内容变更事件回传
 *  - plugin-upload：文件拖入/粘贴 → 图床
 *  - plugin-indent：Tab 缩进
 *  - plugin-trailing：末尾自动补一个空段落，避免 caret 走投无路
 *  - plugin-math：$..$ 行内公式、$$..$$ 块公式（katex 渲染）
 *  - plugin-block：段落拖拽把手（内部实现 dragstart/drop 完整流程）
 *  - components/table-block：GFM 表格的交互式 NodeView，hover 显示行/列把手，支持
 *    拖拽行列、对齐方式切换、插入/删除行列（完全所见即所得，底层 markdown 仍为 GFM 表格）
 *  - 自研 selectionTooltip：选区浮动格式化工具栏
 *  - 自研 slashMenu：`/` 命令菜单（h1/h2/h3/ul/ol/quote/code/hr/table）
 *  - 自研 blockHandle：段落把手 + 菜单（转段/转引用/复制/删除）
 *
 * 未接入（后续可加）：
 *  - Mermaid / drawio / ECharts —— 依赖 Cherry 的图形渲染栈，Milkdown 侧需要自研 diagram node
 */

let instance: Editor | null = null;
let cachedMarkdown = '';
let editorReady = false;
let cleanupBlockHandle: (() => void) | null = null;
/**
 * "程序性基线"：由 mount / setMarkdown 主动写入的原始 markdown。
 *
 * 用于在 markdownUpdated 回调里判断"这次事件是不是由我们自己的程序性写入引发的"。
 * 只要 Milkdown 序列化出来的 md === programmaticBaseline，就认为不是用户编辑。
 *
 * 这种"基于内容而非时序"的抑制方式比抑制窗口更稳健：
 *  - 不用担心 tableBlock / math 等 NodeView 在异步 microtask/task 里补 transaction
 *  - 不用担心 trailing 插件在打开时自动补空段落引发的"回声"事件
 *  - 用户真正编辑时，md 必然与 baseline 不同，能被正常识别
 *
 * 使用 Set 以支持"程序性 md → Milkdown 内部规范化后的 md"这种一次写入产生多次
 * 语义等价 md 的场景（比如末尾空行差异、trailing 补段落）。
 */
const programmaticBaselines = new Set<string>();

/**
 * 把一个 markdown 字符串标为"程序性基线"，同时把它的常见规范化变体也一并加入，
 * 覆盖 Milkdown 序列化后可能出现的末尾换行差异、trailing 空段落等。
 */
function markProgrammatic(md: string): void {
  programmaticBaselines.add(md);
  // 常见规范化变体：trailing 换行 & 双换行 & 去尾换行
  programmaticBaselines.add(md.replace(/\n+$/, ''));
  programmaticBaselines.add(`${md.replace(/\n+$/, '')}\n`);
  programmaticBaselines.add(`${md.replace(/\n+$/, '')}\n\n`);
}

const adapter: MilkdownAdapter = {
  async mount(initialMarkdown, onChange) {
    // 若旧实例残留，先销毁，避免同一容器上双挂载
    if (instance) {
      await instance.destroy();
      instance = null;
    }

    cachedMarkdown = initialMarkdown;
    editorReady = false;
    // 把初始内容也标为"程序性基线"，避免 mount 完成后紧接着到来的
    // trailing 补段落/其他插件规范化事件被误当作用户编辑。
    programmaticBaselines.clear();
    markProgrammatic(initialMarkdown);

    const root = document.getElementById('milkdown-editor');
    if (!root) {
      console.warn('[MilkdownAdapter] #milkdown-editor 容器不存在，挂载中止');
      return;
    }
    // 清理占位内容（骨架期 useMilkdownEditor 会写入未接入提示）
    root.innerHTML = '';

    instance = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, initialMarkdown);

        // 编辑区外观：铺满容器 & 允许滚动 + 添加根类名（供样式定位）
        ctx.update(editorViewOptionsCtx, (prev) => ({
          ...prev,
          attributes: (state) => {
            const prevAttrs = typeof prev.attributes === 'function' ? prev.attributes(state) : prev.attributes;
            return {
              ...prevAttrs,
              class: [prevAttrs?.class || '', 'milkdown-editor-root'].filter(Boolean).join(' '),
            };
          },
        }));

        // 监听 markdown 更新 → 回传给 useMilkdownEditor
        ctx.get(listenerCtx).markdownUpdated((_ctx, md, prevMd) => {
          if (md === prevMd) return;
          cachedMarkdown = md;
          // 编辑器初始加载 defaultValueCtx 时 prevMd 为空，可能会触发一次"上升沿"，
          // 借助 editorReady 屏蔽掉这次事件，避免误标记 unsaved。
          if (!editorReady) return;
          // 内容基线比对：如果这次 md 与我们最近一次程序性写入的内容完全相同
          // （或是其常见规范化变体），说明这次事件不是用户编辑触发的（很可能是
          // trailing 插件补空段落 / tableBlock NodeView 异步补 transaction 等）。
          // 这类"回声"事件必须屏蔽，否则打开文件立刻会被标记为未保存。
          if (programmaticBaselines.has(md)) return;
          onChange();
        });

        // 图床对接：把 ProseMirror 的 FileList → useImageBedUploader → image 节点
        ctx.update(uploadConfig.key, (prev) => ({
          ...prev,
          uploader: async (files, schema) => {
            const imgFiles: File[] = [];
            for (let i = 0; i < files.length; i++) {
              const file = files.item(i);
              if (!file) continue;
              if (!/^image\//i.test(file.type)) continue;
              imgFiles.push(file);
            }
            if (imgFiles.length === 0) return [];

            const uploaded = await Promise.all(
              imgFiles.map(async (file) => {
                const url = await uploadImageFile(file);
                const alt = file.name.replace(/\.[^.]+$/, '') || 'image';
                return { alt, src: url };
              }),
            );

            const imageType = schema.nodes.image;
            if (!imageType) {
              console.warn('[MilkdownAdapter] schema 缺少 image 节点，忽略上传结果');
              return [];
            }

            return uploaded
              .filter((it) => !!it.src)
              .map(({ alt, src }) => imageType.createAndFill({ src, alt }) as Node);
          },
        }));

        // 选区工具栏：ctx.set(spec.key, PluginSpec)，plugin 内部会实例化 ProseMirror Plugin
        ctx.set(selectionTooltip.key, configureSelectionTooltip(ctx));
        // 斜杠菜单
        ctx.set(slashMenu.key, configureSlashMenu(ctx));

        // 表格 NodeView 按钮图标：返回 HTML 字符串，会被插入到 handle 里。
        // 使用 currentColor 以自动适配明/暗色主题。
        ctx.set(tableBlockConfig.key, {
          renderButton: (renderType) => {
            const icons: Record<typeof renderType, string> = {
              add_row:
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
              add_col:
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
              delete_row:
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
              delete_col:
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
              align_col_left:
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h13M3 12h10M3 18h13"/></svg>',
              align_col_center:
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6h14M8 12h8M5 18h14"/></svg>',
              align_col_right:
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M11 12h10M8 18h13"/></svg>',
              row_drag_handle:
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
              col_drag_handle:
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
            };
            return icons[renderType] ?? '';
          },
        });
      })
      .config(nord)
      .use(commonmark)
      .use(gfm)
      // tableBlock 必须在 gfm 之后：它会用 $View 覆盖 gfm 内置的 table NodeView，提供 Notion 风拖拽/按钮
      .use(tableBlock)
      .use(history)
      .use(clipboard)
      .use(cursor)
      .use(listener)
      .use(upload)
      .use(indent)
      .use(trailing)
      .use(math)
      .use(block)
      .use(selectionTooltip)
      .use(slashMenu)
      .create();

    // 段落把手需要拿 ctx，只能在 editor 创建成功后再挂
    try {
      instance.action((ctx) => {
        cleanupBlockHandle = attachBlockHandle(ctx);
      });
    } catch (e) {
      console.warn('[MilkdownAdapter] blockHandle 初始化失败:', e);
      cleanupBlockHandle = null;
    }

    editorReady = true;
  },

  async destroy() {
    if (cleanupBlockHandle) {
      try {
        cleanupBlockHandle();
      } catch {
        /* ignore */
      }
      cleanupBlockHandle = null;
    }
    if (!instance) return;
    try {
      await instance.destroy();
    } catch (e) {
      console.warn('[MilkdownAdapter] destroy 异常:', e);
    }
    instance = null;
    cachedMarkdown = '';
    editorReady = false;
    programmaticBaselines.clear();
    const root = document.getElementById('milkdown-editor');
    if (root) root.innerHTML = '';
  },

  getMarkdown() {
    if (!instance || !editorReady) return cachedMarkdown;
    try {
      return instance.action(getMarkdown());
    } catch (e) {
      console.warn('[MilkdownAdapter] getMarkdown 异常，回退缓存值:', e);
      return cachedMarkdown;
    }
  },

  setMarkdown(md) {
    cachedMarkdown = md;
    if (!instance || !editorReady) return;
    // 把本次程序性写入的内容加入基线集合，让 markdownUpdated 回调能识别出
    // 由 replaceAll 触发的（及后续 trailing/tableBlock 补事件等）都不是用户编辑。
    //
    // 注意：这里不 clear() 旧基线，而是追加。因为 replaceAll 前后可能会短暂经历
    // 一次"prevMd → 空文档 → newMd"的中间状态，旧内容也需要短暂保留在集合中
    // 避免中间态误触发脏标记。集合下次 mount/destroy 时会整体清空。
    markProgrammatic(md);
    try {
      instance.action(replaceAll(md));
    } catch (e) {
      console.warn('[MilkdownAdapter] setMarkdown 异常:', e);
    }
  },
};

// MilkdownAdapter 契约允许 destroy 返回 Promise，直接注册即可
registerMilkdownAdapter(adapter);
