import { useEffect, useRef } from 'react';
import Cherry from 'cherry-markdown';
import basicMd from '../../../../examples/assets/markdown/index.md?raw';
import { loadDemoDependencies, renderECharts } from './demo-support';

let milkdownRegistered = false;

declare global {
  interface Window {
    Cherry: typeof Cherry;
    cherry?: Cherry;
    milkdownMarkdown?: string;
    echarts?: typeof import('echarts/core');
  }
}

export default function App() {
  const editorRoot = useRef<HTMLDivElement>(null);
  // One React demo serves both Cherry layouts. The mode is selected through
  // Cherry's existing configuration, not by mounting a second editor/page.
  const requestedMode = new URLSearchParams(window.location.search).get('mode');
  const mode = requestedMode === 'previewOnly' || requestedMode === 'editOnly' ? requestedMode : 'edit&preview';
  const previewOnly = mode === 'previewOnly';
  const editOnly = mode === 'editOnly';
  const enableToolbarBridge = new URLSearchParams(window.location.search).get('toolbarBridge') === '1';

  useEffect(() => {
    let cancelled = false;
    let cherry: Cherry | undefined;

    const mount = async () => {
      const root = editorRoot.current;
      if (!root) return;
      // The shared legacy demo config registers toolbar hooks from these
      // globals while its module is evaluated.
      window.Cherry = Cherry;
      let milkdownPlugin: typeof import('@cherry-markdown/milkdown').milkdown | undefined;
      if (!editOnly) {
        const [milkdownModule] = await Promise.all([
          import('@cherry-markdown/milkdown'),
          import('@cherry-markdown/milkdown/styles.css'),
          import('@milkdown/kit/prose/view/style/prosemirror.css'),
        ]);
        milkdownPlugin = milkdownModule.milkdown;
      }
      await loadDemoDependencies();
      // Both supported demos consume Cherry's existing public configurations.
      // editOnly intentionally remains a plain Cherry source editor.
      const configModule = previewOnly
        ? // @ts-expect-error Cherry's shared JavaScript demo config does not publish declarations.
          await import('../../../../examples/assets/scripts/preview-demo.js')
        : // @ts-expect-error Cherry's shared JavaScript demo config does not publish declarations.
          await import('../../../../examples/assets/scripts/index-demo.js');
      const cherryConfig = previewOnly ? configModule.previewConfig : configModule.basicConfig;
      if (cancelled) return;

      if (milkdownPlugin && !milkdownRegistered) {
        Cherry.usePlugin(milkdownPlugin, {
          debounce: 0,
          enableToolbarBridge,
          renderers: { echarts: renderECharts },
          onChange: ({ markdown }: { markdown: string }) => {
            window.milkdownMarkdown = markdown;
          },
        });
        milkdownRegistered = true;
      }

      cherry = new Cherry({
        ...cherryConfig,
        editor: {
          ...cherryConfig.editor,
          defaultModel: mode,
        },
        el: root,
        value: basicMd,
      });
      window.cherry = cherry;
      window.milkdownMarkdown = cherry.getMarkdown();
    };

    void mount();
    return () => {
      cancelled = true;
      cherry?.destroy();
      if (window.cherry === cherry) delete window.cherry;
    };
  }, []);

  return (
    <>
      <div id="dom_mask" aria-hidden="true" />
      <div id="markdown" ref={editorRoot} className={previewOnly ? 'preview-only-page' : undefined} />
    </>
  );
}
