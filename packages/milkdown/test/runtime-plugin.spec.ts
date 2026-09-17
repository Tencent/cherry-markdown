import { afterEach, describe, expect, it, vi } from 'vitest';
import Cherry from 'cherry-markdown/dist/cherry-markdown.esm.js';
import { MilkdownPlugin, type CherryMilkdownInstance } from '../src';

const onChange = vi.fn();
Cherry.usePlugin(MilkdownPlugin, { debounce: 0, onChange });

describe('MilkdownPlugin runtime integration', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    onChange.mockClear();
  });

  it('mounts on the existing previewOnly Cherry and synchronizes both directions', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const cherry = new Cherry({ el: root, value: '# Before', isPreviewOnly: true });
    await cherry.whenPluginsReady();
    const runtime = cherry.getPlugin(MilkdownPlugin) as CherryMilkdownInstance;

    expect(runtime).toBeDefined();
    expect(runtime.engine).toBe(cherry.engine);
    expect(root.querySelectorAll(':scope > .cherry')).toHaveLength(1);
    expect(root.querySelector('.ProseMirror')).not.toBeNull();

    runtime.setMarkdown('# From Milkdown');
    await vi.waitFor(() => expect(cherry.getMarkdown()).toBe('# From Milkdown'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ markdown: '# From Milkdown', cherry, instanceId: cherry.getInstanceId() }),
    );

    cherry.setValue('# From Cherry', true);
    await vi.waitFor(() => expect(runtime.getMarkdown()).toBe('# From Cherry'));

    cherry.destroy();
    expect(root.children).toHaveLength(0);
  });

  it('does not activate in editOnly mode', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const cherry = new Cherry({
      el: root,
      value: '# Source only',
      editor: { defaultModel: 'editOnly' },
    });
    await cherry.whenPluginsReady();

    expect(cherry.getPlugin(MilkdownPlugin)).toBeUndefined();
    expect(root.querySelector('.ProseMirror')).toBeNull();
    cherry.destroy();
  });

  it('does not activate during Cherry stream sessions', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const cherry = new Cherry({
      el: root,
      value: '# Streaming',
      isPreviewOnly: true,
      engine: { global: { flowSessionContext: true } },
    });
    await cherry.whenPluginsReady();

    expect(cherry.getPlugin(MilkdownPlugin)).toBeUndefined();
    expect(root.querySelector('.ProseMirror')).toBeNull();
    expect(root.querySelector('.cherry-previewer')).not.toBeNull();
    cherry.destroy();
  });

  it('mounts in edit&preview and keeps CodeMirror synchronized', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const cherry = new Cherry({
      el: root,
      value: 'Before',
      editor: { defaultModel: 'edit&preview' },
    });
    await cherry.whenPluginsReady();
    const runtime = cherry.getPlugin(MilkdownPlugin) as CherryMilkdownInstance;

    expect(runtime).toBeDefined();
    expect(root.querySelector('.cm-editor')).not.toBeNull();
    expect(root.querySelector('.ProseMirror')).not.toBeNull();

    runtime.setMarkdown('From Milkdown');
    await vi.waitFor(() => expect(cherry.getMarkdown()).toBe('From Milkdown'));
    expect(root.querySelector('.cm-content')?.textContent).toContain('From Milkdown');

    cherry.setValue('From CodeMirror', true);
    await vi.waitFor(() => expect(runtime.getMarkdown()).toBe('From CodeMirror'));
    expect(root.querySelector('.ProseMirror')?.textContent).toContain('From CodeMirror');
    cherry.destroy();
  });

  it('mounts inside Cherry mobile preview content without replacing its wrapper', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const cherry = new Cherry({
      el: root,
      value: '# Mobile',
      isPreviewOnly: true,
      previewer: { isMobilePreview: true },
    });
    await cherry.whenPluginsReady();

    const mobileContent = root.querySelector('.cherry-mobile-previewer-content');
    expect(mobileContent).not.toBeNull();
    expect(mobileContent?.querySelector('.ProseMirror')).not.toBeNull();
    cherry.destroy();
  });

  it('restores the latest native preview when the runtime is detached', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const cherry = new Cherry({ el: root, value: '# Before', isPreviewOnly: true });
    await cherry.whenPluginsReady();
    const runtime = cherry.getPlugin(MilkdownPlugin) as CherryMilkdownInstance;

    cherry.setValue('# Native fallback', true);
    await vi.waitFor(() => expect(runtime.getMarkdown()).toBe('# Native fallback'));
    await runtime.destroy();

    expect(root.querySelector('.ProseMirror')).toBeNull();
    expect(root.querySelector('h1')?.textContent).toBe('Native fallback');
    cherry.destroy();
  });

  it('resolves isolated per-instance overrides from one static registration', async () => {
    let configured = 0;
    const configure = vi.fn(() => ({ readonly: configured++ === 1 }));
    class ConfiguredCherry extends Cherry {
      static initialized = false;
    }
    ConfiguredCherry.usePlugin(MilkdownPlugin, { configure });

    const editableRoot = document.createElement('div');
    editableRoot.id = 'editable';
    const readonlyRoot = document.createElement('div');
    readonlyRoot.id = 'readonly';
    document.body.append(editableRoot, readonlyRoot);
    const editable = new ConfiguredCherry({ el: editableRoot, value: 'Editable', isPreviewOnly: true });
    const readonly = new ConfiguredCherry({ el: readonlyRoot, value: 'Readonly', isPreviewOnly: true });
    await Promise.all([editable.whenPluginsReady(), readonly.whenPluginsReady()]);

    expect(configure).toHaveBeenCalledTimes(2);
    expect(editableRoot.querySelector('.ProseMirror')?.getAttribute('contenteditable')).toBe('true');
    expect(readonlyRoot.querySelector('.ProseMirror')?.getAttribute('contenteditable')).toBe('false');
    editable.destroy();
    readonly.destroy();
  });

  it('returns the DOM to baseline after repeated mount and destroy', async () => {
    for (let index = 0; index < 10; index += 1) {
      const root = document.createElement('div');
      document.body.append(root);
      const cherry = new Cherry({ el: root, value: `# Cycle ${index}`, isPreviewOnly: true });
      await cherry.whenPluginsReady();
      expect(root.querySelector('.ProseMirror')).not.toBeNull();
      cherry.destroy();
      await vi.waitFor(() => expect(root.childElementCount).toBe(0));
      root.remove();
    }
    expect(document.querySelectorAll('.cherry, .cherry-bubble--preview, .ProseMirror')).toHaveLength(0);
  });
});
