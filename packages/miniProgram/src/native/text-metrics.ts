import { cherryThemes } from 'cherry-markdown/theme';
import type { NativeTextContext } from '../components/platform';

let context: NativeTextContext | undefined;
const widths = new Map<string, number>();
const gaps = new Map<string, number>();
export function nativeTypography(theme = 'default') {
  const tokens =
    cherryThemes[
      Object.prototype.hasOwnProperty.call(cherryThemes, theme) ? (theme as keyof typeof cherryThemes) : 'default'
    ];
  const fontSize = parseFloat(tokens['--font-size-md']);
  return {
    fontSize,
    lineHeight: fontSize * parseFloat(tokens['--md-paragraph-line-height']),
    family: tokens['--font-family-sans'],
  };
}
/** One native offscreen 2D context for text metrics; the document remains WXML. */
function textContext(): NativeTextContext | undefined {
  if (!context && typeof wx !== 'undefined' && typeof wx.createOffscreenCanvas === 'function')
    context = wx.createOffscreenCanvas({ type: '2d', width: 1, height: 1 }).getContext('2d');
  return context;
}
export function nativeTextWidth(text: string, font: string, fontSize: number): number {
  const key = `${font}\n${text}`;
  const cached = widths.get(key);
  if (cached !== undefined) return cached;
  const canvas = textContext();
  if (canvas) canvas.font = font;
  const width =
    canvas?.measureText(text).width ??
    Array.from(text).reduce((sum, char) => sum + (char.codePointAt(0)! > 255 ? fontSize : fontSize * 0.6), 0);
  if (widths.size >= 1024) widths.clear();
  widths.set(key, width);
  return width;
}
/** Space below an inline block baseline, from its parent's font and line box. */
export function nativeCodeAfterGap(theme = 'default'): number {
  const { fontSize, lineHeight, family } = nativeTypography(theme);
  const key = `${fontSize}/${lineHeight}/${family}`;
  const cached = gaps.get(key);
  if (cached !== undefined) return cached;
  const canvas = textContext();
  if (canvas) {
    canvas.font = `${fontSize}px ${family}`;
    const metrics = canvas.measureText('Mg');
    const ascent = metrics.fontBoundingBoxAscent;
    const descent = metrics.fontBoundingBoxDescent;
    if (Number.isFinite(ascent) && Number.isFinite(descent) && ascent! + descent! > 0) {
      const gap = Math.max(0, (lineHeight - ascent! - descent!) / 2 + descent!);
      gaps.set(key, gap);
      return gap;
    }
  }
  return Math.max(0, (lineHeight - fontSize) / 2);
}
