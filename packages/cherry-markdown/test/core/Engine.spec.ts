import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CherryEngine from '../../src/index.engine.core';
import Engine from '../../src/Engine';
import ParagraphBase from '../../src/core/ParagraphBase';
import SyntaxBase from '../../src/core/SyntaxBase';
import hooksConfig from '../../src/core/HooksConfig';

type EngineOptions = ConstructorParameters<typeof CherryEngine>[0];

function createEngine(options: EngineOptions = {}): Engine {
  // @ts-expect-error CherryEngine's compatibility constructor returns an Engine instance.
  return new CherryEngine(options);
}

describe('core/Engine', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('exposes stable hash aliases and memoizes sentence rendering', () => {
    const engine = createEngine();
    const render = vi.fn((markdown: string) => `<p>${markdown}</p>`);
    const first = engine.$checkCache('cached sentence', render);
    const second = engine.$checkCache('cached sentence', render);

    expect(engine.md5('value')).toBe(engine.hash('value'));
    expect(engine.sha256('value')).toBe(engine.hashHex('value'));
    expect(engine.hash('value')).toMatch(/^[0-9a-f]{16}$/);
    expect(first).toEqual(second);
    expect(first.html).toBe('<p>cached sentence</p>');
    expect(render).toHaveBeenCalledOnce();
    expect(Reflect.get(engine, '_cherry')).toBe(engine.$cherry);
  });

  it('decodes URLs, caches asynchronous replacements, and removes rejected replacements', () => {
    const engine = createEngine();
    let complete: ((url: string) => void) | undefined;
    const processor = vi.fn((url: string, _srcType: string, callback: (newUrl: string) => void) => {
      complete = callback;
      return url;
    });
    engine.$cherry.options.callback.urlProcessor = processor;
    const remake = vi.spyOn(engine, 'reMakeHtml').mockImplementation(() => undefined);

    expect(engine.urlProcessor('https://example.com/a~Db&amp;c', 'link')).toBe('https://example.com/a~Db&amp;c');
    expect(processor).toHaveBeenCalledWith('https://example.com/a$b&c', 'link', expect.any(Function));

    complete?.('https://cdn.example.com/replaced');
    expect(remake).toHaveBeenCalledOnce();
    expect(engine.urlProcessor('https://example.com/a~Db&amp;c', 'link')).toBe('https://cdn.example.com/replaced');

    complete?.('https://cdn.example.com/ignored');
    expect(remake).toHaveBeenCalledOnce();
    complete?.('');
    expect(engine.urlProcessorMap['link_https://example.com/a~Db&amp;c']).toBeUndefined();
  });

  it('promotes a global URL processor into the callback pipeline', () => {
    const urlProcessor = vi.fn((url: string, srcType: string) => `${srcType}:${url}`);
    const engine = createEngine({ engine: { global: { urlProcessor } } });
    const callback = vi.fn();

    expect(engine.$cherry.options.callback.urlProcessor('https://example.com', 'link', callback)).toBe(
      'link:https://example.com',
    );
    expect(engine.$cherry.options.engine.global.urlProcessor).toBe(engine.$cherry.options.callback.urlProcessor);
    expect(urlProcessor).toHaveBeenCalledWith('https://example.com', 'link', callback);
  });

  it('re-renders the current document once after a burst of URL updates', () => {
    vi.useFakeTimers();
    const engine = createEngine();
    const refresh = vi.fn();
    const emit = vi.fn();
    Object.assign(engine.$cherry, {
      editor: { editor: { view: { state: { doc: { toString: () => '# Updated' } } } } },
      previewer: { refresh },
      $event: { emit },
    });
    const makeHtml = vi.spyOn(engine, 'makeHtml').mockReturnValue('<h1>Updated</h1>');

    engine.reMakeHtml();
    engine.reMakeHtml();
    vi.advanceTimersByTime(1000);

    expect(makeHtml).toHaveBeenCalledOnce();
    expect(makeHtml).toHaveBeenCalledWith('# Updated');
    expect(refresh).toHaveBeenCalledWith('<h1>Updated</h1>');
    expect(emit).toHaveBeenCalledWith('afterChange', {
      markdownText: '# Updated',
      html: '<h1>Updated</h1>',
    });
  });

  it('validates legacy hook instances and rejects invalid inheritance', () => {
    class SentenceHook extends SyntaxBase {}
    class ParagraphHook extends ParagraphBase {}
    Object.defineProperty(SentenceHook, 'HOOK_NAME', { value: 'engineSentenceFixture' });
    Object.defineProperty(ParagraphHook, 'HOOK_NAME', { value: 'engineParagraphFixture' });
    const sentenceHook = new SentenceHook({});
    const paragraphHook = new ParagraphHook();
    const engine = createEngine();
    const initialLength = hooksConfig.length;

    try {
      engine.$configInit({ hooksConfig: { hooksList: [sentenceHook, paragraphHook] } });
      expect(hooksConfig.slice(initialLength)).toEqual([sentenceHook, paragraphHook]);
      expect(() => engine.$configInit({ hooksConfig: { hooksList: [{ getType: () => 'sentence' }] } })).toThrow(
        'the hook does not correctly inherit',
      );
    } finally {
      hooksConfig.splice(initialLength);
    }
  });

  it('normalizes platform newlines, reserved characters, and escaped HTML punctuation', () => {
    const engine = createEngine();

    expect(engine.$encodeReservedKeywords('price $5 ~ approximate')).toBe('price ~D5 ~T approximate');
    expect(engine.$decodeReservedKeywords('price ~D5 ~T approximate')).toBe('price $5 ~ approximate');
    expect(engine.$beforeMakeHtml('first\r\nsecond\rthird')).toContain('first\nsecond\nthird');
    expect(engine.dealAfterMakeHtml('safe_id id="safe_heading" \\* \\&copy; \\&raw')).toBe(
      'safe_id id="heading" * &amp;copy; &amp;raw',
    );
  });

  it('wraps hook failures and skips absent hook collections', () => {
    const engine = createEngine();
    Object.defineProperty(engine, 'hooks', { configurable: true, value: {} });
    expect(engine.$fireHookAction('unchanged', 'paragraph', 'makeHtml')).toBe('unchanged');

    const failingHook = {
      $engine: engine,
      getName: () => 'failing',
      makeHtml: () => {
        throw new Error('hook failure');
      },
    };
    Object.defineProperty(engine, 'hooks', {
      configurable: true,
      value: { paragraph: [failingHook] },
    });
    expect(() => engine.$fireHookAction('markdown', 'paragraph', 'makeHtml')).toThrow('hook failure');
  });

  it('protects and restores long text, fenced code, and embedded data URLs', () => {
    const engine = createEngine();
    const longText = 'x'.repeat(6100);
    const fenced = `\`\`\`text\n${longText}\n\`\`\``;
    const markdown = `${longText}\n![pixel](data:image/png;base64,QUJDRA==)`;
    const protectedMarkdown = engine.$cacheBigData(markdown);

    expect(protectedMarkdown).toContain('bigDataBegin');
    expect(protectedMarkdown).not.toContain('data:image/png;base64,QUJDRA==');
    expect(engine.$deCacheBigData(protectedMarkdown)).toBe(markdown);
    expect(engine.$cacheBigData(fenced)).toBe(fenced);
  });

  it('restores and eventually clears configured flow cursor DOM', () => {
    vi.useFakeTimers();
    const engine = createEngine();
    const clearFlowSessionCursor = vi.fn();
    engine.$cherry.options.engine.global.flowSessionCursor = '<i class="cursor"></i>';
    Object.defineProperty(engine.$cherry, 'clearFlowSessionCursor', { value: clearFlowSessionCursor });

    expect(engine.$clearFlowSessionCursorCache('beforeCHERRYFLOWSESSIONCURSORafter')).toBe(
      'before<i class="cursor"></i>after',
    );
    engine.$clearFlowSessionCursorCache('again');
    vi.advanceTimersByTime(2560);
    expect(clearFlowSessionCursor).toHaveBeenCalledOnce();

    engine.$cherry.options.engine.global.flowSessionCursor = '';
    expect(engine.$clearFlowSessionCursorCache('unchanged')).toBe('unchanged');
  });

  it('returns structured HTML and runs synchronous render lifecycle handlers', () => {
    const engine = createEngine();
    const clear = vi.spyOn(engine.asyncRenderHandler, 'clear');
    const started = vi.spyOn(engine.asyncRenderHandler, 'handleSyncRenderStart');
    const completed = vi.spyOn(engine.asyncRenderHandler, 'handleSyncRenderCompleted');
    const result = engine.makeHtml('# Structured', 'object');

    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('type', 'root');
    expect(clear).toHaveBeenCalledOnce();
    expect(started).toHaveBeenCalledWith('# Structured');
    expect(completed).toHaveBeenCalledOnce();
  });

  it('renders nested Markdown helpers and converts final HTML back to Markdown', () => {
    const engine = createEngine();
    const quote = engine.makeHtmlForBlockquote('# Quoted\n\n- one\n- two');
    const footnote = engine.makeHtmlForFootnote('A **strong** note');
    const markdown = engine.makeMarkdown('<h1>Title</h1><p>Text <strong>bold</strong></p>');

    expect(quote).toContain('<h1 id="safe_quoted"');
    expect(quote).toContain('<li');
    expect(footnote).toContain('<strong>strong</strong>');
    expect(markdown).toContain('# Title');
    expect(markdown).toContain('**bold**');
  });

  it('dispatches mounted hooks and clears paragraph hook caches', () => {
    const engine = createEngine();
    const fire = vi.spyOn(engine, '$fireHookAction');
    const clear = vi.fn();

    engine.mounted();
    Object.defineProperty(engine, 'hooks', {
      configurable: true,
      value: { paragraph: [{ clearCache: clear }, {}] },
    });
    engine.clearCache();

    expect(fire).toHaveBeenCalledWith('', 'sentence', 'mounted');
    expect(fire).toHaveBeenCalledWith('', 'paragraph', 'mounted');
    expect(clear).toHaveBeenCalledOnce();
  });
});
