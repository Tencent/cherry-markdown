/**
 * Narrow compatibility boundary for Cherry preview controls. These members
 * are intentionally isolated from the Milkdown schema and NodeViews so a
 * Cherry upgrade has one adapter surface to audit.
 */
export interface NativeCherryHost {
  options: { isPreviewOnly?: boolean; editor?: { defaultModel?: string } };
  bubble?: any;
  toolbarBubbleContainer?: HTMLElement;
  $event?: {
    on(name: string, listener: (...args: any[]) => void): void;
    off(name: string, listener: (...args: any[]) => void): void;
  };
  getPreviewer(): any;
}

export type NativePreviewElementKind = 'image' | 'mermaid';
