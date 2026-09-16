declare module 'cherry-markdown/dist/cherry-markdown.engine.core.esm.js' {
  const CherryEngine: new (options?: object) => {
    makeHtml(markdown: string): string;
  };

  export default CherryEngine;
}

declare module 'cherry-markdown/dist/cherry-markdown.esm.js' {
  const Cherry: {
    new (options: object): {
      engine: unknown;
      destroy(): void;
      getInstanceId(): string;
      getMarkdown(): string;
      getPlugin(plugin: object): unknown;
      setValue(markdown: string, keepCursor?: boolean): void;
      whenPluginsReady(): Promise<void>;
    };
    usePlugin(plugin: object, options?: object): void;
  };
  export default Cherry;
}
