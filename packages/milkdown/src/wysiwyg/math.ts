import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { InputRule } from '@milkdown/kit/prose/inputrules';
import { TextSelection } from '@milkdown/kit/prose/state';
import type { EditorView, NodeView } from '@milkdown/kit/prose/view';
import type { NodeSchema } from '@milkdown/kit/transformer';
import { $inputRule, $nodeSchema, $remark, $view } from '@milkdown/kit/utils';
import remarkMath from 'remark-math';
import { cherryWysiwygConfigCtx } from './config.js';

type Mathfield = HTMLElement & {
  value: string;
  readOnly: boolean;
  macros?: Record<string, string>;
  virtualKeyboardMode?: string;
  setValue?: (value: string, options?: { silenceNotifications?: boolean }) => void;
};

let mathliveReady: Promise<unknown> | undefined;

function loadMathlive() {
  mathliveReady ??= import('mathlive');
  return mathliveReady;
}

function mathAttrs(node: ProseNode) {
  return { value: String(node.attrs.value ?? node.textContent ?? ''), source: String(node.attrs.source ?? '') };
}

function mathSchemaSpec(inline: boolean): NodeSchema {
  const markdownType = inline ? 'inlineMath' : 'math';
  const tag = inline ? 'span' : 'div';
  return {
    group: inline ? 'inline' : 'block',
    inline,
    atom: true,
    selectable: true,
    defining: !inline,
    isolating: !inline,
    attrs: {
      value: { default: '', validate: 'string' as const },
      source: { default: '', validate: 'string' as const },
    },
    parseDOM: [
      {
        tag: `${tag}[data-cherry-math]`,
        getAttrs: (dom: HTMLElement) => ({ value: dom.dataset.value ?? '', source: dom.dataset.source ?? '' }),
      },
    ],
    toDOM: (node: ProseNode) => [
      tag,
      {
        'data-cherry-math': inline ? 'inline' : 'block',
        'data-value': String(node.attrs.value ?? ''),
        'data-source': String(node.attrs.source ?? ''),
      },
    ],
    parseMarkdown: {
      match: (node: { type?: string }) => node.type === markdownType,
      runner: (state, node, type) =>
        state.addNode(type, { value: String(node.value ?? ''), source: String(node.source ?? '') }),
    },
    toMarkdown: {
      match: (node: ProseNode) => node.type.name === (inline ? 'cherry_math_inline' : 'cherry_math_block'),
      runner: (state, node) => {
        const attrs = mathAttrs(node);
        state.addNode(markdownType, undefined, attrs.value);
      },
    },
  };
}

export const cherryMathInlineSchema = $nodeSchema('cherry_math_inline', () => mathSchemaSpec(true));
export const cherryMathBlockSchema = $nodeSchema('cherry_math_block', () => mathSchemaSpec(false));
export const cherryRemarkMath = $remark('cherryRemarkMath', () => remarkMath);

class MathNodeView implements NodeView {
  dom: HTMLElement;
  private node: ProseNode;
  private readonly field: Mathfield;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly reportError?: (error: unknown) => void;
  private visibilityObserver?: IntersectionObserver;
  private activated = false;
  private composing = false;

  constructor(
    node: ProseNode,
    view: EditorView,
    getPos: () => number | undefined,
    readonly: boolean,
    options?: {
      macros?: Record<string, string>;
      virtualKeyboardMode?: 'auto' | 'manual' | 'onfocus' | 'off';
    },
    reportError?: (error: unknown) => void,
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.reportError = reportError;
    this.dom = document.createElement(node.type.name === 'cherry_math_inline' ? 'span' : 'div');
    this.dom.className = `cherry-math cherry-math--${node.isInline ? 'inline' : 'block'}`;
    this.dom.dataset.cherryMath = node.isInline ? 'inline' : 'block';
    this.field = document.createElement('math-field') as Mathfield;
    this.field.className = 'cherry-math__field';
    this.field.textContent = String(node.attrs.value ?? '');
    this.field.readOnly = readonly;
    if (options?.macros) this.field.macros = options.macros;
    if (options?.virtualKeyboardMode) this.field.virtualKeyboardMode = options.virtualKeyboardMode;
    this.field.setAttribute('aria-label', node.isInline ? 'Inline formula' : 'Block formula');
    this.field.addEventListener('input', this.onInput);
    this.field.addEventListener('compositionstart', this.onCompositionStart);
    this.field.addEventListener('compositionend', this.onCompositionEnd);
    this.field.addEventListener('keydown', this.onKeyDown);
    this.field.addEventListener('focusin', this.activate);
    this.field.addEventListener('pointerdown', this.activate);
    this.dom.append(this.field);
    if (typeof IntersectionObserver === 'undefined') {
      this.activate();
    } else {
      this.visibilityObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) this.activate();
        },
        { rootMargin: '300px 0px' },
      );
      this.visibilityObserver.observe(this.dom);
    }
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.setFieldValue(String(node.attrs.value ?? ''));
    return true;
  }

  selectNode() {
    this.dom.classList.add('is-selected');
  }

  deselectNode() {
    this.dom.classList.remove('is-selected');
  }

  stopEvent(event: Event) {
    return this.dom.contains(event.target as Node);
  }

  ignoreMutation() {
    return true;
  }

  destroy() {
    this.visibilityObserver?.disconnect();
    this.field.removeEventListener('input', this.onInput);
    this.field.removeEventListener('compositionstart', this.onCompositionStart);
    this.field.removeEventListener('compositionend', this.onCompositionEnd);
    this.field.removeEventListener('keydown', this.onKeyDown);
    this.field.removeEventListener('focusin', this.activate);
    this.field.removeEventListener('pointerdown', this.activate);
  }

  private setFieldValue(value: string, force = false) {
    if (!this.field.setValue) {
      this.field.textContent = value;
      return;
    }
    if (!force && this.field.value === value) return;
    this.field.setValue(value, { silenceNotifications: true });
  }

  private commit() {
    const pos = this.getPos();
    if (typeof pos !== 'number') return;
    const { value } = this.field;
    if (value === this.node.attrs.value) return;
    this.view.dispatch(this.view.state.tr.setNodeMarkup(pos, undefined, { value, source: '' }));
  }

  private onInput = () => {
    if (!this.composing) this.commit();
  };

  private onCompositionStart = () => {
    this.composing = true;
  };

  private activate = () => {
    if (this.activated) return;
    this.activated = true;
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = undefined;
    void loadMathlive()
      .then(() => this.setFieldValue(String(this.node.attrs.value ?? ''), true))
      .catch((error: unknown) => this.reportError?.(error));
  };

  private onCompositionEnd = () => {
    this.composing = false;
    this.commit();
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.view.focus();
      return;
    }
    if (event.key === 'Enter' && this.node.isInline) {
      event.preventDefault();
      const pos = this.getPos();
      if (typeof pos === 'number') {
        this.view.dispatch(
          this.view.state.tr.setSelection(TextSelection.near(this.view.state.doc.resolve(pos + this.node.nodeSize))),
        );
      }
      this.view.focus();
    }
  };
}

export const cherryMathInlineView = $view(cherryMathInlineSchema.node, (ctx) => (node, view, getPos) => {
  const config = ctx.get(cherryWysiwygConfigCtx.key);
  return new MathNodeView(node, view, getPos, config.readonly, config.mathlive, (error) =>
    config.onError?.(error, 'render'),
  );
});

export const cherryMathBlockView = $view(cherryMathBlockSchema.node, (ctx) => (node, view, getPos) => {
  const config = ctx.get(cherryWysiwygConfigCtx.key);
  return new MathNodeView(node, view, getPos, config.readonly, config.mathlive, (error) =>
    config.onError?.(error, 'render'),
  );
});

export const cherryMathInlineInputRule = $inputRule(
  (ctx) =>
    new InputRule(/\$([^$\n]+)\$$/, (state, match, start, end) => {
      const value = match[1] ?? '';
      return state.tr.replaceWith(start, end, cherryMathInlineSchema.type(ctx).create({ value, source: match[0] }));
    }),
);

export const cherryMathBlockInputRule = $inputRule(
  (ctx) =>
    new InputRule(/^\$\$\s$/, (state, _match, start, end) => {
      const resolved = state.doc.resolve(start);
      const type = cherryMathBlockSchema.type(ctx);
      if (!resolved.node(-1).canReplaceWith(resolved.index(-1), resolved.indexAfter(-1), type)) return null;
      return state.tr.delete(start, end).setBlockType(start, start, type, { value: '', source: '' });
    }),
);

export const cherryMath = [
  ...cherryRemarkMath,
  cherryMathInlineSchema,
  cherryMathBlockSchema,
  cherryMathInlineView,
  cherryMathBlockView,
  cherryMathInlineInputRule,
  cherryMathBlockInputRule,
];
