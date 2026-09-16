import Cherry from 'cherry-markdown/dist/cherry-markdown.esm.js';
import {
  MilkdownPlugin,
  type CherryEngineLike,
  type CherryMilkdownInstance,
  type CherryMilkdownPluginOptions,
} from '../../src';

interface TestEditorOptions extends CherryMilkdownPluginOptions {
  el: HTMLElement;
  value?: string;
  engine?: CherryEngineLike;
}

/**
 * Test-only convenience wrapper. Production consumers always use
 * Cherry.usePlugin(MilkdownPlugin) and own the Cherry lifecycle themselves.
 */
export async function createTestEditor(options: TestEditorOptions): Promise<CherryMilkdownInstance> {
  const { el, value = '', engine, ...pluginOptions } = options;
  if (!(el instanceof HTMLElement)) throw new TypeError('Test editor root must be an HTMLElement.');
  class TestCherry extends Cherry {
    static initialized = false;
  }

  TestCherry.usePlugin(MilkdownPlugin, pluginOptions);
  const cherry = new TestCherry({
    el,
    value,
    isPreviewOnly: true,
    editor: { defaultModel: 'previewOnly' },
    toolbars: { showToolbar: false },
    previewer: { enablePreviewerBubble: true },
  });
  if (engine) cherry.engine = engine as typeof cherry.engine;
  await cherry.whenPluginsReady();
  const runtime = cherry.getPlugin(MilkdownPlugin) as CherryMilkdownInstance | undefined;
  if (!runtime) {
    cherry.destroy();
    throw new Error('MilkdownPlugin did not activate for the test preview.');
  }

  return {
    get editor() {
      return runtime.editor;
    },
    get engine() {
      return runtime.engine;
    },
    trackSelection: runtime.trackSelection.bind(runtime),
    getMarkdown: runtime.getMarkdown.bind(runtime),
    setMarkdown: runtime.setMarkdown.bind(runtime),
    focus: runtime.focus.bind(runtime),
    async destroy() {
      await runtime.destroy();
      cherry.destroy();
    },
  };
}
