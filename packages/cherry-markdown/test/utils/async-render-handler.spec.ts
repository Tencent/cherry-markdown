import { describe, it, expect, vi } from 'vitest';
import AsyncRenderHandler from '../../src/utils/async-render-handler';

describe('AsyncRenderHandler 工具函数', () => {
  describe('AsyncRenderHandler', () => {
    it('创建实例', () => {
      const cherry = {
        options: { callback: {} },
      };
      const handler = new AsyncRenderHandler(cherry);
      expect(handler).toBeInstanceOf(AsyncRenderHandler);
      expect(handler.$cherry).toBe(cherry);
      expect(handler.pendingRenderers.size).toBe(0);
    });

    it('handleSyncRenderStart 保存原始 md', () => {
      const cherry = { options: { callback: {} } };
      const handler = new AsyncRenderHandler(cherry);
      handler.handleSyncRenderStart('test markdown');
      expect(handler.originMd).toBe('test markdown');
    });

    it('handleSyncRenderCompleted 保存 md', () => {
      const cherry = { options: { callback: {} } };
      const handler = new AsyncRenderHandler(cherry);
      handler.handleSyncRenderCompleted('rendered html');
      expect(handler.md).toBe('rendered html');
    });

    it('没有异步渲染块时立即触发完成', () => {
      const callback = vi.fn();
      const cherry = {
        options: { callback: { afterAsyncRender: callback } },
      };
      const handler = new AsyncRenderHandler(cherry);
      handler.handleSyncRenderStart('test');
      handler.handleSyncRenderCompleted('html');
      expect(callback).toHaveBeenCalledWith('test', 'html');
    });

    it('添加异步渲染任务', () => {
      const cherry = { options: { callback: {} } };
      const handler = new AsyncRenderHandler(cherry);
      handler.add('sign1');
      expect(handler.pendingRenderers.size).toBe(1);
      handler.add('sign2');
      expect(handler.pendingRenderers.size).toBe(2);
    });

    it('完成异步渲染任务', () => {
      const callback = vi.fn();
      const cherry = {
        options: { callback: { afterAsyncRender: callback } },
      };
      const handler = new AsyncRenderHandler(cherry);
      handler.handleSyncRenderStart('test');
      handler.add('sign1');
      handler.done('sign1');
      expect(handler.pendingRenderers.size).toBe(0);
      expect(callback).toHaveBeenCalled();
    });

    it('完成不存在的任务不报错', () => {
      const cherry = { options: { callback: {} } };
      const handler = new AsyncRenderHandler(cherry);
      expect(() => handler.done('nonexistent')).not.toThrow();
    });

    it('使用 replacer 更新 md', () => {
      const callback = vi.fn();
      const cherry = {
        options: { callback: { afterAsyncRender: callback } },
      };
      const handler = new AsyncRenderHandler(cherry);
      handler.handleSyncRenderStart('test');
      handler.handleSyncRenderCompleted('original');
      handler.add('sign1');
      const replacer = vi.fn((md) => md.replace('original', 'updated'));
      handler.done('sign1', { replacer });
      expect(replacer).toHaveBeenCalledWith('original');
    });

    it('多个异步任务全部完成后触发回调', () => {
      const callback = vi.fn();
      const cherry = {
        options: { callback: { afterAsyncRender: callback } },
      };
      const handler = new AsyncRenderHandler(cherry);
      handler.handleSyncRenderStart('test');
      handler.add('sign1');
      handler.add('sign2');
      handler.add('sign3');
      handler.done('sign1');
      expect(callback).not.toHaveBeenCalled();
      handler.done('sign2');
      expect(callback).not.toHaveBeenCalled();
      handler.done('sign3');
      expect(callback).toHaveBeenCalled();
    });

    it('clear 清空所有状态', () => {
      const cherry = { options: { callback: {} } };
      const handler = new AsyncRenderHandler(cherry);
      handler.handleSyncRenderStart('test');
      handler.handleSyncRenderCompleted('html');
      handler.add('sign1');
      handler.add('sign2');
      handler.clear();
      expect(handler.pendingRenderers.size).toBe(0);
      expect(handler.originMd).toBe('');
      expect(handler.md).toBe('');
    });

    it('使用 $event 触发完成事件', () => {
      const emit = vi.fn();
      const cherry = {
        $event: { emit },
        options: { callback: {} },
      };
      const handler = new AsyncRenderHandler(cherry);
      handler.handleSyncRenderStart('test');
      handler.handleSyncRenderCompleted('html');
      expect(emit).toHaveBeenCalledWith('afterAsyncRender', {
        markdownText: 'test',
        html: 'html',
      });
    });
  });
});
