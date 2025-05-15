/**
 * 用于管理语法块异步渲染
 */
export default class AsyncRenderHandler {
  // 保存等待渲染的 sign
  pendingRenderers = new Set();
  // md 源码
  originMd = '';
  // 当前渲染结果，会随着异步渲染进行而更新
  md = '';

  /**
   * @param {import('../Cherry').default} cherry Cherry实例
   */
  constructor(cherry) {
    this.$cherry = cherry;
  }

  handleSyncRenderStart(md = '') {
    this.originMd = md;
  }

  handleSyncRenderCompleted(md = '') {
    this.md = md;
    // 如果没有异步渲染块，也要发起渲染完成事件。
    const immediate = this.pendingRenderers.size === 0;
    if (immediate) {
      this.handleAllCompleted();
    }
  }

  add(sign) {
    this.pendingRenderers.add(sign);
  }

  done(sign, { replacer = (v) => v } = {}) {
    if (!this.pendingRenderers.has(sign)) {
      return;
    }
    this.pendingRenderers.delete(sign);
    this.md = replacer(this.md);
    if (this.pendingRenderers.size === 0) {
      // 所有异步渲染块都渲染完成，发起渲染完成事件
      this.handleAllCompleted();
    }
  }

  clear() {
    this.pendingRenderers.clear();
    this.originMd = '';
    this.md = '';
  }

  handleAllCompleted() {
    if (!this.$cherry.$event) {
      // 使用 CherryEngine 时，没有 event 模块，手动调用 callbac
      this.$cherry.options.callback?.afterAsyncRender?.(this.originMd, this.md);
    } else {
      this.$cherry.$event.emit('afterAsyncRender', {
        markdownText: this.originMd,
        html: this.md,
      });
    }
  }
}
