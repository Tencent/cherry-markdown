/** Small structural types for the platform calls used by these native components. */
export interface NativeEvent {
  currentTarget: { dataset: Record<string, string | undefined> };
}
export interface NativeInstance<Data> {
  data: Data;
  setData(patch: Record<string, unknown>, done?: () => void): void;
  triggerEvent(name: string, detail: Record<string, unknown>, options?: { bubbles: boolean; composed: boolean }): void;
}

export interface NativeSelectorQuery {
  select(selector: string): {
    boundingClientRect(callback: (rect: { height: number } | null) => void): NativeSelectorQuery;
  };
  exec(): void;
}

declare global {
  function Component(options: object): void;
  const wx: {
    setClipboardData(options: { data: string }): void;
    previewImage(options: { current: string; urls: string[] }): void;
  };
}
