import { useEffect, useRef, useState } from 'react';
import Cherry from 'cherry-markdown/dist/cherry-markdown.esm.js';
import { MilkdownPlugin, type CherryMilkdownInstance } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/style.css';
import basicMd from '../../../../examples/assets/markdown/index.md?raw';
import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts';

declare global {
  interface Window {
    cherry?: { getMarkdown(): string };
    milkdownEditor?: CherryMilkdownInstance;
  }
}

Cherry.usePlugin(MilkdownPlugin, {
  renderers: { echarts, tableChart },
});

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const requestedMode = new URLSearchParams(window.location.search).get('mode');
    const mode = requestedMode === 'edit&preview' || requestedMode === 'editOnly' ? requestedMode : 'previewOnly';
    const cherry = new Cherry({
      el: root.current!,
      value: basicMd,
      isPreviewOnly: mode === 'previewOnly',
      editor: { defaultModel: mode },
      toolbars: { showToolbar: mode !== 'previewOnly' },
    });
    window.cherry = cherry;
    void cherry
      .whenPluginsReady()
      .then(() => {
        const instance = cherry.getPlugin(MilkdownPlugin) as CherryMilkdownInstance | undefined;
        if (instance) window.milkdownEditor = instance;
      })
      .catch((error: unknown) => {
        setError(String(error));
      });
    return () => {
      delete window.cherry;
      delete window.milkdownEditor;
      cherry.destroy();
    };
  }, []);
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <div ref={root} id="markdown" />
    </>
  );
}
