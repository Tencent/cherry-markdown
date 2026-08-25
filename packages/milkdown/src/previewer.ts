import type { CherryExtension } from 'cherry-markdown/types/cherry';
import { createCherryEditingBridge } from './bridge.js';
import type {
  CherryMilkdownHost,
  CherryMilkdownInstance,
  CherryMilkdownPreviewInstance,
  CherryMilkdownPreviewOptions,
  CherryPreviewContentRenderer,
} from './types.js';
import { createCherryMilkdown } from './index.js';

/**
 * Mount Milkdown into the document surface of an existing Cherry previewer.
 * Cherry continues to own the page shell, theme, toolbar, layout and Markdown
 * source. Milkdown only makes the current preview content directly editable.
 */
export async function attachCherryMilkdownPreview(
  cherry: CherryMilkdownHost,
  options: CherryMilkdownPreviewOptions = {},
): Promise<CherryMilkdownPreviewInstance> {
  const previewer = cherry.getPreviewer();
  if (!previewer?.setContentRenderer || !previewer?.clearContentRenderer) {
    throw new TypeError(
      'attachCherryMilkdownPreview: this Cherry version does not expose Previewer.setContentRenderer().',
    );
  }

  let instance: CherryMilkdownInstance | undefined;
  let instanceRoot: HTMLElement | undefined;
  let creation: Promise<void> | undefined;
  let destruction: Promise<void> | undefined;
  let editingBridge: ReturnType<typeof createCherryEditingBridge> | undefined;
  let latestMarkdown = cherry.getMarkdown();
  let detached = false;
  let creationErrorReported = false;

  const createIn = async (container: HTMLElement) => {
    if (instance) await instance.destroy();
    instance = undefined;
    instanceRoot = container;
    container.replaceChildren();
    container.classList.add('cherry-milkdown--previewer');
    const editor = await createCherryMilkdown({
      ...options,
      root: container,
      value: latestMarkdown,
      engine: cherry.engine,
      nativePreview: true,
      onError: (error, phase) => {
        if (phase === 'create') creationErrorReported = true;
        options.onError?.(error, phase);
      },
      onChange: (result) => {
        options.onChange?.(result);
        if (detached || result.markdown === cherry.getMarkdown()) return;
        cherry.setValue(result.markdown, true);
      },
    });
    if (detached || instanceRoot !== container) {
      await editor.destroy();
      return;
    }
    instance = editor;
    editingBridge = createCherryEditingBridge(cherry, editor);
    previewer.setEditingBridge?.(editingBridge);
    if (editor.getMarkdown() !== latestMarkdown) editor.setMarkdown(latestMarkdown, { emit: false });
  };

  const renderer: CherryPreviewContentRenderer = {
    async update({ container, markdown }) {
      if (detached) return;
      latestMarkdown = markdown;
      if (!instance || instanceRoot !== container || !container.contains(instanceRoot.querySelector('.milkdown'))) {
        if (!creation) {
          creation = createIn(container).finally(() => {
            creation = undefined;
          });
        }
        await creation;
        return;
      }
      if (instance.getMarkdown() !== markdown) {
        const { scrollLeft, scrollTop } = container;
        instance.setMarkdown(markdown, { emit: false });
        container.scrollLeft = scrollLeft;
        container.scrollTop = scrollTop;
      }
    },
    destroy() {
      if (!destruction) {
        destruction = (async () => {
          if (creation) await creation;
          if (instance) await instance.destroy();
          instance = undefined;
          previewer.clearEditingBridge?.(editingBridge);
          editingBridge?.destroy?.();
          editingBridge = undefined;
          instanceRoot?.classList.remove('cherry-milkdown--previewer');
          instanceRoot = undefined;
        })();
      }
      return destruction;
    },
  };

  previewer.setContentRenderer(renderer);
  try {
    previewer.update(cherry.engine.makeHtml(latestMarkdown));
    if (creation) await creation;
    if (!instance) throw new Error('attachCherryMilkdownPreview: Milkdown failed to mount in the Cherry previewer.');
  } catch (error) {
    detached = true;
    previewer.clearContentRenderer(renderer);
    await renderer.destroy?.();
    previewer.update(cherry.engine.makeHtml(cherry.getMarkdown()));
    if (!creationErrorReported) options.onError?.(error, 'create');
    throw error;
  }

  const attached = instance;
  const detach = async () => {
    if (detached) return;
    detached = true;
    previewer.clearContentRenderer(renderer);
    await renderer.destroy?.();
    previewer.update(cherry.engine.makeHtml(cherry.getMarkdown()));
  };
  return {
    ...attached,
    detach,
    destroy: detach,
  };
}

/** Creates an instance-scoped Cherry extension that edits the existing preview with Milkdown. */
export function milkdown(options: CherryMilkdownPreviewOptions = {}): CherryExtension<CherryMilkdownHost> {
  return {
    name: '@cherry-markdown/milkdown',
    async mount(cherry) {
      const instance = await attachCherryMilkdownPreview(cherry, options);
      return () => instance.detach();
    },
  };
}
