import type { CherryPlugin } from 'cherry-markdown/types/cherry';
import { createCherryEditingBridge } from './bridge.js';
import type {
  CherryMilkdownHost,
  CherryMilkdownInstance,
  CherryMilkdownPreviewHandle,
  CherryMilkdownPreviewOptions,
  CherryPreviewContentRenderer,
} from './types.js';
import { createCherryMilkdown } from './index.js';

let previewInstanceId = 0;

/**
 * Mount Milkdown into the document surface of an existing Cherry previewer.
 * Cherry continues to own the page shell, theme, toolbar, layout and Markdown
 * source. Milkdown only makes the current preview content directly editable.
 */
export async function attachCherryMilkdownPreview(
  cherry: CherryMilkdownHost,
  options: CherryMilkdownPreviewOptions = {},
): Promise<CherryMilkdownPreviewHandle> {
  const previewer = cherry.getPreviewer();
  if (!previewer?.setContentRenderer || !previewer?.clearContentRenderer) {
    throw new TypeError(
      'attachCherryMilkdownPreview: this Cherry version does not expose Previewer.setContentRenderer().',
    );
  }

  let instance: CherryMilkdownInstance | undefined;
  let instanceRoot: HTMLElement | undefined;
  let addedCherryMarkdownClass = false;
  let creation: Promise<void> | undefined;
  let destruction: Promise<void> | undefined;
  let editingBridge: ReturnType<typeof createCherryEditingBridge> | undefined;
  let latestMarkdown = cherry.getMarkdown();
  let appliedHostMarkdown = latestMarkdown;
  const updateSource = `@cherry-markdown/milkdown:${++previewInstanceId}`;
  let localRevision = 0;
  let detached = false;
  let failed = false;
  let creationErrorReported = false;

  const clearInstanceRootClasses = () => {
    instanceRoot?.classList.remove('cherry-milkdown--previewer');
    if (addedCherryMarkdownClass) instanceRoot?.classList.remove('cherry-markdown');
    addedCherryMarkdownClass = false;
  };

  const createIn = async (container: HTMLElement) => {
    const creationMarkdown = latestMarkdown;
    if (instance) await instance.destroy();
    instance = undefined;
    clearInstanceRootClasses();
    instanceRoot = container;
    container.replaceChildren();
    // Cherry's published stylesheet scopes all typography and block spacing
    // under `.cherry-markdown`. Reuse that contract on the Milkdown root
    // instead of maintaining a second, subtly divergent style system.
    addedCherryMarkdownClass = !container.classList.contains('cherry-markdown');
    container.classList.add('cherry-markdown', 'cherry-milkdown--previewer');
    const editor = await createCherryMilkdown({
      ...options,
      root: container,
      value: creationMarkdown,
      engine: cherry.engine,
      nativePreview: true,
      onError: (error, phase) => {
        if (phase === 'create') creationErrorReported = true;
        options.onError?.(error, phase);
      },
      onChange: (result) => {
        options.onChange?.(result);
      },
      onImmediateChange: (result) => {
        if (detached) return;
        latestMarkdown = result.markdown;
        appliedHostMarkdown = result.markdown;
        localRevision += 1;
        if (result.markdown === cherry.getMarkdown()) return;
        cherry.setValue(result.markdown, true, { source: updateSource, revision: localRevision });
      },
    });
    if (detached || instanceRoot !== container) {
      await editor.destroy();
      return;
    }
    instance = editor;
    editingBridge = createCherryEditingBridge(cherry, editor, {
      enableBubble: options.enableBubble,
      enableToolbarBridge: options.enableToolbarBridge,
    });
    previewer.setEditingBridge?.(editingBridge);
    if (creationMarkdown !== latestMarkdown) editor.setMarkdown(latestMarkdown, { emit: false });
    appliedHostMarkdown = latestMarkdown;
  };

  const renderer: CherryPreviewContentRenderer = {
    async update({ container, markdown, updateContext }) {
      if (detached || failed) return;
      if (!instance || instanceRoot !== container || !container.contains(instanceRoot.querySelector('.milkdown'))) {
        latestMarkdown = markdown;
        if (!creation) {
          creation = createIn(container).finally(() => {
            creation = undefined;
          });
        }
        try {
          await creation;
        } catch (error) {
          await restoreNativePreview(error);
        }
        return;
      }
      if (
        updateContext?.source === updateSource &&
        typeof updateContext.revision === 'number' &&
        updateContext.revision <= localRevision
      ) {
        return;
      }
      latestMarkdown = markdown;
      if (appliedHostMarkdown !== markdown) {
        const { scrollLeft, scrollTop } = container;
        instance.setMarkdown(markdown, { emit: false });
        appliedHostMarkdown = markdown;
        container.scrollLeft = scrollLeft;
        container.scrollTop = scrollTop;
      }
    },
    destroy() {
      if (!destruction) {
        destruction = (async () => {
          if (creation) await creation.catch(() => undefined);
          if (instance) await instance.destroy();
          instance = undefined;
          previewer.clearEditingBridge?.(editingBridge);
          editingBridge?.destroy?.();
          editingBridge = undefined;
          clearInstanceRootClasses();
          instanceRoot = undefined;
        })();
      }
      return destruction;
    },
  };

  const restoreNativePreview = async (error: unknown) => {
    if (detached || failed) return;
    failed = true;
    await previewer.clearContentRenderer(renderer);
    await renderer.destroy?.();
    if (!creationErrorReported) options.onError?.(error, 'create');
    previewer.update(cherry.engine.makeHtml(cherry.getMarkdown()));
  };

  await previewer.setContentRenderer(renderer);
  try {
    previewer.update(cherry.engine.makeHtml(latestMarkdown));
    const initialCreation = creation;
    if (initialCreation) await initialCreation.catch(restoreNativePreview);
  } catch (error) {
    await restoreNativePreview(error);
  }

  const detach = async () => {
    if (detached) return;
    detached = true;
    await previewer.clearContentRenderer(renderer);
    await renderer.destroy?.();
    previewer.update(cherry.engine.makeHtml(cherry.getMarkdown()));
  };
  return {
    get mounted() {
      return Boolean(instance);
    },
    getInstance() {
      return instance;
    },
    detach,
    destroy: detach,
  };
}

/** Creates an instance-scoped Cherry plugin that edits the existing preview with Milkdown. */
export function milkdown(options: CherryMilkdownPreviewOptions = {}): CherryPlugin<CherryMilkdownHost> {
  return {
    name: '@cherry-markdown/milkdown',
    async mount(cherry) {
      const mode = cherry.options?.editor?.defaultModel ?? 'edit&preview';
      // Milkdown enhances an editable Cherry preview. A source-only Cherry
      // instance and CherryStream have no editable preview surface to own.
      if (mode === 'editOnly' || !cherry.editor) return;
      const instance = await attachCherryMilkdownPreview(cherry, options);
      return () => instance.detach();
    },
  };
}
