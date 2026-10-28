import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { NodeSelection, type Transaction } from '@milkdown/kit/prose/state';
import type { EditorView, NodeView, ViewMutationRecord } from '@milkdown/kit/prose/view';
import { $view } from '@milkdown/kit/utils';
import { cherryWysiwygConfigCtx } from '../config.js';
import { createEditableLabel, createNodeAction } from '../node-view-utils.js';
import { cherryCompoundItemSchema, cherryPanelSchema, cherryDetailSchema } from './node-schemas.js';

function compoundItemContentClass(role: string) {
  if (role === 'detail-item') return ' cherry-detail-body';
  if (role === 'tab') return ' cherry-tabs-item__content';
  if (role === 'timeline-item') return ' cherry-timeline--desc';
  return '';
}

class CompoundItemView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  private node: ProseNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly label: HTMLInputElement;
  private readonly disclosure: HTMLButtonElement;
  private readonly header: HTMLElement;

  constructor(node: ProseNode, view: EditorView, getPos: () => number | undefined, readonly: boolean) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    const role = String(node.attrs.role);
    // Do not use a native <details>/<summary> pair here.  Browsers place
    // non-summary children outside the collapsed box, which makes the hidden
    // header overlap following ProseMirror nodes and steals pointer events.
    // The disclosure button below owns this small, predictable state instead.
    this.dom = document.createElement('section');
    this.dom.className = 'cherry-compound-item';
    if (role === 'column') this.dom.classList.add('cherry-panel--col');
    this.dom.dataset.role = role;
    if (role === 'detail-item') this.dom.classList.add('cherry-compound-item--detail');
    this.dom.dataset.open = String(Boolean(node.attrs.open));
    // A native <summary> toggles the whole <details> element for every click,
    // including text selection.  Use a regular header and keep disclosure as
    // an explicit control so the title remains directly editable.
    const header = document.createElement('header');
    this.header = header;
    header.className = 'cherry-compound-item__header';
    this.disclosure = createNodeAction(
      node.attrs.open ? '⌄' : '›',
      '切换默认展开状态',
      () => {
        this.updateAttrs({ open: !this.node.attrs.open });
      },
      readonly,
    );
    this.disclosure.className = 'cherry-compound-item__disclosure';
    this.disclosure.setAttribute('aria-expanded', String(Boolean(node.attrs.open)));
    this.disclosure.hidden = node.attrs.role !== 'detail-item';
    this.label = createEditableLabel(
      'cherry-compound-item__label',
      String(node.attrs.label ?? ''),
      node.attrs.role === 'column' ? '' : '直接输入标题',
      readonly,
      () => this.updateAttrs({ label: this.label.value }),
    );
    this.label.hidden = node.attrs.role === 'column';
    const actions = document.createElement('span');
    actions.className = 'cherry-node-actions';
    actions.append(
      createNodeAction('←', '向前移动', () => this.move(-1), readonly),
      createNodeAction('→', '向后移动', () => this.move(1), readonly),
      createNodeAction('×', '删除项目', this.remove, readonly),
    );
    header.append(this.disclosure, this.label, actions);
    header.addEventListener('click', this.selectItemFromHeader);
    this.contentDOM = document.createElement('div');
    this.contentDOM.className = `cherry-compound-item__content${compoundItemContentClass(role)}`;
    if (role === 'tab') this.dom.classList.add('cherry-tabs-item');
    if (role === 'timeline-item') this.dom.classList.add('cherry-timeline--item');
    this.dom.append(header, this.contentDOM);
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type || node.attrs.role !== this.node.attrs.role) return false;
    this.node = node;
    if (document.activeElement !== this.label) this.label.value = String(node.attrs.label ?? '');
    this.dom.dataset.role = String(node.attrs.role);
    this.disclosure.textContent = node.attrs.open ? '⌄' : '›';
    this.disclosure.setAttribute('aria-expanded', String(Boolean(node.attrs.open)));
    this.dom.dataset.open = String(Boolean(node.attrs.open));
    return true;
  }

  selectNode() {
    this.dom.classList.add('is-selected');
  }

  deselectNode() {
    this.dom.classList.remove('is-selected');
  }

  stopEvent(event: Event) {
    const target = event.target as HTMLElement;
    return this.label.contains(target) || Boolean(target.closest('button'));
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    return this.label.contains(mutation.target);
  }

  destroy() {
    this.header.removeEventListener('click', this.selectItemFromHeader);
  }

  private readonly selectItemFromHeader = (event: MouseEvent) => {
    // Wait for a completed click before selecting the whole item. Selecting on
    // mousedown steals drag-selection gestures that begin in the header.
    if (event.target !== event.currentTarget) return;
    const pos = this.getPos();
    if (typeof pos !== 'number') return;
    event.preventDefault();
    this.view.dispatch(this.view.state.tr.setSelection(NodeSelection.create(this.view.state.doc, pos)));
    this.view.focus();
  };

  private updateAttrs(attrs: Record<string, unknown>) {
    const pos = this.resolvePos();
    if (typeof pos === 'number') {
      const transaction = this.view.state.tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        ...attrs,
        source: '',
      });
      this.clearParentSource(transaction, pos);
      this.view.dispatch(transaction);
    }
  }

  private remove = () => {
    const pos = this.resolvePos();
    if (typeof pos !== 'number') return;
    const transaction = this.view.state.tr.delete(pos, pos + this.node.nodeSize);
    this.clearParentSource(transaction, pos);
    this.view.dispatch(transaction);
  };

  private clearParentSource(transaction: Transaction, position: number) {
    try {
      const resolved = this.view.state.doc.resolve(position);
      const parentPosition = resolved.before(resolved.depth);
      const parent = transaction.doc.nodeAt(parentPosition);
      if (parent && (parent.type.name === 'cherry_panel' || parent.type.name === 'cherry_detail')) {
        transaction.setNodeMarkup(parentPosition, undefined, { ...parent.attrs, source: '' });
      }
    } catch {
      // The parent may be mapped away while deleting the final child. The
      // transaction still contains the requested local edit in that case.
    }
  }

  private resolvePos() {
    try {
      const direct = this.getPos();
      if (typeof direct === 'number') return direct;
    } catch {
      // Fall through while ProseMirror is mapping a transaction.
    }
    try {
      const mapped = this.view.posAtDOM(this.dom, 0);
      for (const candidate of [mapped, mapped - 1]) {
        if (candidate >= 0 && this.view.state.doc.nodeAt(candidate)?.type === this.node.type) return candidate;
      }
    } catch {
      // The DOM can be detached briefly during an external Markdown update.
    }
    return undefined;
  }

  private move(direction: -1 | 1) {
    const pos = this.resolvePos();
    if (typeof pos !== 'number') return;
    const resolved = this.view.state.doc.resolve(pos);
    const { parent } = resolved;
    const index = resolved.index();
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= parent.childCount) return;
    const target = parent.child(targetIndex);
    const targetPos = direction < 0 ? pos - target.nodeSize : pos + this.node.nodeSize + target.nodeSize;
    const transaction = this.view.state.tr.delete(pos, pos + this.node.nodeSize);
    transaction.insert(direction < 0 ? targetPos : targetPos - this.node.nodeSize, this.node);
    const parentPosition = resolved.before(resolved.depth);
    const parentNode = transaction.doc.nodeAt(parentPosition);
    if (parentNode && (parentNode.type.name === 'cherry_panel' || parentNode.type.name === 'cherry_detail')) {
      transaction.setNodeMarkup(parentPosition, undefined, { ...parentNode.attrs, source: '' });
    }
    this.view.dispatch(transaction);
  }
}

const PANEL_KINDS = ['panel', 'primary', 'info', 'warning', 'danger', 'success'];

function compoundNativeClass(node: ProseNode, kind: string, isPanel: boolean) {
  if (node.type.name === 'cherry_detail') return 'cherry-detail';
  if (isPanel) return `cherry-panel cherry-panel__${kind === 'panel' ? 'primary' : kind}`;
  if (kind === 'tabs') return 'cherry-tabs';
  if (kind === 'timeline') return 'cherry-timeline cherry-timeline__vertical';
  return '';
}

class CompoundView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  private node: ProseNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly title: HTMLInputElement;
  private readonly kind: HTMLButtonElement;
  private readonly add: HTMLButtonElement;

  constructor(
    node: ProseNode,
    view: EditorView,
    getPos: () => number | undefined,
    private readonly readonly: boolean,
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = document.createElement('section');
    this.dom.dataset.cherryCompound = node.type.name;
    const header = document.createElement('header');
    header.className = 'cherry-compound__header';
    this.kind = createNodeAction(String(node.attrs.kind), '切换块类型', this.cycleKind, readonly);
    this.kind.className = 'cherry-compound__kind';
    this.title = createEditableLabel(
      'cherry-compound__title',
      String(node.attrs.title ?? ''),
      '直接输入标题',
      readonly,
      this.updateTitle,
    );
    this.title.hidden = node.type.name === 'cherry_detail';
    const actions = document.createElement('span');
    actions.className = 'cherry-node-actions';
    this.add = createNodeAction('＋', '增加项目', this.addItem, readonly);
    actions.append(this.kind, this.add);
    header.append(this.title, actions);
    this.contentDOM = document.createElement('div');
    this.contentDOM.className = 'cherry-compound__content';
    this.dom.append(header, this.contentDOM);
    this.sync(node);
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.sync(node);
    return true;
  }

  selectNode() {
    this.dom.classList.add('is-selected');
  }

  deselectNode() {
    this.dom.classList.remove('is-selected');
  }

  stopEvent(event: Event) {
    const target = event.target as HTMLElement;
    return (
      this.title.contains(target) ||
      Boolean(target.closest('button')) ||
      Boolean(target.closest('input[data-placeholder]'))
    );
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    return this.title.contains(mutation.target);
  }

  private sync(node: ProseNode) {
    const kind = node.type.name === 'cherry_detail' ? 'detail' : String(node.attrs.kind);
    const isPanel = node.type.name !== 'cherry_detail' && /^(panel|primary|info|warning|danger|success)$/.test(kind);
    const cherryClass = compoundNativeClass(node, kind, isPanel);
    this.dom.className = `cherry-compound cherry-compound--${kind} ${cherryClass}`.trim();
    const header = this.title.parentElement;
    if (header) {
      header.className = `cherry-compound__header${isPanel ? ' cherry-panel--title' : ''}${
        isPanel && node.attrs.title ? ' cherry-panel--title__not-empty' : ''
      }`;
    }
    this.contentDOM.className = `cherry-compound__content${isPanel ? ' cherry-panel--body' : ''}`;
    if (kind === 'cols') {
      this.contentDOM.classList.add('cherry-panel-cols', 'cherry-panel-cols__cols');
      this.contentDOM.style.setProperty('--cols', String(node.childCount));
    } else {
      this.contentDOM.style.removeProperty('--cols');
    }
    this.title.hidden = node.type.name === 'cherry_detail' || kind === 'cols';
    this.kind.hidden = node.type.name === 'cherry_detail';
    this.kind.textContent = kind;
    this.add.hidden =
      this.readonly ||
      (node.type.name !== 'cherry_detail' && !['cols', 'tabs', 'timeline'].includes(String(node.attrs.kind)));
    if (document.activeElement !== this.title) this.title.value = String(node.attrs.title ?? '');
  }

  private setAttrs(attrs: Record<string, unknown>) {
    const pos = this.getPos();
    if (typeof pos === 'number') {
      this.view.dispatch(
        this.view.state.tr.setNodeMarkup(pos, undefined, { ...this.node.attrs, ...attrs, source: '' }),
      );
    }
  }

  private updateTitle = () => this.setAttrs({ title: this.title.value });

  private cycleKind = () => {
    if (this.node.type.name === 'cherry_detail') return;
    const current = PANEL_KINDS.indexOf(String(this.node.attrs.kind));
    if (current < 0) return;
    const kind = PANEL_KINDS[(current + 1) % PANEL_KINDS.length] ?? 'panel';
    this.setAttrs({ kind, rawType: kind });
  };

  private addItem = () => {
    const kind = String(this.node.attrs.kind);
    if (this.node.type.name !== 'cherry_detail' && !['cols', 'tabs', 'timeline'].includes(kind)) return;
    const pos = this.getPos();
    if (typeof pos !== 'number') return;
    const itemType = this.view.state.schema.nodes.cherry_compound_item;
    const { paragraph } = this.view.state.schema.nodes;
    if (!itemType || !paragraph) return;
    let role = 'timeline-item';
    if (this.node.type.name === 'cherry_detail') role = 'detail-item';
    else if (kind === 'cols') role = 'column';
    else if (kind === 'tabs') role = 'tab';
    const item = itemType.create({ role, label: '', open: false }, paragraph.create());
    this.view.dispatch(this.view.state.tr.insert(pos + this.node.nodeSize - 1, item).scrollIntoView());
  };
}

export const cherryCompoundItemView = $view(
  cherryCompoundItemSchema.node,
  (ctx) => (node, view, getPos) =>
    new CompoundItemView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key).readonly),
);
export const cherryPanelView = $view(
  cherryPanelSchema.node,
  (ctx) => (node, view, getPos) => new CompoundView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key).readonly),
);
export const cherryDetailView = $view(
  cherryDetailSchema.node,
  (ctx) => (node, view, getPos) => new CompoundView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key).readonly),
);
