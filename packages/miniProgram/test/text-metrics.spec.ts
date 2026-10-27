// @vitest-environment node
import { afterEach, expect, it, vi } from 'vite-plus/test';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
it('uses and reuses native text metrics for intrinsic widths and baseline spacing', async () => {
  vi.resetModules();
  const measureText = vi.fn(() => ({ width: 32, fontBoundingBoxAscent: 15, fontBoundingBoxDescent: 3 }));
  const create = vi.fn(() => ({ getContext: () => ({ font: '', measureText }) }));
  vi.stubGlobal('wx', { createOffscreenCanvas: create });
  const { nativeTextWidth, nativeCodeAfterGap } = await import('../src/native/text-metrics');
  expect(nativeTextWidth('汉字', '16px sans-serif', 16)).toBe(32);
  expect(nativeTextWidth('汉字', '16px sans-serif', 16)).toBe(32);
  expect(measureText).toHaveBeenCalledTimes(1);
  expect(nativeCodeAfterGap()).toBe(7);
  expect(nativeCodeAfterGap()).toBe(7);
  expect(measureText).toHaveBeenCalledTimes(2);
  expect(create).toHaveBeenCalledTimes(1);
});
it('has a bounded cache and falls back when extended font metrics are unavailable', async () => {
  vi.resetModules();
  const measureText = vi.fn(() => ({ width: 30 }));
  vi.stubGlobal('wx', { createOffscreenCanvas: () => ({ getContext: () => ({ font: '', measureText }) }) });
  const { nativeTextWidth, nativeCodeAfterGap } = await import('../src/native/text-metrics');
  for (let index = 0; index <= 1024; index++) nativeTextWidth(String(index), '16px sans-serif', 16);
  nativeTextWidth('0', '16px sans-serif', 16);
  expect(measureText).toHaveBeenCalledTimes(1026);
  expect(nativeCodeAfterGap()).toBe(5);
});

it('only measures new or changed cells during table streaming and releases removed entries', async () => {
  vi.resetModules();
  const measureText = vi.fn((text: string) => ({ width: text.length * 12 }));
  vi.stubGlobal('wx', { createOffscreenCanvas: () => ({ getContext: () => ({ font: '', measureText }) }) });
  const { nativeTableLayout } = await import('../src/native/table-layout');
  const measurements = new Map();
  const row = (text: string) => ({ cells: [{ header: false, inlines: [{ type: 'text' as const, text }] }] });
  const table = { type: 'table' as const, header: [], rows: [row('first'), row('second')] };
  nativeTableLayout(table, 350, 'default', 390, measurements);
  expect(measureText).toHaveBeenCalledTimes(2);
  nativeTableLayout(table, 350, 'default', 390, measurements);
  expect(measureText).toHaveBeenCalledTimes(2);
  table.rows.push(row('new'));
  nativeTableLayout(table, 350, 'default', 390, measurements);
  expect(measureText).toHaveBeenCalledTimes(3);
  expect(measurements.size).toBe(3);
  table.rows.pop();
  nativeTableLayout(table, 350, 'default', 390, measurements);
  expect(measurements.size).toBe(2);
});
