import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';
import type { CherryEditorInstance } from '../editorTypes';

/**
 * 判断当前编辑器是否处于"纯预览"模式
 * 仅当 status.editor === 'hide' 时才允许唤起大图预览
 */
const isPreviewOnlyMode = (editor: CherryEditorInstance): boolean => {
  return editor.status?.editor === 'hide';
};

/**
 * 从 img 元素中安全地取到真实图片地址
 * 兼容 cherry 懒加载：优先 data-src，其次 currentSrc / src
 */
const resolveImageUrl = (img: HTMLImageElement): string => {
  return img.dataset.src || img.currentSrc || img.src || '';
};

/**
 * 判断 img 是否为 cherry 内部特殊图片类型（如 drawio），需要跳过 viewer
 */
const isSpecialImage = (img: HTMLImageElement): boolean => {
  const { type } = img.dataset;
  return type === 'drawio';
};

interface LightboxHandle {
  /** 打开指定 img 的大图预览，成功返回 true */
  open(target: HTMLImageElement): boolean;
  /** 内容更新后刷新 viewer 内部图片列表 */
  refresh(): void;
  /** 销毁 viewer 实例 */
  destroy(): void;
}

/**
 * 基于 viewerjs 的图片大图预览封装
 * - 仅在纯预览模式（status.editor !== 'show'）下响应
 * - 兼容 cherry 懒加载：通过 url 回调优先读取 data-src
 * - 提供 refresh / destroy 供外部生命周期管理
 */
export const useImageLightbox = (editor: CherryEditorInstance): LightboxHandle | null => {
  const previewerDom = editor.previewer?.getDomContainer?.();
  if (!previewerDom) {
    return null;
  }

  const viewer = new Viewer(previewerDom, {
    // 关键：让 viewerjs 使用真实图片地址，绕过懒加载占位
    url(image: HTMLImageElement) {
      return resolveImageUrl(image);
    },
    // 不接管点击事件，我们通过 onClickPreview 主动调用 open()
    inline: false,
    navbar: true,
    toolbar: true,
    title: true,
    tooltip: true,
    movable: true,
    zoomable: true,
    rotatable: true,
    scalable: true,
    transition: true,
    keyboard: true,
    backdrop: true,
    zIndex: 9999,
    // 过滤掉 drawio 等特殊图片
    filter(image: HTMLImageElement) {
      return !isSpecialImage(image);
    },
  });

  // viewerjs 会自动为容器内 <img> 绑定点击事件；
  // 通过 show 事件在编辑模式下阻止打开，确保只在纯预览模式生效
  previewerDom.addEventListener('show', (event: Event) => {
    if (!isPreviewOnlyMode(editor)) {
      event.preventDefault();
    }
  });

  const open = (target: HTMLImageElement): boolean => {
    if (!isPreviewOnlyMode(editor)) {
      return false;
    }
    if (isSpecialImage(target)) {
      return false;
    }
    // 若目标图还处于懒加载占位状态，先把真实 src 打上去，提升首屏体验
    if (target.dataset.src && !target.src.includes(target.dataset.src)) {
      const realSrc = target.dataset.src;
      target.setAttribute('src', realSrc);
      target.removeAttribute('data-src');
    }

    // 由于 DOM 可能因内容更新而变化，每次打开前刷新一次列表
    viewer.update();
    const imgs = Array.from(previewerDom.querySelectorAll('img')).filter((img) => !isSpecialImage(img));
    const index = imgs.indexOf(target);
    if (index < 0) {
      return false;
    }
    viewer.view(index);
    return true;
  };

  const refresh = (): void => {
    try {
      viewer.update();
    } catch {
      // viewer 已销毁时 update 会抛错，忽略即可
    }
  };

  const destroy = (): void => {
    try {
      viewer.destroy();
    } catch {
      // ignore
    }
  };

  return { open, refresh, destroy };
};

/** 单例句柄，供 onClickPreview 全局访问 */
let currentLightbox: LightboxHandle | null = null;

export const setCurrentLightbox = (handle: LightboxHandle | null): void => {
  currentLightbox = handle;
};

export const getCurrentLightbox = (): LightboxHandle | null => currentLightbox;
