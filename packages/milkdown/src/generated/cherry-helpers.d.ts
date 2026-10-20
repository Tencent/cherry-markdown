/** Build-bundled Cherry helpers; signatures kept at the integration boundary. */
export const image: {
  processExtendAttributesInAlt(alt: string): string;
  processExtendStyleInAlt(alt: string): { extendStyles: string; extendClasses: string };
  $getAlignment(alt: string): string;
};
export function isValidScheme(url: string): boolean;
export function encodeURIOnce(url: string): string;
export function copyToClip(text?: string, html?: string): Promise<void>;
