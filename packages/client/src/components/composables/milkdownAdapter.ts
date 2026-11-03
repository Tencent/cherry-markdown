import { tableBlock, tableBlockConfig } from '@milkdown/components/table-block';
import { Editor, defaultValueCtx, editorViewCtx, editorViewOptionsCtx, rootCtx } from '@milkdown/kit/core';
import { block } from '@milkdown/kit/plugin/block';
import { clipboard } from '@milkdown/kit/plugin/clipboard';
import { cursor } from '@milkdown/kit/plugin/cursor';
import { history, historyProviderPlugin } from '@milkdown/kit/plugin/history';
import { indent } from '@milkdown/kit/plugin/indent';
import { math } from '@milkdown/plugin-math';
import { trailing } from '@milkdown/kit/plugin/trailing';
import { upload, uploadConfig } from '@milkdown/kit/plugin/upload';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import type { Node } from '@milkdown/kit/prose/model';
import { nord } from '@milkdown/theme-nord';
import { $prose, getMarkdown } from '@milkdown/kit/utils';
import '@milkdown/theme-nord/style.css';
import 'katex/dist/katex.min.css';
import '../../styles/milkdown-plugins.css';

import { attachBlockHandle } from './milkdown/blockHandle';
import { clearHistory, documentChanges, writeMarkdown } from './milkdown/document';
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
 *  - documentChanges：按事务来源回传用户编辑
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
const adapter: MilkdownAdapter = {
  async mount(initialMarkdown, onChange) {
    await adapter.destroy();
    cachedMarkdown = initialMarkdown;

    const root = document.getElementById('milkdown-editor');
    if (!root) {
      throw new Error('Milkdown editor container is missing.');
    }
    // 清理占位内容（骨架期 useMilkdownEditor 会写入未接入提示）
    root.innerHTML = '';

    const creating = Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, initialMarkdown);

        // 编辑区外观：铺满容器 & 允许滚动 + 添加根类名（供样式定位）
        ctx.update(editorViewOptionsCtx, (prev) => ({
          ...prev,
          editable: () => editorReady,
          attributes: (state) => {
            const prevAttrs = typeof prev.attributes === 'function' ? prev.attributes(state) : prev.attributes;
            return {
              ...prevAttrs,
              class: [prevAttrs?.class || '', 'milkdown-editor-root'].filter(Boolean).join(' '),
            };
          },
        }));

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
      .use(
        $prose(() =>
          documentChanges(() => {
            if (!editorReady || !instance) return;
            cachedMarkdown = instance.action(getMarkdown());
            onChange();
          }),
        ),
      )
      .use(upload)
      .use(indent)
      .use(trailing)
      .use(math)
      .use(block)
      .use(selectionTooltip)
      .use(slashMenu);
    instance = creating;
    try {
      await creating.create();
    } catch (error) {
      instance = null;
      await creating.destroy();
      throw error;
    }

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
    instance.action((ctx) => ctx.get(editorViewCtx).setProps({ editable: () => editorReady }));
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
    const previous = instance;
    instance = null;
    editorReady = false;
    cachedMarkdown = '';
    if (!previous) return;
    previous.action((ctx) => ctx.get(editorViewCtx).setProps({ editable: () => false }));
    await previous.destroy();
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
    if (!instance || !editorReady) {
      cachedMarkdown = md;
      return;
    }
    instance.action((ctx) => writeMarkdown(ctx, md));
    cachedMarkdown = instance.action(getMarkdown());
  },

  clearUndoRedo() {
    if (!instance || !editorReady) return;
    instance.action((ctx) => clearHistory(ctx.get(editorViewCtx), historyProviderPlugin.plugin()));
  },
};

// MilkdownAdapter 契约允许 destroy 返回 Promise，直接注册即可
registerMilkdownAdapter(adapter);
