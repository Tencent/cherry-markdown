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
    boundingClientRect(callback: (rect: { height: number; width: number } | null) => void): NativeSelectorQuery;
  };
  selectAll(selector: string): {
    boundingClientRect(callback: (rects: Array<{ height: number; width: number }>) => void): NativeSelectorQuery;
  };
  exec(): void;
}

export interface NativeTextContext {
  font: string;
  measureText(text: string): { width: number; fontBoundingBoxAscent?: number; fontBoundingBoxDescent?: number };
}

declare global {
  function Component(options: object): void;
  const wx: {
    createOffscreenCanvas?: (options: { type: '2d'; width: number; height: number }) => {
      getContext(type: '2d'): NativeTextContext;
    };
    getWindowInfo?: () => { windowWidth: number };
    setClipboardData(options: { data: string }): void;
    previewImage(options: { current: string; urls: string[] }): void;
  };
}
