import { useEffect, useRef } from 'react';
import Cherry from 'cherry-markdown';
import { milkdown } from '@cherry-markdown/milkdown';
import basicMd from '../../../../examples/assets/markdown/index.md?raw';
import { loadDemoDependencies, renderECharts } from './demo-support';

declare global {
  interface Window {
    Cherry: typeof Cherry;
    cherry?: Cherry;
    milkdown: typeof milkdown;
    milkdownMarkdown?: string;
    echarts?: typeof import('echarts/core');
  }
}

export default function App() {
  const editorRoot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let cherry: Cherry | undefined;

    const mount = async () => {
      const root = editorRoot.current;
      if (!root) return;
      // The shared legacy demo config registers toolbar hooks from these
      // globals while its module is evaluated.
      window.Cherry = Cherry;
      window.milkdown = milkdown;
      await loadDemoDependencies();
      // The complete demo config remains shared with Cherry's root example.
      // @ts-expect-error The legacy JavaScript demo config does not publish declarations.
      const { basicConfig } = await import('../../../../examples/assets/scripts/index-demo.js');
      if (cancelled) return;

      cherry = new Cherry({
        ...basicConfig,
        el: root,
        value: basicMd,
        extensions: [
          milkdown({
            debounce: 0,
            renderers: { echarts: renderECharts },
            onChange: ({ markdown }) => {
              window.milkdownMarkdown = markdown;
            },
            onImmediateChange: ({ markdown }) => {
              // The E2E diagnostic mirrors the editor's committed document;
              // public onChange remains debounced for consumers.
              window.milkdownMarkdown = markdown;
            },
          }),
        ],
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
      <div id="markdown" ref={editorRoot} />
    </>
  );
}
