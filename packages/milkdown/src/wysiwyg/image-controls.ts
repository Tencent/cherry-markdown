import { NodeSelection, Plugin, TextSelection } from '@milkdown/kit/prose/state';
import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { $prose } from '@milkdown/kit/utils';
import type { CherryMilkdownFileUploadParams } from '../types.js';
import { imageAltText, imageLayoutState, replaceImageAltText, updateImageLayout } from '../native-layout.js';
import { cherryWysiwygConfigCtx } from './config.js';
import { isSafeImageSource } from './html-sanitizer.js';
import {
  createContextButton,
  createContextFrame,
  placeContextBubble,
  preserveContextSelection,
  setupContextBubble,
  watchContextViewport,
} from './contextual-ui.js';

function normalizeUploadParams(value: unknown): CherryMilkdownFileUploadParams {
  if (!value || typeof value !== 'object') return {};
  const input = value as Record<string, unknown>;
  const result: CherryMilkdownFileUploadParams = {};
  const name = input.name;
  if (typeof name === 'string') result.name = name;
  for (const key of ['width', 'height'] as const) {
    const field = input[key];
    if (typeof field === 'string' || (typeof field === 'number' && Number.isFinite(field))) result[key] = field;
  }
  for (const key of ['isBorder', 'isShadow', 'isRadius'] as const) {
    const field = input[key];
    if (typeof field === 'boolean') result[key] = field;
  }
  return result;
}

interface ResizeSession {
  pointerId: number;
  position: number;
  node: ProseNode;
  target: HTMLImageElement;
  handle: string;
  startX: number;
  startY: number;
  width: number;
  height: number;
  nextWidth: number;
  nextHeight: number;
  originalWidth: string;
  originalHeight: string;
  pausedAnimations: Map<Animation, string>;
  restoreFocus: boolean;
}

interface ImageAction {
  button: HTMLButtonElement;
  value: string;
}

/** Unknown effects are treated as geometric; opacity alone cannot move the anchor. */
function geometryAnimations(target: HTMLImageElement, includePaused = false) {
  return target.getAnimations().filter((animation) => {
    if (animation.playState !== 'running' && !(includePaused && animation.playState === 'paused')) return false;
    const effect = animation.effect as KeyframeEffect | null;
    if (!effect || typeof effect.getKeyframes !== 'function') return true;
    try {
      const properties = effect
        .getKeyframes()
        .flatMap((frame) => Object.keys(frame))
        .filter((name) => !['offset', 'computedOffset', 'easing', 'composite'].includes(name));
      return properties.length === 0 || properties.some((name) => name !== 'opacity');
    } catch {
      return true;
    }
  });
}

function isContinuousAnimation(animation: Animation) {
  try {
    return animation.effect?.getComputedTiming().endTime === Infinity;
  } catch {
    return false;
  }
}

function pausedAnimationSnapshot(target: HTMLImageElement) {
  return new Map(
    geometryAnimations(target, true)
      .filter((animation) => animation.playState === 'paused')
      .map((animation) => [animation, String(animation.currentTime)]),
  );
}

function isResizeTransition(animation: Animation, session: ResizeSession) {
  const property = (animation as Animation & { transitionProperty?: string }).transitionProperty;
  if (property !== 'width' && property !== 'height') return false;
  const expected = property === 'width' ? session.nextWidth : session.nextHeight;
  const inline = session.target.style.getPropertyValue(property);
  if (!inline || Math.abs(Number.parseFloat(inline) - expected) > 0.01) return false;
  const effect = animation.effect as KeyframeEffect | null;
  if (!effect || typeof effect.getKeyframes !== 'function') return false;
  try {
    const frames = effect.getKeyframes();
    const value = frames.at(-1)?.[property];
    return typeof value === 'string' && Math.abs(Number.parseFloat(value) - expected) <= 0.01;
  } catch {
    return false;
  }
}

function resizeAnimationChanged(session: ResizeSession) {
  const animations = geometryAnimations(session.target, true);
  if (animations.some((animation) => animation.playState === 'running' && !isResizeTransition(animation, session))) {
    return true;
  }
  const paused = new Map(
    animations
      .filter((animation) => animation.playState === 'paused')
      .map((animation) => [animation, String(animation.currentTime)]),
  );
  return (
    paused.size !== session.pausedAnimations.size ||
    [...paused].some(([animation, time]) => session.pausedAnimations.get(animation) !== time)
  );
}

function action(document: Document, label: string, value: string, icon: string): ImageAction {
  const { button } = createContextButton(document, {
    label,
    icon,
    className: 'img-tool-button',
    contentClassName: 'img-tool-icon',
  });
  button.dataset.imageAction = value;
  return { button, value };
}

/** One editor-local image controller. It never reads PreviewerBubble state. */
export const cherryImageControls = $prose((ctx) => {
  const config = ctx.get(cherryWysiwygConfigCtx.key);
  return new Plugin({
    view: (view) => {
      if (config.readonly) return {};
      const document = view.dom.ownerDocument;
      const host = view.dom.closest('.cherry-milkdown') ?? document.body;
      const frame = document.createElement('div');
      frame.className = 'cherry-previewer-img-size-handler cherry-milkdown-image-frame';
      frame.hidden = true;
      frame.setAttribute('aria-hidden', 'true');
      const handleNames = [
        'leftTop',
        'middleTop',
        'rightTop',
        'leftMiddle',
        'rightMiddle',
        'leftBottom',
        'middleBottom',
        'rightBottom',
      ];
      handleNames.forEach((name) => {
        const handle = document.createElement('span');
        handle.className = `cherry-previewer-img-size-handler__points cherry-previewer-img-size-handler__points-${name} cherry-milkdown-image-frame__handle is-${name}`;
        handle.dataset.resizeHandle = name;
        frame.append(handle);
      });

      const toolbar = document.createElement('div');
      toolbar.className = 'cherry-bubble cherry-previewer-img-tool-handler cherry-milkdown-image-controls';
      setupContextBubble(toolbar, '图片设置');
      toolbar.setAttribute('aria-keyshortcuts', 'Alt+F10');
      toolbar.title = 'Alt+F10 进入图片操作';
      const decorationActions = [
        action(document, '边框', 'border', 'ch-icon-imgDecoBorder'),
        action(document, '阴影', 'shadow', 'ch-icon-imgDecoShadow'),
        action(document, '圆角', 'radius', 'ch-icon-imgDecoRadius'),
      ];
      const alignmentActions = [
        action(document, '左对齐', 'left', 'ch-icon-imgAlignLeft'),
        action(document, '居中', 'center', 'ch-icon-imgAlignCenter'),
        action(document, '右对齐', 'right', 'ch-icon-imgAlignRight'),
        action(document, '浮动左对齐', 'float-left', 'ch-icon-imgAlignFloatLeft'),
        action(document, '浮动右对齐', 'float-right', 'ch-icon-imgAlignFloatRight'),
      ];
      const editAction = action(document, '编辑图片', 'source', 'ch-icon-edit');
      const actions = [...decorationActions, ...alignmentActions, editAction];
      const group = (items: ImageAction[]) => {
        const element = document.createElement('div');
        element.className = 'img-tool-group';
        element.append(...items.map(({ button }) => button));
        return element;
      };
      const divider = () => {
        const element = document.createElement('div');
        element.className = 'img-tool-divider';
        return element;
      };
      toolbar.append(group(decorationActions), divider(), group(alignmentActions), divider(), group([editAction]));

      const form = document.createElement('form');
      form.className = 'cherry-milkdown-context-form cherry-milkdown-image-source';
      form.hidden = true;
      form.setAttribute('role', 'dialog');
      form.setAttribute('aria-label', '编辑图片');
      const altLabel = document.createElement('label');
      altLabel.textContent = '替代文本';
      const alt = document.createElement('input');
      alt.className = 'cherry-milkdown-context-form__input';
      alt.name = 'alt';
      alt.placeholder = '替代文本';
      alt.setAttribute('aria-label', '图片替代文本');
      altLabel.append(alt);
      const sourceLabel = document.createElement('label');
      sourceLabel.textContent = '图片地址';
      const sourceRow = document.createElement('span');
      sourceRow.className = 'cherry-milkdown-image-source__row';
      const source = document.createElement('input');
      source.className = 'cherry-milkdown-context-form__input';
      source.name = 'source';
      source.placeholder = '图片地址';
      source.setAttribute('aria-label', '图片地址');
      sourceRow.append(source);
      const choose = document.createElement('button');
      choose.type = 'button';
      choose.className = 'cherry-toolbar-button';
      choose.textContent = '选择图片';
      choose.hidden = !config.fileUpload;
      sourceRow.append(choose);
      sourceLabel.append(sourceRow);
      const file = document.createElement('input');
      file.type = 'file';
      file.accept = 'image/*';
      file.hidden = true;
      file.tabIndex = -1;
      const uploadStatus = document.createElement('div');
      uploadStatus.className = 'cherry-milkdown-image-source__status';
      uploadStatus.setAttribute('role', 'status');
      uploadStatus.setAttribute('aria-live', 'polite');
      uploadStatus.hidden = true;
      const formActions = document.createElement('div');
      formActions.className = 'cherry-milkdown-image-source__actions';
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'cherry-toolbar-button';
      cancel.textContent = '取消';
      const save = document.createElement('button');
      save.type = 'submit';
      save.className = 'cherry-toolbar-button is-primary';
      save.textContent = '保存';
      formActions.append(cancel, save);
      form.append(altLabel, sourceLabel, uploadStatus, formActions, file);
      host.append(frame, toolbar, form);

      let activePosition = -1;
      let dismissed = false;
      let activeTarget: HTMLImageElement | undefined;
      let sourceOpen = false;
      let sourceNode: ProseNode | undefined;
      let resize: ResizeSession | undefined;
      let transitionFrame: number | undefined;
      let animationWatchFrame: number | undefined;
      let focusActionFrame: number | undefined;
      let focusAnimationCleanup: (() => void) | undefined;
      let layoutTransitionPending = false;
      let uploadSession = 0;
      let uploadController: AbortController | undefined;
      let pendingUploadParams: CherryMilkdownFileUploadParams | undefined;
      let targetObserver: ResizeObserver | undefined;

      const activeNode = () => (activePosition >= 0 ? view.state.doc.nodeAt(activePosition) : undefined);
      const syncActions = () => {
        const node = activeNode();
        const state = imageLayoutState(String(node?.attrs.alt ?? ''));
        actions.forEach(({ button, value }) => {
          let active = state.alignment === value;
          if (value === 'source') active = sourceOpen;
          else if (value === 'border' || value === 'shadow' || value === 'radius') active = state[value];
          button.classList.toggle('active', active);
          button.classList.toggle('is-active', active);
          if (value === 'source') button.setAttribute('aria-expanded', String(sourceOpen));
          else button.setAttribute('aria-pressed', String(active));
        });
      };
      const releaseTarget = () => {
        if (transitionFrame !== undefined) cancelAnimationFrame(transitionFrame);
        transitionFrame = undefined;
        if (animationWatchFrame !== undefined) cancelAnimationFrame(animationWatchFrame);
        animationWatchFrame = undefined;
        layoutTransitionPending = false;
        if (activeTarget) {
          activeTarget.removeEventListener('transitionrun', trackTransitionPosition);
          activeTarget.removeEventListener('transitionend', schedulePlace);
          activeTarget.removeEventListener('transitioncancel', schedulePlace);
        }
        targetObserver?.disconnect();
      };
      const setActiveTarget = (target: HTMLImageElement | undefined) => {
        if (target === activeTarget) return;
        releaseTarget();
        activeTarget = target;
        if (!target) return;
        target.addEventListener('transitionrun', trackTransitionPosition);
        target.addEventListener('transitionend', schedulePlace);
        target.addEventListener('transitioncancel', schedulePlace);
        // CSS and Web Animations can start after selection without a DOM
        // mutation or resize event. Observe only the selected image, and stop
        // as soon as that target is released.
        let wasAnimating = false;
        let pausedRect: { left: number; top: number; width: number; height: number } | undefined;
        const watchAnimations = () => {
          animationWatchFrame = undefined;
          if (activeTarget !== target || !target.isConnected) return;
          const animations = geometryAnimations(target, true);
          const animating = animations.some((animation) => animation.playState === 'running');
          const paused = animations.some((animation) => animation.playState === 'paused');
          let reposition = animating || wasAnimating;
          if (resize && resizeAnimationChanged(resize)) {
            cancelResizeForAnimation();
            reposition = true;
          }
          if (paused) {
            const { left, top, width, height } = target.getBoundingClientRect();
            if (
              !pausedRect ||
              left !== pausedRect.left ||
              top !== pausedRect.top ||
              width !== pausedRect.width ||
              height !== pausedRect.height
            )
              reposition = true;
            pausedRect = { left, top, width, height };
          } else if (pausedRect) {
            pausedRect = undefined;
            reposition = true;
          }
          if (reposition) place();
          wasAnimating = animating;
          animationWatchFrame = requestAnimationFrame(watchAnimations);
        };
        animationWatchFrame = requestAnimationFrame(watchAnimations);
        if (typeof ResizeObserver !== 'undefined') {
          targetObserver ??= new ResizeObserver(schedulePlace);
          targetObserver.observe(target);
        }
      };
      const cancelResize = () => {
        if (!resize) return;
        resize.target.style.width = resize.originalWidth;
        resize.target.style.height = resize.originalHeight;
        resize = undefined;
      };
      const cancelResizeForAnimation = () => {
        if (!resize) return;
        const restoreFocus = resize.restoreFocus;
        cancelResize();
        const focused = document.activeElement;
        if (
          restoreFocus &&
          (!focused ||
            focused === document.body ||
            focused === document.documentElement ||
            focused === view.dom ||
            toolbar.contains(focused) ||
            frame.contains(focused))
        )
          view.focus();
      };
      const cancelPendingFocus = () => {
        if (focusActionFrame !== undefined) cancelAnimationFrame(focusActionFrame);
        focusActionFrame = undefined;
        focusAnimationCleanup?.();
        focusAnimationCleanup = undefined;
      };
      const hide = () => {
        cancelPendingFocus();
        uploadSession += 1;
        uploadController?.abort();
        uploadController = undefined;
        placementFrame.cancel();
        releaseTarget();
        activePosition = -1;
        activeTarget = undefined;
        sourceOpen = false;
        sourceNode = undefined;
        cancelResize();
        frame.hidden = true;
        toolbar.hidden = true;
        form.hidden = true;
        syncActions();
      };
      const placeSource = () => {
        if (!sourceOpen || !activeTarget?.isConnected) return;
        const rect = activeTarget.getBoundingClientRect();
        const viewport = document.documentElement;
        const width = Math.max(0, Math.min(480, viewport.clientWidth - 16));
        form.style.width = `${width}px`;
        const below = rect.bottom + 8;
        const preferredTop =
          below + form.offsetHeight <= viewport.clientHeight - 8 ? below : rect.top - form.offsetHeight - 8;
        form.style.left = `${Math.max(8, Math.min(rect.left, viewport.clientWidth - width - 8))}px`;
        form.style.top = `${Math.max(8, Math.min(preferredTop, viewport.clientHeight - form.offsetHeight - 8))}px`;
      };
      const place = () => {
        if (!activeTarget?.isConnected || layoutTransitionPending) return;
        const animations = geometryAnimations(activeTarget);
        const continuous = animations.some(isContinuousAnimation);
        if (sourceOpen) {
          placeSource();
          return;
        }
        if (!resize && animations.some((animation) => !isContinuousAnimation(animation))) {
          frame.hidden = true;
          toolbar.hidden = true;
          return;
        }
        const rect = activeTarget.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        if (rect.bottom <= 0 || rect.top >= viewportHeight || rect.right <= 0 || rect.left >= viewportWidth) {
          frame.hidden = true;
          toolbar.hidden = true;
          return;
        }
        // A moving resize handle would change the pointer-to-image geometry
        // during a drag. Keep the tracked toolbar usable without exposing it.
        frame.hidden = continuous;
        toolbar.hidden = false;
        Object.assign(frame.style, {
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        });
        placeContextBubble(toolbar, rect, { bounds: 'both' });
      };
      const placementFrame = createContextFrame(place);
      function schedulePlace() {
        placementFrame.schedule();
      }
      function trackTransitionPosition() {
        if (!activeTarget) return;
        // Cherry transitions image layout changes. Keep stale fixed controls
        // non-interactive until the image reaches its final viewport position.
        layoutTransitionPending = true;
        frame.hidden = true;
        toolbar.hidden = true;
        if (transitionFrame !== undefined) return;
        const target = activeTarget;
        let stableFrames = 0;
        const sync = () => {
          transitionFrame = undefined;
          if (activeTarget !== target || !target.isConnected) {
            layoutTransitionPending = false;
            place();
            return;
          }
          if (geometryAnimations(target).some((animation) => !isContinuousAnimation(animation))) {
            stableFrames = 0;
            transitionFrame = requestAnimationFrame(sync);
          } else {
            stableFrames += 1;
            if (stableFrames < 2) {
              // Give the browser a frame to materialize transitions scheduled by
              // the just-dispatched Milkdown transaction before exposing handles.
              transitionFrame = requestAnimationFrame(sync);
            } else {
              layoutTransitionPending = false;
              place();
            }
          }
        };
        transitionFrame = requestAnimationFrame(sync);
      }
      const update = () => {
        if (!(view.state.selection instanceof NodeSelection) || view.state.selection.node.type.name !== 'image') {
          dismissed = false;
          hide();
          return;
        }
        if (dismissed) return;
        if (sourceOpen && sourceNode && !sourceNode.eq(view.state.selection.node)) {
          hide();
          return;
        }
        activePosition = view.state.selection.from;
        const dom = view.nodeDOM(activePosition);
        if (dom instanceof HTMLImageElement) setActiveTarget(dom);
        else if (dom instanceof Element) setActiveTarget(dom.querySelector('img') ?? undefined);
        else setActiveTarget(undefined);
        if (!activeTarget) return hide();
        if (resize) {
          if (!resize.node.eq(view.state.selection.node)) cancelResize();
          else {
            resize.position = activePosition;
            if (resize.target !== activeTarget) {
              resize.target = activeTarget;
              resize.originalWidth = activeTarget.style.width;
              resize.originalHeight = activeTarget.style.height;
              activeTarget.style.width = `${resize.nextWidth}px`;
              activeTarget.style.height = `${resize.nextHeight}px`;
            }
          }
        }
        syncActions();
        if (!sourceOpen) schedulePlace();
      };
      const commitLayout = (change: { type?: string; width?: number; height?: number }) => {
        const node = activeNode();
        if (node?.type.name !== 'image') return;
        const alt = updateImageLayout(String(node.attrs.alt ?? ''), change);
        const transaction = view.state.tr.setNodeMarkup(activePosition, undefined, { ...node.attrs, alt });
        view.dispatch(transaction.setSelection(NodeSelection.create(transaction.doc, activePosition)));
        view.focus();
      };
      const openSource = () => {
        const node = activeNode();
        if (!node || !activeTarget) return;
        sourceOpen = true;
        sourceNode = node;
        frame.hidden = true;
        toolbar.hidden = true;
        alt.value = imageAltText(String(node.attrs.alt ?? ''));
        source.value = String(node.attrs.src ?? '');
        source.removeAttribute('aria-invalid');
        pendingUploadParams = undefined;
        uploadStatus.hidden = true;
        uploadStatus.textContent = '';
        choose.disabled = false;
        save.disabled = false;
        form.hidden = false;
        placeSource();
        syncActions();
        source.focus({ preventScroll: true });
      };
      const closeSource = (restore = true) => {
        uploadSession += 1;
        uploadController?.abort();
        uploadController = undefined;
        sourceOpen = false;
        sourceNode = undefined;
        form.hidden = true;
        source.removeAttribute('aria-invalid');
        file.value = '';
        pendingUploadParams = undefined;
        uploadStatus.hidden = true;
        uploadStatus.textContent = '';
        choose.disabled = false;
        save.disabled = false;
        syncActions();
        if (restore) {
          view.focus();
          schedulePlace();
        }
      };
      const onAction = (event: MouseEvent) => {
        event.preventDefault();
        const value = (event.currentTarget as HTMLButtonElement).dataset.imageAction;
        if (value === 'source') openSource();
        else if (value) {
          const state = imageLayoutState(String(activeNode()?.attrs.alt ?? ''));
          const type = state.alignment === value ? 'clear-align' : value;
          if (['left', 'center', 'right', 'float-left', 'float-right', 'clear-align'].includes(type)) {
            trackTransitionPosition();
          }
          commitLayout({ type });
        }
      };
      const onSubmit = (event: SubmitEvent) => {
        event.preventDefault();
        if (config.isDestroyed?.()) return;
        const node = activeNode();
        if (node?.type.name !== 'image') return;
        if (!source.value.trim()) {
          source.setAttribute('aria-invalid', 'true');
          uploadStatus.hidden = false;
          uploadStatus.textContent = '请输入图片地址。';
          source.focus({ preventScroll: true });
          schedulePlace();
          return;
        }
        if (!isSafeImageSource(source.value.trim())) {
          source.setAttribute('aria-invalid', 'true');
          uploadStatus.hidden = false;
          uploadStatus.textContent = '图片地址不安全，请修改。';
          source.focus({ preventScroll: true });
          schedulePlace();
          return;
        }
        let nextAlt = replaceImageAltText(String(node.attrs.alt ?? ''), alt.value);
        if (pendingUploadParams?.width !== undefined || pendingUploadParams?.height !== undefined) {
          nextAlt = updateImageLayout(nextAlt, {
            width: pendingUploadParams.width ?? 'auto',
            height: pendingUploadParams.height ?? 'auto',
          });
        }
        const uploadDecorations = [
          ['border', pendingUploadParams?.isBorder],
          ['shadow', pendingUploadParams?.isShadow],
          ['radius', pendingUploadParams?.isRadius],
        ] as const;
        uploadDecorations.forEach(([type, enabled]) => {
          if (enabled && !imageLayoutState(nextAlt)[type]) nextAlt = updateImageLayout(nextAlt, { type });
        });
        const transaction = view.state.tr.setNodeMarkup(activePosition, undefined, {
          ...node.attrs,
          alt: nextAlt,
          src: source.value.trim(),
        });
        // Close before dispatch: the transaction changes the image itself and
        // must not be mistaken for an external replacement of the open form.
        closeSource(false);
        view.dispatch(transaction.setSelection(NodeSelection.create(transaction.doc, activePosition)));
        view.focus();
        schedulePlace();
      };
      const onCancel = () => closeSource();
      const chooseImage = () => file.click();
      const onSourceInput = () => {
        source.removeAttribute('aria-invalid');
        pendingUploadParams = undefined;
        if (uploadController) {
          uploadSession += 1;
          const controller = uploadController;
          uploadController = undefined;
          controller.abort();
          choose.disabled = false;
          save.disabled = false;
          uploadStatus.hidden = false;
          uploadStatus.textContent = '已取消上传，使用手动输入的地址。';
        } else {
          uploadStatus.hidden = true;
          uploadStatus.textContent = '';
        }
        schedulePlace();
      };
      const onFileChange = () => {
        if (config.isDestroyed?.()) return;
        const selected = file.files?.[0];
        file.value = '';
        if (!selected || !config.fileUpload || !sourceOpen) return;
        source.removeAttribute('aria-invalid');
        uploadSession += 1;
        uploadController?.abort();
        uploadController = new AbortController();
        const controller = uploadController;
        const session = uploadSession;
        const uploadNode = activeNode();
        choose.disabled = true;
        save.disabled = true;
        uploadStatus.hidden = false;
        uploadStatus.textContent = `正在上传 ${selected.name}`;
        schedulePlace();
        let settled = false;
        let finishing = false;
        const finish = (url: string, params: CherryMilkdownFileUploadParams = {}) => {
          if (settled || finishing || config.isDestroyed?.()) return;
          if (typeof url !== 'string' || !url.trim()) {
            fail();
            return;
          }
          if (!sourceOpen || session !== uploadSession) return;
          const node = activeNode();
          if (node?.type.name !== 'image' || !uploadNode?.eq(node)) return;
          let uploadParams: CherryMilkdownFileUploadParams;
          try {
            finishing = true;
            uploadParams = normalizeUploadParams(params);
          } catch {
            finishing = false;
            fail();
            return;
          }
          finishing = false;
          if (settled || config.isDestroyed?.() || !sourceOpen || session !== uploadSession) return;
          const current = activeNode();
          if (current?.type.name !== 'image' || !uploadNode?.eq(current)) return;
          settled = true;
          source.value = url.trim();
          const safeSource = isSafeImageSource(source.value);
          if (safeSource) source.removeAttribute('aria-invalid');
          else source.setAttribute('aria-invalid', 'true');
          if (!alt.value.trim()) alt.value = uploadParams.name ?? selected.name.replace(/\.[^.]+$/, '');
          pendingUploadParams = uploadParams;
          uploadController = undefined;
          choose.disabled = false;
          save.disabled = false;
          uploadStatus.textContent = safeSource ? '图片上传完成，保存后生效。' : '图片地址不安全，请修改。';
          schedulePlace();
        };
        const fail = () => {
          if (settled || config.isDestroyed?.()) return;
          settled = true;
          const node = activeNode();
          if (!sourceOpen || session !== uploadSession || !node || !uploadNode?.eq(node)) return;
          choose.disabled = false;
          save.disabled = false;
          uploadController = undefined;
          uploadStatus.textContent = '图片上传失败，请重试。';
          schedulePlace();
        };
        try {
          void Promise.resolve(config.fileUpload(selected, finish, { signal: controller.signal })).catch(fail);
        } catch {
          fail();
        }
      };
      const beginResize = (event: PointerEvent) => {
        if (resize || !event.isPrimary || event.button !== 0) return;
        const target = event.target instanceof HTMLElement ? event.target : null;
        const handle = target?.dataset.resizeHandle;
        const node = activeNode();
        if (!handle || !activeTarget || node?.type.name !== 'image') return;
        event.preventDefault();
        const rect = activeTarget.getBoundingClientRect();
        resize = {
          pointerId: event.pointerId,
          position: activePosition,
          node,
          target: activeTarget,
          handle,
          startX: event.clientX,
          startY: event.clientY,
          width: rect.width,
          height: rect.height,
          nextWidth: rect.width,
          nextHeight: rect.height,
          originalWidth: activeTarget.style.width,
          originalHeight: activeTarget.style.height,
          pausedAnimations: pausedAnimationSnapshot(activeTarget),
          restoreFocus: view.hasFocus() || toolbar.contains(document.activeElement),
        };
        target.setPointerCapture(event.pointerId);
      };
      const moveResize = (event: PointerEvent) => {
        if (!resize || event.pointerId !== resize.pointerId) return;
        if (resizeAnimationChanged(resize)) {
          cancelResizeForAnimation();
          schedulePlace();
          return;
        }
        event.preventDefault();
        const dx = event.clientX - resize.startX;
        const dy = event.clientY - resize.startY;
        let horizontal = 0;
        let vertical = 0;
        if (resize.handle.startsWith('left')) horizontal = -dx;
        else if (resize.handle.startsWith('right')) horizontal = dx;
        if (resize.handle.endsWith('Top')) vertical = -dy;
        else if (resize.handle.endsWith('Bottom')) vertical = dy;
        if (!horizontal && !vertical) {
          resize.nextWidth = resize.width;
          resize.nextHeight = resize.height;
        } else if (horizontal) {
          resize.nextWidth = Math.max(16, resize.width + horizontal);
          resize.nextHeight = Math.max(16, resize.height * (resize.nextWidth / resize.width));
        } else if (vertical) {
          resize.nextHeight = Math.max(16, resize.height + vertical);
          resize.nextWidth = Math.max(16, resize.width * (resize.nextHeight / resize.height));
        }
        resize.target.style.width = `${resize.nextWidth}px`;
        resize.target.style.height = `${resize.nextHeight}px`;
        place();
      };
      const finishResize = (event: PointerEvent) => {
        if (!resize || event.pointerId !== resize.pointerId) return;
        if (resizeAnimationChanged(resize)) {
          cancelResizeForAnimation();
          schedulePlace();
          return;
        }
        if (resize.nextWidth === resize.width && resize.nextHeight === resize.height) {
          cancelResize();
          view.focus();
          schedulePlace();
          return;
        }
        const finished = resize;
        resize = undefined;
        activePosition = finished.position;
        setActiveTarget(finished.target);
        commitLayout({ width: finished.nextWidth, height: finished.nextHeight });
      };
      const onResizeCancel = (event: PointerEvent) => {
        if (!resize || event.pointerId !== resize.pointerId) return;
        cancelResize();
        schedulePlace();
      };
      const onOutside = (event: PointerEvent) => {
        cancelPendingFocus();
        if (!(event.target instanceof Node)) return;
        if (frame.contains(event.target) || toolbar.contains(event.target) || form.contains(event.target)) return;
        if (activeTarget?.contains(event.target)) return;
        if (activePosition < 0 && !sourceOpen) return;
        dismissed = !view.dom.contains(event.target);
        if (sourceOpen) closeSource(false);
        hide();
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (
          event.target === view.dom &&
          !event.isComposing &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          (event.key === 'ArrowRight' || event.key === 'ArrowLeft') &&
          view.state.selection instanceof TextSelection &&
          view.state.selection.empty
        ) {
          const { $from } = view.state.selection;
          const forward = event.key === 'ArrowRight';
          const adjacent = forward ? $from.nodeAfter : $from.nodeBefore;
          if (adjacent?.type.name === 'image') {
            const position = forward ? $from.pos : $from.pos - adjacent.nodeSize;
            event.preventDefault();
            view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, position)).scrollIntoView());
            return;
          }
        }
        if (
          event.target === view.dom &&
          !event.isComposing &&
          event.altKey &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          event.key === 'F10' &&
          view.state.selection instanceof NodeSelection &&
          view.state.selection.node.type.name === 'image'
        ) {
          event.preventDefault();
          dismissed = false;
          view.dispatch(view.state.tr.scrollIntoView());
          update();
          placementFrame.cancel();
          cancelPendingFocus();
          const position = view.state.selection.from;
          const selectedNode = view.state.selection.node;
          let noAnimationDeadline = performance.now() + 1000;
          const focusWhenReady = () => {
            focusActionFrame = undefined;
            if (
              !view.hasFocus() ||
              !(view.state.selection instanceof NodeSelection) ||
              view.state.selection.from !== position ||
              !view.state.selection.node.eq(selectedNode)
            ) {
              cancelPendingFocus();
              return;
            }
            place();
            if (!toolbar.hidden) {
              cancelPendingFocus();
              actions[0].button.focus({ preventScroll: true });
              return;
            }
            const animations = activeTarget
              ? geometryAnimations(activeTarget).filter((animation) => !isContinuousAnimation(animation))
              : [];
            if (animations.length) {
              const wake = () => {
                focusAnimationCleanup?.();
                focusAnimationCleanup = undefined;
                noAnimationDeadline = performance.now() + 1000;
                focusActionFrame = requestAnimationFrame(focusWhenReady);
              };
              focusAnimationCleanup = () => {
                animations.forEach((animation) => {
                  animation.removeEventListener('finish', wake);
                  animation.removeEventListener('cancel', wake);
                });
              };
              animations.forEach((animation) => {
                animation.addEventListener('finish', wake);
                animation.addEventListener('cancel', wake);
              });
            } else if (performance.now() < noAnimationDeadline) {
              focusActionFrame = requestAnimationFrame(focusWhenReady);
            } else {
              cancelPendingFocus();
            }
          };
          focusWhenReady();
          return;
        }
        if (
          event.key !== 'Escape' ||
          !(event.target instanceof Node) ||
          !(event.target === view.dom || toolbar.contains(event.target) || form.contains(event.target)) ||
          (!sourceOpen && activePosition < 0)
        )
          return;
        event.preventDefault();
        if (sourceOpen) closeSource();
        else {
          const restoreFocus = toolbar.contains(event.target);
          hide();
          if (restoreFocus) view.focus();
        }
      };
      const onImageClick = (event: MouseEvent) => {
        if (event.button !== 0 || !(event.target instanceof HTMLImageElement)) return;
        // Firefox may leave a previously selected image unselected when the
        // editor regains focus. Restrict this to actual image schema nodes.
        const position = view.posAtDOM(event.target, 0);
        const node = view.state.doc.nodeAt(position);
        if (node?.type.name !== 'image' || view.nodeDOM(position) !== event.target) return;
        dismissed = false;
        if (view.state.selection instanceof NodeSelection && view.state.selection.from === position) {
          update();
          return;
        }
        view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, position)));
      };
      const onViewportChange = () => {
        schedulePlace();
      };
      const onEditorFocus = () => {
        dismissed = false;
      };
      const onEditorBlur = () => cancelPendingFocus();

      toolbar.addEventListener('pointerdown', preserveContextSelection);
      view.dom.addEventListener('click', onImageClick);
      view.dom.addEventListener('focus', onEditorFocus);
      view.dom.addEventListener('blur', onEditorBlur);
      actions.forEach(({ button }) => button.addEventListener('click', onAction));
      frame.addEventListener('pointerdown', beginResize);
      document.addEventListener('pointermove', moveResize, true);
      document.addEventListener('pointerup', finishResize, true);
      document.addEventListener('pointercancel', onResizeCancel, true);
      document.addEventListener('pointerdown', onOutside, true);
      document.addEventListener('keydown', onKeyDown, true);
      const releaseViewport = watchContextViewport(document, onViewportChange);
      form.addEventListener('submit', onSubmit);
      source.addEventListener('input', onSourceInput);
      cancel.addEventListener('click', onCancel);
      choose.addEventListener('click', chooseImage);
      file.addEventListener('change', onFileChange);

      return {
        update,
        destroy: () => {
          cancelPendingFocus();
          actions.forEach(({ button }) => button.removeEventListener('click', onAction));
          uploadSession += 1;
          uploadController?.abort();
          uploadController = undefined;
          cancelResize();
          placementFrame.cancel();
          releaseTarget();
          targetObserver?.disconnect();
          toolbar.removeEventListener('pointerdown', preserveContextSelection);
          view.dom.removeEventListener('click', onImageClick);
          view.dom.removeEventListener('focus', onEditorFocus);
          view.dom.removeEventListener('blur', onEditorBlur);
          frame.removeEventListener('pointerdown', beginResize);
          document.removeEventListener('pointermove', moveResize, true);
          document.removeEventListener('pointerup', finishResize, true);
          document.removeEventListener('pointercancel', onResizeCancel, true);
          document.removeEventListener('pointerdown', onOutside, true);
          document.removeEventListener('keydown', onKeyDown, true);
          releaseViewport();
          form.removeEventListener('submit', onSubmit);
          source.removeEventListener('input', onSourceInput);
          cancel.removeEventListener('click', onCancel);
          choose.removeEventListener('click', chooseImage);
          file.removeEventListener('change', onFileChange);
          frame.remove();
          toolbar.remove();
          form.remove();
        },
      };
    },
  });
});
