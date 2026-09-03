import { codeBlockSchema } from '@milkdown/kit/preset/commonmark';
import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { Plugin, TextSelection } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import type { EditorView, NodeView, ViewMutationRecord } from '@milkdown/kit/prose/view';
import { $prose, $view } from '@milkdown/kit/utils';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-csharp.js';
import 'prismjs/components/prism-go.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-markdown.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-sql.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-yaml.js';

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

const LANGUAGE_ALIASES: Record<string, string> = {
  bash: 'bash',
  c: 'c',
  'c++': 'cpp',
  'c#': 'csharp',
  cs: 'csharp',
  go: 'go',
  golang: 'go',
  html: 'markup',
  js: 'javascript',
  md: 'markdown',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  ts: 'typescript',
  yml: 'yaml',
};

type PrismToken = string | { alias?: string | string[]; content: PrismToken | PrismToken[]; type: string };

function languageName(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function prismLanguage(language: string) {
  const normalized = LANGUAGE_ALIASES[language] ?? language;
  return Prism.languages[normalized] ?? Prism.languages.javascript ?? Prism.languages.markup;
}

function tokenDecorations(token: PrismToken, position: number, decorations: Decoration[]): number {
  if (typeof token === 'string') return position + token.length;
  const from = position;
  const children = Array.isArray(token.content) ? token.content : [token.content];
  for (const child of children) position = tokenDecorations(child, position, decorations);
  if (position > from) {
    const aliases = Array.isArray(token.alias) ? token.alias : token.alias ? [token.alias] : [];
    decorations.push(Decoration.inline(from, position, { class: ['token', token.type, ...aliases].join(' ') }));
  }
  return position;
}

function buildHighlights(doc: ProseNode) {
  const decorations: Decoration[] = [];
  doc.descendants((node, position) => {
    if (node.type.name !== 'code_block' || !node.textContent) return;
    const grammar = prismLanguage(languageName(node.attrs.language));
    if (!grammar) return;
    let cursor = position + 1;
    try {
      for (const token of Prism.tokenize(node.textContent, grammar))
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
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.language.removeEventListener('change', this.updateLanguage);
    this.copy.removeEventListener('click', this.copyCode);
    this.contentDOM.removeEventListener('click', this.activateContent);
  }

  private sync() {
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

  private copyCode = () => {
    const value = this.node.textContent;
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(value).catch(() => {
        // Clipboard permission is optional in embedded previews. Do not leak
        // an unhandled rejection or block ordinary code editing.
      });
    }
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copy.textContent = '已复制';
    this.copyTimer = setTimeout(() => {
      this.copy.textContent = '复制';
      this.copyTimer = undefined;
    }, 800);
  };
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
        decorations(state) {
          return this.getState(state);
        },
      },
    }),
);

export const cherryCodeBlock = [cherryCodeBlockView, cherryCodeBlockHighlightPlugin];
