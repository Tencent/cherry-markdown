import { copyToClip } from '../generated/cherry-helpers.js';
import { codeBlockSchema } from '@milkdown/kit/preset/commonmark';
import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { NodeSelection, Plugin, TextSelection } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import type { EditorView, NodeView, ViewMutationRecord } from '@milkdown/kit/prose/view';
import { $prose, $view } from '@milkdown/kit/utils';
import Prism from '../generated/cherry-prism.js';
import type { TokenEnvironment } from 'prismjs';

const CODE_LANGUAGES = [
  '',
  'javascript',
  'typescript',
  'html',
  'css',
  'markdown',
  'json',
  'shell',
  'bash',
  'python',
  'java',
  'c',
  'cpp',
  'csharp',
  'go',
  'rust',
  'sql',
  'yaml',
] as const;

type PrismToken = string | { alias?: string | string[]; content: PrismToken | PrismToken[]; type: string };

function languageName(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function prismTokens(source: string, language: string) {
  const name = Prism.languages[language] ? language : 'javascript';
  const environment: TokenEnvironment = { code: source, grammar: Prism.languages[name], language: name };
  if (!environment.grammar) return [];
  // Match Prism.highlight's public token hooks, including Cherry's template
  // and embedded-language components, while keeping ProseMirror decorations.
  Prism.hooks.run('before-tokenize', environment);
  environment.tokens = Prism.tokenize(environment.code, environment.grammar);
  Prism.hooks.run('after-tokenize', environment);
  return environment.tokens;
}

function tokenDecorations(token: PrismToken, position: number, decorations: Decoration[]): number {
  if (typeof token === 'string') return position + token.length;
  const from = position;
  const children = Array.isArray(token.content) ? token.content : [token.content];
  for (const child of children) position = tokenDecorations(child, position, decorations);
  if (position > from) {
    let aliases: string[] = [];
    if (Array.isArray(token.alias)) aliases = token.alias;
    else if (token.alias) aliases = [token.alias];
    decorations.push(Decoration.inline(from, position, { class: ['token', token.type, ...aliases].join(' ') }));
  }
  return position;
}

function buildHighlights(doc: ProseNode) {
  const decorations: Decoration[] = [];
  doc.descendants((node, position) => {
    if (node.type.name !== 'code_block' || !node.textContent) return;
    let cursor = position + 1;
    try {
      for (const token of prismTokens(node.textContent, languageName(node.attrs.language)))
        cursor = tokenDecorations(token, cursor, decorations);
    } catch {
      // Highlighting is progressive enhancement; editing and source fidelity
      // must keep working even when a custom Prism grammar fails.
    }
  });
  return DecorationSet.create(doc, decorations);
}

class CherryCodeBlockView implements NodeView {
  readonly dom: HTMLElement;
  readonly contentDOM: HTMLElement;
  private node: ProseNode;
  private readonly gutter: HTMLElement;
  private readonly language: HTMLSelectElement;
  private readonly copy: HTMLButtonElement;
  private readonly pre: HTMLPreElement;
  private disposed = false;
  private copyTimer?: ReturnType<typeof setTimeout>;

  constructor(
    node: ProseNode,
    private readonly view: EditorView,
    private readonly getPos: () => number | undefined,
  ) {
    this.node = node;
    this.dom = document.createElement('div');
    this.dom.className = 'cherry-milkdown-code-block';
    this.dom.dataset.type = 'codeBlock';

    const tools = document.createElement('div');
    tools.className = 'cherry-milkdown-code-block__tools';
    tools.contentEditable = 'false';

    this.language = document.createElement('select');
    this.language.className = 'cherry-milkdown-code-block__language';
    this.language.setAttribute('aria-label', '代码语言');
    for (const value of CODE_LANGUAGES) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value || '纯文本';
      this.language.append(option);
    }
    this.language.addEventListener('change', this.updateLanguage);

    this.copy = document.createElement('button');
    this.copy.type = 'button';
    this.copy.className = 'cherry-milkdown-code-block__copy';
    this.copy.title = '复制代码';
    this.copy.setAttribute('aria-label', '复制代码');
    this.copy.textContent = '复制';
    this.copy.addEventListener('click', this.copyCode);
    tools.append(this.language, this.copy);

    this.pre = document.createElement('pre');
    this.gutter = document.createElement('span');
    this.gutter.className = 'cherry-milkdown-code-block__gutter';
    this.gutter.contentEditable = 'false';
    this.contentDOM = document.createElement('code');
    this.contentDOM.className = 'cherry-milkdown-code-block__content';
    this.contentDOM.spellcheck = false;
    this.contentDOM.addEventListener('click', this.activateContent);
    this.pre.append(this.gutter, this.contentDOM);
    this.dom.append(tools, this.pre);
    this.dom.addEventListener('mousedown', this.selectBlockFromChrome, true);
    this.sync();
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.sync();
    return true;
  }

  selectNode() {
    this.dom.classList.add('is-selected');
  }

  deselectNode() {
    this.dom.classList.remove('is-selected');
  }

  stopEvent(event: Event) {
    return Boolean((event.target as Element | null)?.closest('.cherry-milkdown-code-block__tools'));
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    if (mutation.type === 'selection') return false;
    if (mutation.type === 'attributes') return true;
    return mutation.target !== this.contentDOM && !this.contentDOM.contains(mutation.target);
  }

  destroy() {
    this.disposed = true;
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.language.removeEventListener('change', this.updateLanguage);
    this.copy.removeEventListener('click', this.copyCode);
    this.contentDOM.removeEventListener('click', this.activateContent);
    this.dom.removeEventListener('mousedown', this.selectBlockFromChrome, true);
  }

  private sync() {
    this.language.disabled = !this.view.editable;
    const language = languageName(this.node.attrs.language);
    if (language && !Array.from(this.language.options).some((option) => option.value === language)) {
      const option = document.createElement('option');
      option.value = language;
      option.textContent = language;
      this.language.append(option);
    }
    this.language.value = language;
    this.dom.dataset.lang = language;
    const languageClass = `language-${language || 'text'}`;
    this.pre.className = languageClass;
    this.contentDOM.className = `cherry-milkdown-code-block__content ${languageClass}`;
    const lines = Math.max(1, this.node.textContent.split('\n').length);
    this.dom.dataset.lines = String(lines);
    this.gutter.replaceChildren(
      ...Array.from({ length: lines }, (_, index) =>
        Object.assign(document.createElement('span'), { textContent: String(index + 1) }),
      ),
    );
  }

  private updateLanguage = () => {
    if (!this.view.editable) return;
    const position = this.getPos();
    if (typeof position !== 'number') return;
    this.view.dispatch(this.view.state.tr.setNodeAttribute(position, 'language', this.language.value));
    this.view.focus();
  };

  private activateContent = (event: MouseEvent) => {
    if (event.button !== 0) return;
    // This NodeView has already translated the browser's DOM selection below.
    // Do not let ProseMirror's root click handler replace it with a selection
    // around the whole custom node after the event bubbles.
    event.stopPropagation();
    const position = this.getPos();
    if (typeof position !== 'number') return;
    const start = position + 1;
    const end = start + this.node.content.size;
    const selection = this.contentDOM.ownerDocument.getSelection();
    let anchor: number | undefined;
    let head: number | undefined;
    if (
      selection?.anchorNode &&
      selection.focusNode &&
      this.contentDOM.contains(selection.anchorNode) &&
      this.contentDOM.contains(selection.focusNode)
    ) {
      try {
        anchor = this.view.posAtDOM(selection.anchorNode, selection.anchorOffset);
        head = this.view.posAtDOM(selection.focusNode, selection.focusOffset);
      } catch {
        // Fall through to coordinate mapping when a syntax decoration was
        // replaced between pointerdown and click.
      }
    }
    if (anchor === undefined || head === undefined) {
      const mapped = this.view.posAtCoords({ left: event.clientX, top: event.clientY });
      anchor = mapped?.pos ?? end;
      head = anchor;
    }
    const clamp = (value: number) => Math.max(start, Math.min(end, value));
    this.view.dispatch(
      this.view.state.tr.setSelection(TextSelection.create(this.view.state.doc, clamp(anchor), clamp(head))),
    );
    this.view.focus();
  };

  private selectBlockFromChrome = (event: MouseEvent) => {
    if (event.button !== 0) return;
    const target = event.target as Node;
    if (
      this.contentDOM.contains(target) ||
      (target instanceof Element && target.closest('.cherry-milkdown-code-block__tools'))
    )
      return;
    const position = this.getPos();
    if (typeof position !== 'number') return;
    event.preventDefault();
    event.stopPropagation();
    this.view.dispatch(this.view.state.tr.setSelection(NodeSelection.create(this.view.state.doc, position)));
    this.view.focus();
  };

  private copyCode = () => {
    void this.copySource();
  };

  private async copySource() {
    try {
      await copyToClip(this.node.textContent);
      if (this.disposed) return;
      this.copy.textContent = '已复制';
    } catch {
      if (this.disposed) return;
      this.copy.textContent = '复制失败';
    }
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => {
      this.copy.textContent = '复制';
      this.copyTimer = undefined;
    }, 800);
  }
}

export const cherryCodeBlockView = $view(
  codeBlockSchema.node,
  () => (node, view, getPos) => new CherryCodeBlockView(node, view, getPos),
);

export const cherryCodeBlockHighlightPlugin = $prose(
  () =>
    new Plugin<DecorationSet>({
      state: {
        init: (_config, state) => buildHighlights(state.doc),
        apply: (transaction, previous, _oldState, state) =>
          transaction.docChanged ? buildHighlights(state.doc) : previous,
      },
      props: {
        handleTextInput(view, from, to, text) {
          if (!view.editable) return false;
          const $from = view.state.doc.resolve(from);
          const $to = view.state.doc.resolve(to);
          if (!$from.parent.type.spec.code || $from.parent !== $to.parent) return false;
          // The highlighted NodeView contains inline decoration spans. Some
          // touch browsers report the correct logical selection but lose the
          // first character while reconciling the browser's DOM mutation.
          // Keep code input in ProseMirror's transaction model instead.
          view.dispatch(view.state.tr.insertText(text, from, to).scrollIntoView());
          return true;
        },
        handleKeyDown(view, event) {
          const { selection } = view.state;
          if (
            !view.editable ||
            !(selection instanceof TextSelection) ||
            !selection.$head.parent.type.spec.code ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey ||
            !['Home', 'End'].includes(event.key)
          )
            return false;
          // Native Home/End can include the non-editable gutter or a layout
          // newline. Resolve logical line boundaries in the document instead,
          // so the next input never races a deferred DOM selection update.
          const text = selection.$head.parent.textContent;
          const offset = selection.$head.parentOffset;
          const lineEnd = text.indexOf('\n', offset);
          let lineOffset = text.length;
          if (event.key === 'Home') lineOffset = text.lastIndexOf('\n', offset - 1) + 1;
          else if (lineEnd >= 0) lineOffset = lineEnd;
          const target = selection.$head.start() + lineOffset;
          view.dispatch(
            view.state.tr
              .setSelection(TextSelection.create(view.state.doc, event.shiftKey ? selection.anchor : target, target))
              .scrollIntoView(),
          );
          return true;
        },
        decorations(state) {
          return this.getState(state);
        },
      },
    }),
);

export const cherryCodeBlock = [cherryCodeBlockView, cherryCodeBlockHighlightPlugin];
