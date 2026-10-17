import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { NodeSelection, TextSelection } from '@milkdown/kit/prose/state';
import type { EditorView, NodeView } from '@milkdown/kit/prose/view';
import { $view } from '@milkdown/kit/utils';
import { cherryWysiwygConfigCtx, type CherryWysiwygConfig } from '../config.js';
import { destroyCherryRenderedContent, MERMAID_ALIGNMENT_CLASSES, renderMermaid } from '../diagram-runtime.js';
import { readMermaidLayout } from '../../native-layout.js';
import { sanitizedEngineFragment } from '../html-sanitizer.js';
import { createNodeAction, readEditableSource, selectEditableSource } from '../node-view-utils.js';
import { readTableChartDescriptor, tableChartDescriptorSource } from '../table-chart-render-engine.js';
import { reportRendererError } from '../renderer-cleanup.js';
import { createRenderLifecycle, type RenderRevision } from '../render-lifecycle.js';
import { CHERRY_THEME_CHANGE } from '../theme.js';
import {
  cherryDiagramSchema,
  cherryHtmlBlockSchema,
  cherryNativeBlockSchema,
  cherryHtmlInlineSchema,
  cherryEmojiSchema,
} from './node-schemas.js';

class EmbedView implements NodeView {
  dom: HTMLElement;
  private node: ProseNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private preview: HTMLElement;
  private readonly controls: HTMLElement;
  private readonly sourcePanel: HTMLElement;
  private readonly source: HTMLElement;
  private timer?: ReturnType<typeof setTimeout>;
  private readonly rendering;
  private visibilityObserver?: IntersectionObserver;
  private renderActivated = false;
  private destroyed = false;
  private sourceOpen = false;
  private sourceEditing = false;
  private applyingSourceTransaction = false;
  private sourceToggle?: HTMLButtonElement;

  constructor(
    node: ProseNode,
    view: EditorView,
    getPos: () => number | undefined,
    private readonly config: CherryWysiwygConfig,
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.rendering = createRenderLifecycle((error) => config.onError?.(error, 'render'));
    this.dom = document.createElement(node.isInline ? 'span' : 'figure');
    this.dom.className = `cherry-embed cherry-embed--${node.type.name}`;
    this.syncDiagramPresentation();
    this.preview = document.createElement(node.isInline ? 'span' : 'div');
    this.preview.className = 'cherry-embed__preview';
    this.controls = document.createElement(node.isInline ? 'span' : 'figcaption');
    this.controls.className = 'cherry-embed__controls';
    this.controls.hidden = node.type.name === 'cherry_emoji';
    const nativeBlock = node.type.name === 'cherry_native_block';
    const edit = createNodeAction(
      nativeBlock ? '编辑区块' : '源码',
      nativeBlock ? '编辑整个区块源码' : '在节点内编辑源码',
      this.toggleSource,
      config.readonly,
    );
    this.sourceToggle = edit;
    edit.setAttribute('aria-expanded', 'false');
    this.controls.append(edit);
    this.sourcePanel = document.createElement(node.isInline ? 'span' : 'pre');
    this.sourcePanel.className = 'cherry-embed__source';
    this.sourcePanel.hidden = true;
    this.source = document.createElement('code');
    this.source.contentEditable = String(!config.readonly);
    this.source.spellcheck = false;
    this.source.addEventListener('input', this.updateSource);
    this.source.addEventListener('blur', this.handleSourceBlur);
    this.source.addEventListener('keydown', selectEditableSource);
    this.sourcePanel.append(this.source);
    this.dom.append(this.preview, this.controls, this.sourcePanel);
    this.scheduleRender();
    this.syncSource();
    this.view.dom.addEventListener(CHERRY_THEME_CHANGE, this.handleThemeChange);
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    const contentChanged =
      node.type.name === 'cherry_diagram'
        ? node.attrs.value !== this.node.attrs.value || node.attrs.diagramType !== this.node.attrs.diagramType
        : node.attrs.source !== this.node.attrs.source;
    this.node = node;
    this.syncDiagramPresentation();
    this.syncSource();
    if (
      contentChanged &&
      (this.renderActivated || node.type.name !== 'cherry_diagram') &&
      document.activeElement !== this.source
    ) {
      this.render();
    }
    return true;
  }

  selectNode() {
    this.dom.classList.add('is-selected');
  }

  deselectNode() {
    this.dom.classList.remove('is-selected');
    // NodeSelection changes are not an explicit request to close the source
    // editor.  A transaction from a sibling Detail/Panel (or a source input)
    // can briefly deselect this NodeView while the same editor is still open.
    // Closing here races with ProseMirror's update and makes the source appear
    // to disappear at random.
  }

  stopEvent(event: Event) {
    return (
      // Cherry-native compound blocks own their rendered DOM. Keep pointer
      // selection and tab/panel controls in that layer instead of letting
      // ProseMirror turn the first drag into a NodeSelection.
      (this.node.type.name === 'cherry_native_block' && this.preview.contains(event.target as Node)) ||
      this.sourcePanel.contains(event.target as Node) ||
      Boolean((event.target as HTMLElement).closest('.cherry-embed__controls'))
    );
  }

  ignoreMutation() {
    return true;
  }

  destroy() {
    this.destroyed = true;
    this.view.dom.removeEventListener(CHERRY_THEME_CHANGE, this.handleThemeChange);
    this.rendering.destroy();
    this.closeSourceListener();
    this.visibilityObserver?.disconnect();
    this.dom.removeEventListener('pointerdown', this.activateRender);
    this.source.removeEventListener('input', this.updateSource);
    this.source.removeEventListener('blur', this.handleSourceBlur);
    this.source.removeEventListener('keydown', selectEditableSource);
    if (this.timer) clearTimeout(this.timer);
    destroyCherryRenderedContent(this.config.engine, this.preview);
  }

  private scheduleRender() {
    if (this.node.type.name !== 'cherry_diagram' || typeof IntersectionObserver === 'undefined') {
      this.activateRender();
      return;
    }
    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) this.activateRender();
      },
      { rootMargin: '500px 0px' },
    );
    this.visibilityObserver.observe(this.dom);
    this.dom.addEventListener('pointerdown', this.activateRender, { once: true });
  }

  private activateRender = () => {
    if (this.destroyed || this.renderActivated) return;
    this.renderActivated = true;
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = undefined;
    this.dom.removeEventListener('pointerdown', this.activateRender);
    this.render();
  };

  private syncSource() {
    if (document.activeElement === this.source) return;
    this.source.textContent =
      this.node.type.name === 'cherry_diagram'
        ? String(this.node.attrs.value ?? '')
        : String(this.node.attrs.source ?? '');
  }

  private toggleSource = () => {
    const open = !this.sourceOpen;
    this.setSourceOpen(open, true);
    if (!open) this.releaseNodeSelection();
  };

  private releaseNodeSelection() {
    const pos = this.getPos();
    if (typeof pos !== 'number' || !(this.view.state.selection instanceof NodeSelection)) return;
    if (this.view.state.selection.from !== pos) return;
    const after = Math.min(pos + this.node.nodeSize, this.view.state.doc.content.size);
    this.view.dispatch(this.view.state.tr.setSelection(TextSelection.near(this.view.state.doc.resolve(after), 1)));
    this.view.focus();
  }

  private setSourceOpen(open: boolean, focus = false) {
    this.sourceOpen = open;
    this.sourceEditing = open;
    this.sourcePanel.hidden = !open;
    this.dom.classList.toggle('is-source-open', open);
    this.sourceToggle?.classList.toggle('is-active', open);
    this.sourceToggle?.setAttribute('aria-expanded', String(open));
    if (open) {
      document.addEventListener('pointerdown', this.closeSourceOnOutsidePointer, true);
      if (focus) this.source.focus({ preventScroll: true });
    } else {
      this.closeSourceListener();
    }
  }

  private closeSourceOnOutsidePointer = (event: PointerEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (this.dom.contains(event.target as Node)) return;
    // Disclosure and node-action buttons are editor controls. Their
    // mousedown intentionally does not take focus, but the pointer still
    // bubbles through document capture. Do not interpret expanding a sibling
    // Detail/Panel as an explicit request to close this source editor.
    if (target?.closest('.cherry-compound-item__disclosure, .cherry-compound__kind, .cherry-node-actions')) {
      return;
    }
    this.setSourceOpen(false);
  };

  private closeSourceListener() {
    document.removeEventListener('pointerdown', this.closeSourceOnOutsidePointer, true);
  }

  private syncDiagramPresentation() {
    this.dom.classList.remove(...MERMAID_ALIGNMENT_CLASSES);
    this.dom.style.removeProperty('width');
    this.dom.style.removeProperty('height');
    if (this.node.type.name !== 'cherry_diagram' || this.node.attrs.diagramType !== 'mermaid') {
      this.dom.removeAttribute('data-type');
      return;
    }
    this.dom.dataset.type = 'mermaid';
    const layout = readMermaidLayout(String(this.node.attrs.source ?? ''));
    if (layout.width) this.dom.style.width = layout.width;
    if (layout.height) this.dom.style.height = layout.height;
    if (layout.alignment) this.dom.classList.add(`cherry-mermaid-align-${layout.alignment}`);
  }

  private handleThemeChange = () => {
    if (this.node.type.name === 'cherry_diagram' && this.node.attrs.diagramType === 'mermaid' && this.renderActivated) {
      this.render();
    }
  };

  private updateSource = () => {
    const pos = this.getPos();
    if (typeof pos !== 'number') return;
    const value = readEditableSource(this.source);
    const attrs = { ...this.node.attrs };
    if (this.node.type.name === 'cherry_diagram') {
      attrs.value = value;
      const lines = String(attrs.source).split(/\r?\n/);
      attrs.source = `${lines[0]}\n${value}\n${lines.at(-1)}`;
    } else attrs.source = value;
    this.applyingSourceTransaction = true;
    this.view.dispatch(this.view.state.tr.setNodeMarkup(pos, undefined, attrs));
    this.applyingSourceTransaction = false;
    // Updating an atom's attributes can make the browser blur a contenteditable
    // inside its NodeView even though the user is still typing there. Restore
    // that same editing owner without changing the document selection.
    if (this.sourceEditing && document.activeElement !== this.source) {
      this.source.focus({ preventScroll: true });
    }
    queueMicrotask(() => {
      if (!this.destroyed && this.sourceEditing && document.activeElement !== this.source) {
        this.source.focus({ preventScroll: true });
      }
    });
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      if (this.renderActivated || this.node.type.name !== 'cherry_diagram') this.render();
    }, this.config.debounce);
  };

  private flushSourceRender = () => {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    if (this.renderActivated || this.node.type.name !== 'cherry_diagram') this.render();
  };

  private handleSourceBlur = () => {
    // Blur is not a close command.  ProseMirror and browser controls can move
    // focus briefly while applying a transaction; the explicit outside
    // pointer listener is the only path that closes the source panel.
    if (this.applyingSourceTransaction) return;
    this.sourceEditing = false;
    this.flushSourceRender();
  };

  private render() {
    const revision = this.rendering.begin();
    if (this.node.type.name === 'cherry_emoji') {
      revision.commit(() => {
        try {
          this.preview.innerHTML = this.config.engine.makeHtml(String(this.node.attrs.source));
        } catch {
          this.preview.textContent = String(this.node.attrs.source);
        }
      }, false);
      return;
    }
    if (this.node.type.name.startsWith('cherry_html')) {
      revision.commit(() => {
        try {
          destroyCherryRenderedContent(this.config.engine, this.preview);
          const html = this.config.engine.makeHtml(String(this.node.attrs.source));
          this.preview.replaceChildren(
            sanitizedEngineFragment(html, this.node.isInline, this.node.type.name.startsWith('cherry_html')),
          );
        } catch {
          this.preview.textContent = String(this.node.attrs.source);
        }
      }, false);
      return;
    }
    if (this.node.type.name === 'cherry_native_block') {
      this.renderNativeBlock(revision);
      return;
    }
    const diagramType = String(this.node.attrs.diagramType);
    const renderer =
      this.config.renderers?.[diagramType] ??
      (diagramType === 'mermaid'
        ? ({ source, signal, container }: { source: string; signal?: AbortSignal; container: HTMLElement }) =>
            renderMermaid(source, signal, container)
        : undefined);
    if (!renderer) {
      revision.commit(() => {
        this.preview.textContent = `${diagramType} · 请配置 renderers.${diagramType}`;
      }, false);
      return;
    }
    const container = this.preview.cloneNode(false) as HTMLElement;
    delete container.dataset.renderError;
    container.removeAttribute('role');
    const staging = this.createStaging(container);
    revision.addCleanup(() => staging.remove());
    const source = String(this.node.attrs.value);
    void revision.settle(
      Promise.resolve().then(() => {
        if (!revision.current()) return;
        this.mountStaging(staging);
        return renderer({
          container,
          engine: this.config.engine,
          syntax: diagramType,
          source,
          signal: revision.signal,
        });
      }),
      {
        prepare: (result) => {
          if (typeof result === 'string') container.replaceChildren(sanitizedEngineFragment(result));
        },
        commit: () => {
          this.preview.replaceWith(container);
          this.preview = container;
          staging.remove();
        },
        retain: (result) => typeof result === 'function',
        failure: (error) => {
          this.preview.dataset.renderError = 'true';
          this.preview.querySelector('[role="alert"]')?.remove();
          const status = document.createElement('p');
          status.setAttribute('role', 'alert');
          status.textContent = '图表暂时无法渲染，请检查源码。';
          this.preview.append(status);
          reportRendererError(error, (cause) => this.config.onError?.(cause, 'render'));
        },
      },
    );
  }

  /** Stage outside flow in the same theme/width; never modify consumer container styles. */
  private createStaging(container: HTMLElement) {
    const staging = document.createElement('div');
    staging.dataset.renderPending = '';
    staging.setAttribute('aria-hidden', 'true');
    staging.append(container);
    return staging;
  }

  private mountStaging(staging: HTMLElement) {
    Object.assign(staging.style, {
      position: 'absolute',
      visibility: 'hidden',
      pointerEvents: 'none',
      top: '0',
      left: '0',
      width: `${this.preview.getBoundingClientRect().width}px`,
    });
    (this.dom.closest('.cherry-milkdown') ?? this.dom).append(staging);
  }

  private renderNativeBlock(revision: RenderRevision) {
    const renderer = this.config.renderers?.tableChart;
    const container = this.preview.cloneNode(false) as HTMLElement;
    try {
      const html = (this.config.nativeEngine ?? this.config.engine).makeHtml(String(this.node.attrs.source));
      container.replaceChildren(sanitizedEngineFragment(html));
    } catch {
      container.textContent = String(this.node.attrs.source);
    }
    const mounts = Array.from(container.querySelectorAll<HTMLElement>('[data-cherry-milkdown-table-chart]'));
    if (!renderer || mounts.length === 0) {
      revision.commit(() => {
        destroyCherryRenderedContent(this.config.engine, this.preview);
        this.preview.replaceWith(container);
        this.preview = container;
      }, false);
      return;
    }

    const staging = this.createStaging(container);
    this.mountStaging(staging);
    revision.addCleanup(() => staging.remove());
    const renders = mounts.map(async (mount) => {
      const descriptor = readTableChartDescriptor(mount);
      if (!descriptor) throw new TypeError('Invalid Cherry table-chart descriptor.');
      const result = await renderer({
        container: mount,
        engine: this.config.engine,
        source: tableChartDescriptorSource(descriptor),
        syntax: descriptor.type,
        signal: revision.signal,
      });
      if (typeof result === 'string' && !revision.signal.aborted) {
        mount.replaceChildren(sanitizedEngineFragment(result));
      }
      if (typeof result === 'function') revision.addCleanup(result);
    });
    void revision.settle(
      Promise.all(renders).then(() => undefined),
      {
        commit: () => {
          destroyCherryRenderedContent(this.config.engine, this.preview);
          this.preview.replaceWith(container);
          this.preview = container;
          staging.remove();
        },
        failure: (error) => {
          this.preview.dataset.renderError = 'true';
          reportRendererError(error, (cause) => this.config.onError?.(cause, 'render'));
        },
      },
    );
  }
}

function embedView(schema: typeof cherryDiagramSchema) {
  return $view(
    schema.node,
    (ctx) => (node, view, getPos) => new EmbedView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key)),
  );
}

export const cherryDiagramView = embedView(cherryDiagramSchema);
export const cherryHtmlBlockView = embedView(cherryHtmlBlockSchema);
export const cherryNativeBlockView = embedView(cherryNativeBlockSchema);
export const cherryHtmlInlineView = embedView(cherryHtmlInlineSchema);
export const cherryEmojiView = embedView(cherryEmojiSchema);
