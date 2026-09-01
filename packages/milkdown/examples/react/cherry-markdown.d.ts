declare module 'cherry-markdown' {
  class Cherry {
    static plugins: Record<string, unknown>;
    static usePlugin(plugin: unknown, ...options: unknown[]): void;

    constructor(options?: Record<string, unknown>);

    getMarkdown(): string;
    setValue(markdown: string): void;
    destroy(): void;
  }

  export default Cherry;
}
