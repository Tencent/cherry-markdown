/**
 * mermaid 预览操作框会话
 *
 * 维护说明：
 * - 编辑器解析、布局参数 → utils/mermaidEditorHelper
 * - 预览可见性、figure 查找 → utils/mermaidPreviewHelper
 * - 本类只负责会话状态、rebind、双控件位置同步与生命周期校验
 */

import imgSizeHandler from '@/utils/imgSizeHandler';
import imgToolHandler from '@/utils/imgToolHandler';
import { buildMermaidEditContext, findMermaidBlockIndexByCodeBody } from '@/utils/mermaidEditorHelper';
import { countMermaidFigures, getMermaidFigureByIndex, isMermaidPreviewVisible } from '@/utils/mermaidPreviewHelper';

export default class MermaidBubbleSession {
  /**
   * @param {import('./PreviewerBubble').default} host PreviewerBubble 实例
   */
  constructor(host) {
    this.host = host;
    this.reset();
  }

  /** 重置会话状态（移除操作框时调用） */
  reset() {
    this.anchorBody = '';
    this.anchorPreviewIndex = -1;
    this.previewIndex = -1;
    this.selfEditing = false;
    this.size = '';
    this.align = '';
    this.extendFrom = 0;
    this.extendTo = 0;
    this.hasExtend = false;
    this.langLineNum = -1;
    this.clearPositionSyncTimer();
    this.clearAsyncValidityTimer();
    this.clearPositionTransitionListener();
  }

  /** 当前是否处于 mermaid 操作框会话 */
  isActive() {
    const { bubbleHandler } = this.host;
    return bubbleHandler.click === imgSizeHandler && imgSizeHandler.isMermaid;
  }

  /**
   * 选中 mermaid 时初始化编辑上下文
   * @param {HTMLElement} figureElement
   * @returns {boolean}
   */
  beginEdit(figureElement) {
    const { previewerDom, editor } = this.host;
    if (!editor?.editor) {
      return false;
    }

    const allFigures = Array.from(previewerDom.querySelectorAll('figure[data-type="mermaid"]'));
    const previewIndex = allFigures.indexOf(figureElement);
    if (previewIndex < 0) {
      return false;
    }

    const rawContent = editor.editor.view.state.doc.toString();
    const context = buildMermaidEditContext(rawContent, previewIndex, editor.editor.view.state.doc);
    if (!context) {
      return false;
    }

    this.previewIndex = context.previewIndex;
    this.anchorBody = context.anchorBody;
    this.anchorPreviewIndex = context.previewIndex;
    this.langLineNum = context.langLineNum;
    this.extendFrom = context.extendFrom;
    this.extendTo = context.extendTo;
    this.size = context.size;
    this.align = context.align;
    this.hasExtend = context.hasExtend;

    if (this.hasExtend) {
      editor.editor.setSelection(this.extendFrom, this.extendTo);
    } else {
      editor.editor.setSelection(this.extendFrom, this.extendFrom);
    }

    return true;
  }

  /** 注入 handler 的校验/解析回调 */
  createHandlerOptions(onInvalidTarget) {
    return {
      onInvalidTarget,
      validateTarget: () => this.isValid({ strict: false }),
      resolveTarget: () => this.resolveFigure(),
    };
  }

  /** 绑定 imgSizeHandler 拖拽时同步方向控制器 */
  bindPositionFollow() {
    imgSizeHandler.onPositionUpdated = () => {
      if (this.host.bubbleHandler.imgTool !== imgToolHandler) {
        return;
      }
      imgToolHandler.refreshTarget();
      imgToolHandler.updatePosition();
    };
  }

  /** 清理 timer 与联动回调（imgSizeHandler.remove 时调用） */
  disposeHandlers() {
    this.clearPositionSyncTimer();
    imgSizeHandler.onPositionUpdated = null;
  }

  /**
   * 按编辑器源码锚点解析 index
   * @returns {number}
   */
  getEditorIndex() {
    const { editor } = this.host;
    if (!editor?.editor || !this.anchorBody) {
      return -1;
    }
    return findMermaidBlockIndexByCodeBody(
      editor.editor.view.state.doc.toString(),
      this.anchorBody,
      this.anchorPreviewIndex,
    );
  }

  /**
   * 预览刷新后 rebind figure
   * @returns {HTMLElement | null}
   */
  resolveFigure() {
    if (!imgSizeHandler.isMermaid) {
      return imgSizeHandler.img;
    }

    const editorIndex = this.getEditorIndex();
    if (editorIndex < 0) {
      return null;
    }

    this.previewIndex = editorIndex;
    const { previewerDom } = this.host;
    if (editorIndex >= countMermaidFigures(previewerDom)) {
      return null;
    }

    const current = getMermaidFigureByIndex(previewerDom, editorIndex);
    if (!current) {
      return null;
    }

    imgSizeHandler.img = current;
    if (this.host.bubbleHandler.imgTool === imgToolHandler) {
      imgToolHandler.img = current;
    }
    return current;
  }

  /**
   * 校验操作框是否仍有效
   * @param {{ strict?: boolean }} [options]
   * @returns {boolean}
   */
  isValid(options = {}) {
    const { strict = false } = options;
    if (imgSizeHandler.$isResizing()) {
      return true;
    }

    const editorIndex = this.getEditorIndex();
    const target = this.resolveFigure();

    if (!strict && this.selfEditing) {
      return editorIndex >= 0;
    }

    if (editorIndex < 0) {
      return false;
    }

    if (!target || !document.contains(target) || !this.host.previewerDom.contains(target)) {
      return false;
    }

    return isMermaidPreviewVisible(target, this.host.previewerDom);
  }

  /** 同步选择框与方向控制器位置 */
  applyHandlerPositions() {
    if (!imgSizeHandler.$isResizing()) {
      imgSizeHandler.updatePosition();
    }
    if (this.host.bubbleHandler.imgTool === imgToolHandler) {
      imgToolHandler.refreshTarget();
      imgToolHandler.updatePosition();
    }
  }

  clearPositionSyncTimer() {
    if (this.positionSyncTimer) {
      clearTimeout(this.positionSyncTimer);
      this.positionSyncTimer = null;
    }
  }

  clearAsyncValidityTimer() {
    if (this.asyncValidityTimer) {
      clearTimeout(this.asyncValidityTimer);
      this.asyncValidityTimer = null;
    }
  }

  clearPositionTransitionListener() {
    if (this.positionTransitionFigure && this.positionTransitionHandler) {
      this.positionTransitionFigure.removeEventListener('transitionend', this.positionTransitionHandler);
    }
    this.positionTransitionFigure = null;
    this.positionTransitionHandler = null;
  }

  /**
   * 等待 figure 过渡结束后统一更新位置
   * @param {() => void} [onInvalidTarget]
   */
  schedulePositionSync(onInvalidTarget) {
    if (!this.isActive() || imgSizeHandler.$isResizing()) {
      return;
    }

    imgSizeHandler.$clearPreviewUpdateTimer?.();
    this.clearPositionSyncTimer();
    this.clearPositionTransitionListener();

    const sync = () => {
      if (!this.isValid({ strict: false })) {
        (onInvalidTarget || this.host.$removeImgPreviewerBubbles.bind(this.host))();
        return;
      }
      this.applyHandlerPositions();
    };

    const figure = imgSizeHandler.img;
    if (!figure) {
      sync();
      return;
    }

    this.positionTransitionFigure = figure;
    this.positionTransitionHandler = sync;
    figure.addEventListener('transitionend', sync, { once: true });
    this.positionSyncTimer = setTimeout(() => {
      this.positionSyncTimer = null;
      sync();
    }, 120);
  }

  /** 预览 DOM 更新后 */
  onPreviewUpdate() {
    this.resolveFigure();
    this.schedulePositionSync(() => this.host.$removeImgPreviewerBubbles());
  }

  /** mermaid 异步渲染 patch DOM 后 */
  onAsyncRenderDone() {
    this.onPreviewUpdate();
    this.scheduleAsyncValidityCheck();
  }

  /**
   * fix(MermaidBubbleSession): 邻居块异步恢复会触发布局重排，延迟校验避免误关选中框
   * @param {number} [attempt]
   */
  scheduleAsyncValidityCheck(attempt = 0) {
    this.clearAsyncValidityTimer();
    const maxAttempts = 8;
    const delay = attempt === 0 ? 0 : 50;

    this.asyncValidityTimer = setTimeout(() => {
      this.asyncValidityTimer = null;
      if (!this.isActive()) {
        return;
      }
      this.resolveFigure();
      if (this.isValid({ strict: true })) {
        this.clearSelfEditingIfReady();
        return;
      }
      if (attempt >= maxAttempts) {
        this.host.$checkAndRemoveInvalidImgHandlers({ strict: true });
        return;
      }
      this.scheduleAsyncValidityCheck(attempt + 1);
    }, delay);
  }

  /** 布局编辑完成且 svg 可见时清除 selfEditing 标记 */
  clearSelfEditingIfReady() {
    if (!this.selfEditing || !this.isActive()) {
      this.selfEditing = false;
      return;
    }
    const target = this.resolveFigure();
    if (target && isMermaidPreviewVisible(target, this.host.previewerDom)) {
      this.selfEditing = false;
    }
  }

  /** 写入布局参数到编辑器语言行 */
  applyLayoutValue() {
    this.selfEditing = true;
    const { editor } = this.host;
    if (!editor?.editor) {
      return;
    }

    const value = [this.size, this.align].filter((v) => v).join(' ');

    if (this.hasExtend) {
      editor.editor.setSelection(this.extendFrom, this.extendTo);
      editor.editor.replaceSelection(value, 'around');
      this.extendTo = this.extendFrom + value.length;
    } else if (value) {
      editor.editor.setSelection(this.extendFrom, this.extendFrom);
      editor.editor.replaceSelection(` ${value}`, 'around');
      this.extendFrom += 1;
      this.extendTo = this.extendFrom + value.length;
      this.hasExtend = true;
    }
  }

  /** @param {{ width: number, height: number }} style */
  changeSize(style) {
    this.size = `#${Math.round(style.width)}px #${Math.round(style.height)}px`;
    this.applyLayoutValue();
  }

  /** @param {string} type */
  changeAlign(type) {
    switch (type) {
      case 'left':
      case 'right':
      case 'center':
      case 'float-left':
      case 'float-right':
        this.align = `#${type}`;
        break;
      case 'clear-align':
        this.align = '';
        break;
      default:
        return;
    }
    this.applyLayoutValue();
  }
}
