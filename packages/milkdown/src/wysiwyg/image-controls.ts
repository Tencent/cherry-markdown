import { NodeSelection, Plugin } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';
import type { CherryMilkdownFileUploadParams } from '../types.js';
import { imageAltText, imageLayoutState, replaceImageAltText, updateImageLayout } from '../native-layout.js';
import { cherryWysiwygConfigCtx } from './config.js';
import { createContextButton, setupContextBubble } from './contextual-ui.js';

interface ResizeSession {
  position: number;
  target: HTMLImageElement;
  handle: string;
  startX: number;
  startY: number;
  width: number;
  height: number;
  nextWidth: number;
  nextHeight: number;
}

interface ImageAction {
  button: HTMLButtonElement;
  value: string;
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
      let activeTarget: HTMLImageElement | undefined;
      let sourceOpen = false;
      let resize: ResizeSession | undefined;
      let positionFrame: number | undefined;
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
        if (activeTarget) activeTarget.removeEventListener('transitionend', schedulePlace);
        targetObserver?.disconnect();
      };
      const setActiveTarget = (target: HTMLImageElement | undefined) => {
        if (target === activeTarget) return;
        releaseTarget();
        activeTarget = target;
        if (!target) return;
        target.addEventListener('transitionend', schedulePlace);
        if (typeof ResizeObserver !== 'undefined') {
          targetObserver ??= new ResizeObserver(schedulePlace);
          targetObserver.observe(target);
        }
      };
      const hide = () => {
        uploadSession += 1;
        uploadController?.abort();
        uploadController = undefined;
        if (positionFrame !== undefined) cancelAnimationFrame(positionFrame);
        positionFrame = undefined;
        releaseTarget();
        activePosition = -1;
        activeTarget = undefined;
        sourceOpen = false;
        resize = undefined;
        frame.hidden = true;
        toolbar.hidden = true;
        form.hidden = true;
        syncActions();
      };
      const place = () => {
        positionFrame = undefined;
        if (!activeTarget?.isConnected || sourceOpen) return;
        const rect = activeTarget.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        if (rect.bottom <= 0 || rect.top >= viewportHeight || rect.right <= 0 || rect.left >= viewportWidth) {
          frame.hidden = true;
          toolbar.hidden = true;
          return;
        }
        frame.hidden = false;
        toolbar.hidden = false;
        Object.assign(frame.style, {
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        });
        const width = toolbar.offsetWidth;
        const height = toolbar.offsetHeight;
        toolbar.style.left = `${Math.max(8, Math.min(viewportWidth - width - 8, rect.left + rect.width / 2 - width / 2))}px`;
        toolbar.style.top = `${Math.max(8, Math.min(viewportHeight - height - 8, rect.top - height - 8 >= 8 ? rect.top - height - 8 : rect.bottom + 8))}px`;
      };
      function schedulePlace() {
        if (positionFrame !== undefined) cancelAnimationFrame(positionFrame);
        positionFrame = requestAnimationFrame(place);
      }
      const update = () => {
        if (!(view.state.selection instanceof NodeSelection) || view.state.selection.node.type.name !== 'image') {
          hide();
          return;
        }
        activePosition = view.state.selection.from;
        const dom = view.nodeDOM(activePosition);
        if (dom instanceof HTMLImageElement) setActiveTarget(dom);
        else if (dom instanceof Element) setActiveTarget(dom.querySelector('img') ?? undefined);
        else setActiveTarget(undefined);
        if (!activeTarget) return hide();
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
        frame.hidden = true;
        toolbar.hidden = true;
        alt.value = imageAltText(String(node.attrs.alt ?? ''));
        source.value = String(node.attrs.src ?? '');
        pendingUploadParams = undefined;
        uploadStatus.hidden = true;
        uploadStatus.textContent = '';
        choose.disabled = false;
        save.disabled = false;
        form.hidden = false;
        const rect = activeTarget.getBoundingClientRect();
        const width = Math.min(480, document.documentElement.clientWidth - 16);
        form.style.width = `${width}px`;
        form.style.left = `${Math.max(8, Math.min(rect.left, document.documentElement.clientWidth - width - 8))}px`;
        form.style.top = `${Math.min(document.documentElement.clientHeight - form.offsetHeight - 8, rect.bottom + 8)}px`;
        syncActions();
        source.focus({ preventScroll: true });
      };
      const closeSource = (restore = true) => {
        uploadSession += 1;
        uploadController?.abort();
        uploadController = undefined;
        sourceOpen = false;
        form.hidden = true;
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
          commitLayout({ type });
        }
      };
      const onSubmit = (event: SubmitEvent) => {
        event.preventDefault();
        const node = activeNode();
        if (node?.type.name !== 'image' || !source.value.trim()) return;
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
        view.dispatch(transaction.setSelection(NodeSelection.create(transaction.doc, activePosition)));
        closeSource();
      };
      const onCancel = () => closeSource();
      const chooseImage = () => file.click();
      const onFileChange = () => {
        const selected = file.files?.[0];
        file.value = '';
        if (!selected || !config.fileUpload || !sourceOpen) return;
        uploadSession += 1;
        uploadController?.abort();
        uploadController = new AbortController();
        const controller = uploadController;
        const session = uploadSession;
        const position = activePosition;
        choose.disabled = true;
        save.disabled = true;
        uploadStatus.hidden = false;
        uploadStatus.textContent = `正在上传 ${selected.name}`;
        let settled = false;
        const finish = (url: string, params: CherryMilkdownFileUploadParams = {}) => {
          if (settled) return;
          if (!url.trim()) {
            fail();
            return;
          }
          settled = true;
          if (!sourceOpen || session !== uploadSession || position !== activePosition) return;
          const node = activeNode();
          if (node?.type.name !== 'image') return;
          source.value = url.trim();
          if (!alt.value.trim()) alt.value = params.name ?? selected.name.replace(/\.[^.]+$/, '');
          pendingUploadParams = params;
          uploadController = undefined;
          choose.disabled = false;
          save.disabled = false;
          uploadStatus.textContent = '图片上传完成，保存后生效。';
        };
        const fail = () => {
          if (settled) return;
          settled = true;
          if (!sourceOpen || session !== uploadSession || position !== activePosition) return;
          choose.disabled = false;
          save.disabled = false;
          uploadController = undefined;
          uploadStatus.textContent = '图片上传失败，请重试。';
        };
        try {
          void Promise.resolve(config.fileUpload(selected, finish, { signal: controller.signal })).catch(fail);
        } catch {
          fail();
        }
      };
      const beginResize = (event: PointerEvent) => {
        const target = event.target instanceof HTMLElement ? event.target : null;
        const handle = target?.dataset.resizeHandle;
        if (!handle || !activeTarget) return;
        event.preventDefault();
        const rect = activeTarget.getBoundingClientRect();
        resize = {
          position: activePosition,
          target: activeTarget,
          handle,
          startX: event.clientX,
          startY: event.clientY,
          width: rect.width,
          height: rect.height,
          nextWidth: rect.width,
          nextHeight: rect.height,
        };
      };
      const moveResize = (event: PointerEvent) => {
        if (!resize) return;
        event.preventDefault();
        const dx = event.clientX - resize.startX;
        const dy = event.clientY - resize.startY;
        let horizontal = 0;
        let vertical = 0;
        if (resize.handle.startsWith('left')) horizontal = -dx;
        else if (resize.handle.startsWith('right')) horizontal = dx;
        if (resize.handle.endsWith('Top')) vertical = -dy;
        else if (resize.handle.endsWith('Bottom')) vertical = dy;
        if (horizontal) {
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
      const finishResize = () => {
        if (!resize) return;
        const finished = resize;
        resize = undefined;
        activePosition = finished.position;
        setActiveTarget(finished.target);
        commitLayout({ width: finished.nextWidth, height: finished.nextHeight });
      };
      const onOutside = (event: PointerEvent) => {
        if (!(event.target instanceof Node)) return;
        if (frame.contains(event.target) || toolbar.contains(event.target) || form.contains(event.target)) return;
        if (activeTarget?.contains(event.target)) return;
        if (sourceOpen) closeSource(false);
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        if (sourceOpen) closeSource();
        else hide();
      };
      const onViewportChange = () => {
        if (sourceOpen) closeSource(false);
        schedulePlace();
      };

      toolbar.addEventListener('pointerdown', (event) => event.preventDefault());
      actions.forEach(({ button }) => button.addEventListener('click', onAction));
      frame.addEventListener('pointerdown', beginResize);
      document.addEventListener('pointermove', moveResize, true);
      document.addEventListener('pointerup', finishResize, true);
      document.addEventListener('pointerdown', onOutside, true);
      document.addEventListener('keydown', onKeyDown, true);
      document.defaultView?.addEventListener('scroll', onViewportChange, true);
      document.defaultView?.addEventListener('resize', onViewportChange);
      form.addEventListener('submit', onSubmit);
      cancel.addEventListener('click', onCancel);
      choose.addEventListener('click', chooseImage);
      file.addEventListener('change', onFileChange);

      return {
        update,
        destroy: () => {
          actions.forEach(({ button }) => button.removeEventListener('click', onAction));
          uploadSession += 1;
          uploadController?.abort();
          uploadController = undefined;
          if (positionFrame !== undefined) cancelAnimationFrame(positionFrame);
          releaseTarget();
          targetObserver?.disconnect();
          frame.removeEventListener('pointerdown', beginResize);
          document.removeEventListener('pointermove', moveResize, true);
          document.removeEventListener('pointerup', finishResize, true);
          document.removeEventListener('pointerdown', onOutside, true);
          document.removeEventListener('keydown', onKeyDown, true);
          document.defaultView?.removeEventListener('scroll', onViewportChange, true);
          document.defaultView?.removeEventListener('resize', onViewportChange);
          form.removeEventListener('submit', onSubmit);
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
