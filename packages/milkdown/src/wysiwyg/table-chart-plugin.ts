import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { Plugin, PluginKey, type Selection } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet, type EditorView } from '@milkdown/kit/prose/view';
import { $prose } from '@milkdown/kit/utils';
import { EXTERNAL_MARKDOWN_UPDATE } from '../document-update.js';
import { cherryWysiwygConfigCtx, type CherryWysiwygConfig } from './config.js';
import { sanitizedEngineFragment } from './html-sanitizer.js';
import type { CherryVisualRendererResult } from './types.js';
import { createRendererCleanup, reportRendererError } from './renderer-cleanup.js';

interface TableChartRevision {
  position: number;
  source: string;
  syntax: string;
}

const widgetSelector = '[data-cherry-milkdown-table-chart-widget]';
const descriptorPattern = /^:(\w+):(?:\s*(\{[\s\S]*\}))?\s*$/;
const previewKey = new PluginKey<Map<number, TableChartRevision>>('cherryTableChartPreview');

function insideDescriptor(doc: ProseNode, selection: Selection, position: number) {
  const table = doc.nodeAt(position);
  if (table?.type.name !== 'table') return false;
  const cell = table.firstChild?.firstChild;
  const from = position + 2; // table opening + first row opening
  return Boolean(cell && selection.from >= from && selection.to <= from + cell.nodeSize);
}

function escapeCell(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function delimiterFor(cell: ProseNode) {
  switch (cell.attrs.alignment) {
    case 'center':
      return ':---:';
    case 'right':
      return '---:';
    default:
      return '---';
  }
}

/**
 * Convert the current ProseMirror table value into the documented Cherry
 * table-chart syntax. The editable table remains the source of truth; this
 * string exists only as renderer input and is never written back to the DOM.
 */
export function tableChartRevision(node: ProseNode, position: number): TableChartRevision | undefined {
  if (node.type.name !== 'table' || node.childCount < 2) return undefined;
  const header = node.firstChild;
  if (!header?.childCount) return undefined;
  const descriptor = descriptorPattern.exec(header.firstChild?.textContent.trim() ?? '');
  if (!descriptor?.[1]) return undefined;

  const rows: string[][] = [];
  node.forEach((row) => {
    const cells: string[] = [];
    row.forEach((cell) => cells.push(escapeCell(cell.textContent)));
    rows.push(cells);
  });
  const width = Math.max(...rows.map((row) => row.length));
  if (width < 2) return undefined;
  rows.forEach((row) => {
    while (row.length < width) row.push('');
  });
  const delimiter: string[] = [];
  for (let index = 0; index < width; index += 1) {
    const cell = header.maybeChild(index);
    delimiter.push(cell ? delimiterFor(cell) : '---');
  }
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`;

  return {
    position,
    source: [line(rows[0] ?? []), line(delimiter), ...rows.slice(1).map(line)].join('\n'),
    syntax: descriptor[1],
  };
}

function tableChartRevisions(doc: ProseNode) {
  const revisions = new Map<number, TableChartRevision>();
  doc.descendants((node, position) => {
    const revision = tableChartRevision(node, position);
    if (revision) revisions.set(position, revision);
  });
  return revisions;
}

function createChartPreview() {
  const preview = document.createElement('div');
  preview.className = 'cherry-table-chart__preview';
  const mount = document.createElement('figure');
  mount.className = 'cherry-table-figure';
  preview.append(mount);
  return { preview, mount };
}

class TableChartPreview {
  private source = '';
  private syntax = '';
  private destroyed = false;
  private renderVersion = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private pendingController?: AbortController;
  private activeController?: AbortController;
  private cleanup?: () => void;
  private preview: HTMLElement;

  constructor(
    private readonly dom: HTMLElement,
    private readonly config: CherryWysiwygConfig,
  ) {
    const { preview, mount } = createChartPreview();
    // Reserve the same figure (including Cherry's margins) as the rendered
    // chart, so lazy ECharts loading cannot move a cell between mouse clicks.
    mount.style.minHeight = '300px';
    this.preview = preview;
    dom.append(this.preview);
  }

  update(revision: TableChartRevision, immediate = false) {
    if (revision.source === this.source && revision.syntax === this.syntax) return;
    const firstRevision = !this.source;
    this.source = revision.source;
    this.syntax = revision.syntax;
    if (this.timer) clearTimeout(this.timer);
    if (immediate || firstRevision) this.render();
    else {
      this.timer = setTimeout(() => {
        this.timer = undefined;
        this.render();
      }, this.config.debounce);
    }
  }

  destroy() {
    this.destroyed = true;
    this.renderVersion += 1;
    if (this.timer) clearTimeout(this.timer);
    this.pendingController?.abort();
    this.activeController?.abort();
    this.cleanup?.();
  }

  private render() {
    if (this.destroyed) return;
    const renderer = this.config.renderers?.tableChart;
    if (!renderer) return;
    this.timer = undefined;
    this.renderVersion += 1;
    const version = this.renderVersion;
    this.pendingController?.abort();
    const controller = new AbortController();
    this.pendingController = controller;
    const cleanups = createRendererCleanup(controller.signal, (error) => this.config.onError?.(error, 'render'));

    // Render the next revision outside document flow. The current chart stays
    // visible until the replacement succeeds, preventing cell edits from
    // collapsing the page or flashing an empty chart.
    const staging = document.createElement('div');
    staging.className = 'cherry-table-chart__staging';
    staging.setAttribute('aria-hidden', 'true');
    const { preview: nextPreview, mount } = createChartPreview();
    staging.append(nextPreview);
    this.dom.append(staging);

    let result: CherryVisualRendererResult | Promise<CherryVisualRendererResult>;
    try {
      result = renderer({
        container: mount,
        engine: this.config.engine,
        source: this.source,
        syntax: this.syntax,
        signal: controller.signal,
      });
    } catch (error) {
      staging.remove();
      this.reportError(error, version);
      return;
    }

    void Promise.resolve(result)
      .then((cleanup) => {
        if (typeof cleanup === 'function') cleanups.add(cleanup);
        if (this.destroyed || version !== this.renderVersion || controller.signal.aborted) {
          staging.remove();
          return;
        }
        if (typeof cleanup === 'string') mount.replaceChildren(sanitizedEngineFragment(cleanup));
        this.activeController?.abort();
        this.cleanup?.();
        this.preview.replaceWith(nextPreview);
        this.preview = nextPreview;
        this.activeController = controller;
        this.cleanup = cleanups.dispose;
        this.pendingController = undefined;
        staging.remove();
      })
      .catch((error: unknown) => {
        staging.remove();
        this.reportError(error, version);
      });
  }

  private reportError(error: unknown, version: number) {
    if (this.destroyed || version !== this.renderVersion) return;
    this.pendingController?.abort();
    this.pendingController = undefined;
    this.preview.dataset.renderError = 'true';
    if (!this.activeController) {
      const status = document.createElement('p');
      status.setAttribute('role', 'alert');
      status.textContent = '图表暂时无法渲染，请检查表格内容。';
      this.preview.replaceChildren(status);
    }
    reportRendererError(error, (cause) => this.config.onError?.(cause, 'render'));
  }
}

class TableChartPreviewManager {
  private readonly previews = new Map<HTMLElement, TableChartPreview>();
  private destroyed = false;

  constructor(private readonly config: CherryWysiwygConfig) {}

  sync(view: EditorView, initial = false) {
    if (this.destroyed) return;
    const revisions = previewKey.getState(view.state) ?? new Map<number, TableChartRevision>();
    const mounted = new Set<HTMLElement>();
    view.dom.querySelectorAll<HTMLElement>(widgetSelector).forEach((dom) => {
      const position = Number(dom.dataset.cherryMilkdownTableChartPosition);
      const revision = revisions.get(position);
      if (!revision) return;
      mounted.add(dom);
      let preview = this.previews.get(dom);
      if (!preview) {
        preview = new TableChartPreview(dom, this.config);
        this.previews.set(dom, preview);
      }
      preview.update(revision, initial);
    });
    this.previews.forEach((preview, dom) => {
      if (mounted.has(dom)) return;
      preview.destroy();
      this.previews.delete(dom);
    });
  }

  destroy() {
    this.destroyed = true;
    this.previews.forEach((preview) => preview.destroy());
    this.previews.clear();
  }
}

export const cherryTableChartPreview = $prose((ctx) => {
  const config = ctx.get(cherryWysiwygConfigCtx.key);
  return new Plugin({
    key: previewKey,
    state: {
      init: (_, state) => tableChartRevisions(state.doc),
      apply: (transaction, previous, oldState, state) => {
        if (!transaction.docChanged && !transaction.selectionSet && !transaction.getMeta(previewKey)) {
          return previous;
        }
        const revisions = tableChartRevisions(state.doc);
        // A descriptor is temporarily incomplete during ordinary typing. Keep
        // its last valid preview only while editing that same header cell.
        // Blur, another cell, deletion or an authoritative external write ends
        // the draft; no stale chart is retained for an ordinary table.
        if (transaction.getMeta(previewKey) || transaction.getMeta(EXTERNAL_MARKDOWN_UPDATE)) return revisions;
        previous.forEach((revision, position) => {
          const mapped = transaction.mapping.mapResult(position);
          if (
            !mapped.deleted &&
            !revisions.has(mapped.pos) &&
            insideDescriptor(oldState.doc, oldState.selection, position) &&
            insideDescriptor(state.doc, state.selection, mapped.pos)
          ) {
            revisions.set(mapped.pos, { ...revision, position: mapped.pos });
          }
        });
        return revisions;
      },
    },
    props: {
      handleDOMEvents: {
        blur: (view) => {
          view.dispatch(view.state.tr.setMeta(previewKey, true).setMeta('addToHistory', false));
          return false;
        },
      },
      decorations: (state) => {
        if (!config.renderers?.tableChart) return DecorationSet.empty;
        const decorations: Decoration[] = [];
        previewKey.getState(state)?.forEach((revision) => {
          decorations.push(
            Decoration.widget(
              revision.position,
              () => {
                const dom = document.createElement('figure');
                dom.className = 'cherry-table-chart cherry-table-chart--derived';
                dom.dataset.cherryMilkdownTableChartWidget = '';
                dom.dataset.cherryMilkdownTableChartPosition = String(revision.position);
                dom.contentEditable = 'false';
                return dom;
              },
              { key: `cherry-table-chart:${revision.position}`, side: -1 },
            ),
          );
        });
        return DecorationSet.create(state.doc, decorations);
      },
    },
    view: (view) => {
      const manager = new TableChartPreviewManager(config);
      let frame = 0;
      const schedule = (nextView: EditorView, initial = false) => {
        if (frame) cancelAnimationFrame(frame);
        queueMicrotask(() => manager.sync(nextView, initial));
        // Milkdown's table-block NodeView mounts its Vue contentDOM after the
        // ProseMirror transaction. Synchronize after that mount boundary so
        // setMarkdown() cannot leave a freshly replaced table without its
        // derived chart widget.
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            frame = 0;
            manager.sync(nextView, initial);
          });
        });
      };
      schedule(view, true);
      return {
        update: (nextView, previousState) => {
          if (previewKey.getState(previousState) === previewKey.getState(nextView.state)) return;
          schedule(nextView);
        },
        destroy: () => {
          if (frame) cancelAnimationFrame(frame);
          manager.destroy();
        },
      };
    },
  });
});
