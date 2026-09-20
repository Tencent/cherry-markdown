import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import defaultExport, {
  cherryMilkdown,
  supportsTextFormatting,
  type CherryDiagramRenderContext,
  type CherryEngineInput,
  type CherryEngineLike,
  type CherryMilkdownChange,
  type CherryMilkdownErrorPhase,
  type CherryMilkdownFileUpload,
  type CherryMilkdownFileUploadContext,
  type CherryMilkdownFileUploadParams,
  type CherryMilkdownInstance,
  type CherryMilkdownMathliveOptions,
  type CherryMilkdownOptions,
  type CherryMilkdownTheme,
  type CherryVisualRenderContext,
  type CherryVisualRenderer,
  type CherryVisualRendererResult,
} from '../src';
import { echarts, tableChart } from '../src/renderers/echarts';

type StablePublicTypes = {
  engine: CherryEngineLike;
  engineInput: CherryEngineInput;
  diagramContext: CherryDiagramRenderContext;
  errorPhase: CherryMilkdownErrorPhase;
  uploadContext: CherryMilkdownFileUploadContext;
  uploadParams: CherryMilkdownFileUploadParams;
  mathlive: CherryMilkdownMathliveOptions;
  visualContext: CherryVisualRenderContext;
  renderer: CherryVisualRenderer;
  rendererResult: CherryVisualRendererResult;
};

describe('public API compatibility contract', () => {
  it('keeps the documented runtime entry points available', () => {
    expect(defaultExport).toBe(cherryMilkdown);
    expect(cherryMilkdown).toBeTypeOf('function');
    expect(supportsTextFormatting).toBeTypeOf('function');
    expect(echarts).toBeTypeOf('function');
    expect(tableChart).toBeTypeOf('function');
  });

  it('keeps the published subpath exports stable', () => {
    const manifest = JSON.parse(readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };
    expect(Object.keys(manifest.exports)).toEqual(
      expect.arrayContaining(['.', './style.css', './echarts', './package.json']),
    );
  });

  it('accepts the stable option, callback and instance shapes', () => {
    const uploadWithLegacyArity: CherryMilkdownFileUpload = (_file, done) => done('image.png');
    const options = {
      root: '#editor',
      value: '# Stable',
      readonly: false,
      bubble: true,
      theme: 'dark',
      fileUpload: uploadWithLegacyArity,
      onChange: (_change: CherryMilkdownChange) => undefined,
    } satisfies CherryMilkdownOptions;
    const { theme }: { theme: CherryMilkdownTheme } = options;

    expectTypeOf(cherryMilkdown).parameter(0).toMatchTypeOf<CherryMilkdownOptions>();
    expectTypeOf(cherryMilkdown).returns.resolves.toMatchTypeOf<CherryMilkdownInstance>();
    expectTypeOf<StablePublicTypes>().toBeObject();
    expectTypeOf(theme).toMatchTypeOf<CherryMilkdownTheme>();
    expect(options.fileUpload).toBe(uploadWithLegacyArity);
  });
});
