import { useEffect, useRef, useState } from 'react';
import Cherry from 'cherry-markdown/dist/cherry-markdown.esm.js';
import { MilkdownPlugin, type CherryMilkdownInstance } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/style.css';
import basicMd from '../../../../examples/assets/markdown/index.md?raw';
import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts';

declare global {
  interface Window {
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
    const cherry = new Cherry({
      el: root.current!,
      value: basicMd,
      isPreviewOnly: true,
      editor: { defaultModel: 'previewOnly' },
      toolbars: { showToolbar: false },
    });
    void cherry
      .whenPluginsReady()
      .then(() => {
        window.milkdownEditor = cherry.getPlugin(MilkdownPlugin) as CherryMilkdownInstance;
      })
      .catch((error: unknown) => {
        setError(String(error));
      });
    return () => {
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
