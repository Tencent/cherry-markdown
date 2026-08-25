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
  let latestMarkdown = cherry.getMarkdown();
  let detached = false;

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
    if (editor.getMarkdown() !== latestMarkdown) editor.setMarkdown(latestMarkdown);
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
      if (instance.getMarkdown() !== markdown) instance.setMarkdown(markdown);
    },
    destroy() {
      if (!destruction) {
        destruction = (async () => {
          if (creation) await creation;
          if (instance) await instance.destroy();
          instance = undefined;
          instanceRoot?.classList.remove('cherry-milkdown--previewer');
          instanceRoot = undefined;
        })();
      }
      return destruction;
    },
  };

  previewer.setContentRenderer(renderer);
  previewer.update(cherry.engine.makeHtml(latestMarkdown));
  if (creation) await creation;
  if (!instance) throw new Error('attachCherryMilkdownPreview: Milkdown failed to mount in the Cherry previewer.');

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
