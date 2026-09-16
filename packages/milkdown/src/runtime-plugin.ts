import type {
  CherryMilkdownHost,
  CherryMilkdownInstance,
  CherryMilkdownPluginOptions,
  CherryMilkdownRuntimeOptions,
} from './types.js';
import { mountCherryMilkdown } from './editor.js';

class CherryMilkdownRuntime implements CherryMilkdownInstance {
  private instance?: CherryMilkdownInstance;
  private unregisterRenderer?: () => void;
  private destroyed = false;

  constructor(
    private readonly cherry: CherryMilkdownHost,
    private readonly options: CherryMilkdownRuntimeOptions,
  ) {}

  async mount(): Promise<void> {
    if (this.destroyed) return;
    const previewer = this.cherry.getPreviewer();
    if (typeof previewer.setContentRenderer !== 'function') {
      throw new Error('MilkdownPlugin requires a Cherry Previewer with setContentRenderer().');
    }
    const root = previewer.getDomContainer();
    const notify = this.options.onChange;
    let latestMarkdown = this.cherry.getMarkdown();
    let mountedInstance: CherryMilkdownInstance | undefined;
    try {
      // Reserve the exclusive Previewer renderer before asynchronous setup so
      // another runtime cannot start mutating the same content root.
      this.unregisterRenderer = previewer.setContentRenderer({
        update: () => {
          latestMarkdown = this.cherry.getMarkdown();
          if (this.instance && latestMarkdown !== this.instance.getMarkdown()) {
            this.instance.setMarkdown(latestMarkdown, { emit: false });
          }
        },
        getValue: () => this.cherry.engine.makeHtml(this.instance?.getMarkdown() ?? latestMarkdown),
      });
      mountedInstance = await mountCherryMilkdown(
        this.cherry,
        {
          ...this.options,
          value: latestMarkdown,
          engine: this.cherry.engine,
          onChange: ({ markdown }) => {
            notify?.({
              markdown,
              cherry: this.cherry,
              instanceId: this.cherry.getInstanceId(),
            });
          },
        },
        {
          shouldCommit: () => !this.destroyed,
          onDocumentChange: (markdown) => {
            if (this.cherry.getMarkdown() !== markdown) this.cherry.setValue(markdown, true);
          },
        },
      );
      if (this.destroyed) {
        await mountedInstance.destroy();
        return;
      }
      this.instance = mountedInstance;
      latestMarkdown = this.cherry.getMarkdown();
      if (latestMarkdown !== mountedInstance.getMarkdown()) {
        mountedInstance.setMarkdown(latestMarkdown, { emit: false });
      }
    } catch (error) {
      await mountedInstance?.destroy().catch(() => {});
      this.unregisterRenderer?.();
      this.unregisterRenderer = undefined;
      root.classList.remove('cherry-milkdown');
      throw error;
    }
  }

  get editor() {
    if (!this.instance) throw new Error('MilkdownPlugin is not ready. Await cherry.whenPluginsReady() first.');
    return this.instance.editor;
  }

  get engine() {
    return this.cherry.engine;
  }

  trackSelection() {
    if (!this.instance) throw new Error('MilkdownPlugin is not ready. Await cherry.whenPluginsReady() first.');
    return this.instance.trackSelection();
  }

  getMarkdown(): string {
    return this.instance?.getMarkdown() ?? this.cherry.getMarkdown();
  }

  setMarkdown(markdown: string, options?: { emit?: boolean }): void {
    this.instance?.setMarkdown(markdown, options);
    if (this.cherry.getMarkdown() !== markdown) this.cherry.setValue(markdown, true);
  }

  focus(): void {
    this.instance?.focus();
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    this.unregisterRenderer?.();
    this.unregisterRenderer = undefined;
    const instance = this.instance;
    this.instance = undefined;
    await instance?.destroy();
  }
}

/**
 * Site-wide preview editor plugin. Registration is static, while every Cherry
 * preview receives an isolated runtime instance.
 */
export class MilkdownPlugin {
  static $cherry$runtime = true;

  static create(cherry: CherryMilkdownHost, options: CherryMilkdownPluginOptions = {}) {
    const model = cherry.options.isPreviewOnly
      ? 'previewOnly'
      : (cherry.options.editor?.defaultModel ?? 'edit&preview');
    // Milkdown owns Cherry's preview surface. It is useful when that surface
    // is initially visible, and deliberately stays out of source-only and
    // streaming sessions.
    if (model === 'editOnly' || cherry.options.engine?.global?.flowSessionContext) return null;
    const mode = model === 'previewOnly' ? 'previewOnly' : 'edit&preview';
    const { configure, ...defaults } = options;
    const overrides = configure?.({ cherry, instanceId: cherry.getInstanceId(), mode });
    return new CherryMilkdownRuntime(cherry, { ...defaults, ...overrides });
  }
}

export default MilkdownPlugin;
