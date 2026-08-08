import { describe, expect, it, vi } from 'vite-plus/test';
import { CherryStatic } from '../../src/CherryStatic';
import { HOOKS_TYPE_LIST } from '../../src/core/SyntaxBase';
import TapdTablePlugin from '../../src/addons/advance/cherry-tapd-table-plugin';
import TapdHtmlTagPlugin from '../../src/addons/advance/cherry-tapd-html-tag-plugin';
import TapdCheckListPlugin from '../../src/addons/advance/cherry-tapd-checklist-plugin';
import EChartsCodeBlockEngine from '../../src/addons/advance/cherry-codeblock-echarts-plugin';

describe('core/CherryStatic', () => {
  it('exposes hook factories, constants, bundled plugins, and version metadata', () => {
    expect(CherryStatic.createSyntaxHook).toBeTypeOf('function');
    expect(CherryStatic.createMenuHook).toBeTypeOf('function');
    expect(CherryStatic.constants.HOOKS_TYPE_LIST).toBe(HOOKS_TYPE_LIST);
    expect(CherryStatic.plugins).toMatchObject({
      TapdTablePlugin,
      TapdHtmlTagPlugin,
      TapdCheckListPlugin,
      EChartsCodeBlockEngine,
    });
    expect(CherryStatic.VERSION).toBeTypeOf('string');
  });

  it('cannot be instantiated or used to install plugins directly', () => {
    const plugin = { $cherry$mounted: false, install: vi.fn() };

    expect(() => new CherryStatic()).toThrow('CherryStatic cannot be instantiated directly');
    expect(() => CherryStatic.usePlugin(plugin)).toThrow('usePlugin` is not allowed');
    expect(plugin.install).not.toHaveBeenCalled();
  });

  it('installs each plugin once with defaults and caller arguments', () => {
    class TestCherry extends CherryStatic {}
    const defaults = { engine: { syntax: {} } };
    Object.defineProperty(TestCherry, 'config', { value: { defaults } });
    Object.defineProperty(TestCherry, 'initialized', { configurable: true, writable: true, value: false });
    const plugin = { $cherry$mounted: false, install: vi.fn() };

    expect(() => new TestCherry()).not.toThrow();
    TestCherry.usePlugin(plugin, 'first', { enabled: true });
    TestCherry.usePlugin(plugin, 'ignored');

    expect(plugin.install).toHaveBeenCalledOnce();
    expect(plugin.install).toHaveBeenCalledWith(defaults, 'first', { enabled: true });
    expect(plugin.install.mock.instances[0]).toBe(plugin);
    expect(plugin.$cherry$mounted).toBe(true);
  });

  it('rejects plugin installation after a subclass has initialized', () => {
    class InitializedCherry extends CherryStatic {}
    Object.defineProperty(InitializedCherry, 'initialized', { value: true });
    Object.defineProperty(InitializedCherry, 'config', { value: { defaults: {} } });
    const plugin = { $cherry$mounted: false, install: vi.fn() };

    expect(() => InitializedCherry.usePlugin(plugin)).toThrow('should be called before Cherry is instantiated');
    expect(plugin.install).not.toHaveBeenCalled();
  });
});
