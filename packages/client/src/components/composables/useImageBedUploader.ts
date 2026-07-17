import { useImageBedStore, type ImageBedProvider, type ImageBedState } from '../../store';

/**
 * Cherry file upload callback signature: (file, cb) => void.
 * cb receives the final URL string.
 */
export type CherryFileUploadCallback = (
  url: string,
  params?: {
    name?: string;
    poster?: string;
    isBorder?: boolean;
    isShadow?: boolean;
    isRadius?: boolean;
    width?: string;
    height?: string;
  },
) => void;

/** Extract a nested value from an object by dot-path, e.g. "data.url" or "result.0.url". */
const pickByPath = (obj: unknown, path: string): unknown => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    if (Array.isArray(acc) && /^\d+$/.test(key)) {
      return acc[Number(key)];
    }
    if (typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });

/** Default fallback: read as base64 data URL (identical to Cherry's default). */
const uploadAsBase64 = async (file: File): Promise<string> => {
  try {
    return await fileToBase64(file);
  } catch (error) {
    console.error('[imageBed] base64 读取失败:', error);
    return '';
  }
};

/** PicGo Server: POST { list: [base64DataUrl] } to endpoint, expect { success, result: [url] }. */
const uploadViaPicgo = async (file: File, endpoint: string): Promise<string> => {
  try {
    const dataUrl = await fileToBase64(file);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list: [dataUrl] }),
    });
    if (!res.ok) throw new Error(`PicGo Server 返回 ${res.status}`);
    const data = (await res.json()) as { success?: boolean; result?: unknown[]; msg?: string };
    if (!data.success || !Array.isArray(data.result) || typeof data.result[0] !== 'string') {
      throw new Error(data.msg || 'PicGo Server 返回格式异常');
    }
    return data.result[0];
  } catch (error) {
    console.error('[imageBed] PicGo 上传失败，降级 base64:', error);
    return uploadAsBase64(file);
  }
};

/** Custom uploader: multipart/form-data POST, extract URL via responseUrlPath. */
const uploadViaCustom = async (file: File, config: ImageBedState['custom']): Promise<string> => {
  try {
    if (!config.url.trim()) throw new Error('未配置上传 URL');
    const form = new FormData();
    form.append(config.fieldName || 'file', file);

    const headers: Record<string, string> = {};
    config.headers.forEach((h) => {
      const k = h.key.trim();
      // browser will refuse to set Content-Type for FormData; skip any user-provided Content-Type
      if (k && k.toLowerCase() !== 'content-type') {
        headers[k] = h.value;
      }
    });

    const res = await fetch(config.url, { method: 'POST', headers, body: form });
    if (!res.ok) throw new Error(`上传失败，HTTP ${res.status}`);

    const contentType = res.headers.get('content-type') || '';
    let url: unknown = '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      url = pickByPath(data, config.responseUrlPath || 'url');
    } else {
      // plain text response
      url = (await res.text()).trim();
    }
    if (typeof url !== 'string' || !url) {
      throw new Error(`响应中未找到 "${config.responseUrlPath}" 字段`);
    }
    return url;
  } catch (error) {
    console.error('[imageBed] 自定义图床上传失败，降级 base64:', error);
    return uploadAsBase64(file);
  }
};

/**
 * Get current image bed provider synchronously from pinia store; returns 'none' on failure.
 */
export function getCurrentProvider(): ImageBedProvider {
  try {
    return useImageBedStore().provider;
  } catch {
    return 'none';
  }
}

/**
 * Core: upload a single file according to the current image bed settings.
 * Returns the final URL (either remote URL or base64 data-URL for fallback).
 */
export async function uploadImageFile(file: File): Promise<string> {
  let store: ReturnType<typeof useImageBedStore>;
  try {
    store = useImageBedStore();
  } catch {
    return uploadAsBase64(file);
  }
  switch (store.provider) {
    case 'picgo':
      return uploadViaPicgo(file, store.picgo.url);
    case 'custom':
      return uploadViaCustom(file, store.custom);
    case 'none':
    default:
      return uploadAsBase64(file);
  }
}

/**
 * Returns a Cherry-compatible fileUpload callback that dispatches to the currently
 * selected image bed provider on every invocation (so it stays live with settings changes).
 */
export function createImageBedFileUpload(): (file: File, cb: CherryFileUploadCallback) => void {
  return (file, cb) => {
    void uploadImageFile(file).then((url) => {
      cb(url, {
        name: file.name.replace(/\.[^.]+$/, ''),
        width: '30%',
        isBorder: true,
        isShadow: true,
        isRadius: true,
      });
    });
  };
}

/**
 * Type for the async callback Cherry passes as the 3rd arg of onPaste,
 * used to replace a `<<placeholder>>` syntax sugar with real markdown.
 */
export type CherryPasteAsyncCallback = (payload: { html?: string; htmlText?: string; mdText: string }) => void;

/**
 * Extract image files from a DataTransfer clipboard, in the order they appear.
 */
function extractImageFiles(clipboardData: DataTransfer | null): File[] {
  if (!clipboardData) return [];
  const files: File[] = [];
  // 1) items 遍历，兼容截屏（图片直接来自 clipboard，不在 files 里）
  const { items } = clipboardData;
  if (items) {
    for (const item of Array.from(items)) {
      if (item.kind === 'file' && /^image\//i.test(item.type)) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
  }
  // 2) 如果 items 没拿到，再退回 files（拖拽/复制文件资源管理器中的图片）
  if (files.length === 0 && clipboardData.files && clipboardData.files.length > 0) {
    for (const f of Array.from(clipboardData.files)) {
      if (/^image\//i.test(f.type)) files.push(f);
    }
  }
  return files;
}

/**
 * Escape special chars in image alt text.
 */
function escapeAlt(name: string): string {
  return name.replace(/[[\]\\]/g, '\\$&');
}

/**
 * Build the final markdown snippet from uploaded image URLs.
 */
function buildImageMarkdown(items: Array<{ name: string; url: string }>): string {
  return items
    .filter((it) => !!it.url)
    .map((it) => `![${escapeAlt(it.name)} #B #S #R #30%](${it.url})`)
    .join('\n');
}

/**
 * Creates a Cherry-compatible onPaste callback that:
 *  - Returns a `<<正在上传图片...>>` syntax sugar placeholder synchronously when the
 *    clipboard contains images (and no meaningful text) AND an image bed is configured;
 *  - Then asynchronously uploads all images and replaces the placeholder via the
 *    async callback provided by Cherry.
 *
 * Behavior:
 *  - If clipboard has plain text alongside images: skip (return undefined) → let
 *    Cherry handle the paste normally (users typically want the text in that case).
 *  - If image bed provider is 'none': skip → Cherry default (base64 inline).
 */
export function createImageBedOnPaste(): (
  clipboardData: DataTransfer | null,
  cherry: unknown,
  asyncCallback?: CherryPasteAsyncCallback,
) => string | undefined {
  return (clipboardData, _cherry, asyncCallback) => {
    if (!clipboardData) return undefined;

    // 若同时有非空文本，交给 cherry 默认处理（用户显然是想粘文字）
    const plainText = clipboardData.getData('text/plain') || '';
    if (plainText.trim().length > 0) return undefined;

    const images = extractImageFiles(clipboardData);
    if (images.length === 0) return undefined;

    // 未配置图床（none）时，走 Cherry 默认逻辑（默认会转 base64 内联）
    const provider = getCurrentProvider();
    if (provider === 'none') return undefined;

    // 无 asyncCallback 说明是旧调用签名，不做异步替换，直接放行
    if (typeof asyncCallback !== 'function') return undefined;

    const isBatch = images.length > 1;
    const placeholder = isBatch ? `<<正在上传 ${images.length} 张图片…>>` : `<<正在上传图片…>>`;

    // 并行上传所有图片，全部完成后一次性替换占位
    Promise.all(
      images.map(async (file, idx) => {
        const url = await uploadImageFile(file);
        const rawName = (file.name || `image-${idx + 1}`).replace(/\.[^.]+$/, '');
        return { name: rawName || `image-${idx + 1}`, url };
      }),
    )
      .then((results) => {
        const mdText = buildImageMarkdown(results);
        // 即便部分失败（url 为空）也要替换掉占位，避免占位残留
        asyncCallback({
          mdText: mdText || `<!-- 图片上传失败 -->`,
        });
      })
      .catch((error) => {
        console.error('[imageBed] 粘贴图片上传失败:', error);
        asyncCallback({ mdText: `<!-- 图片上传失败: ${(error as Error).message} -->` });
      });

    return placeholder;
  };
}

/** Test connectivity for the given provider; returns { ok, message } */
export async function testImageBedConnection(
  provider: 'picgo' | 'custom',
  state: ImageBedState,
): Promise<{ ok: boolean; message: string }> {
  try {
    if (provider === 'picgo') {
      // 1x1 transparent PNG
      const tinyPng =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const res = await fetch(state.picgo.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list: [tinyPng] }),
      });
      if (!res.ok) return { ok: false, message: `连接失败：HTTP ${res.status}` };
      const data = (await res.json()) as { success?: boolean; msg?: string; result?: unknown[] };
      if (data.success && Array.isArray(data.result) && data.result[0]) {
        return { ok: true, message: `连通成功：${String(data.result[0])}` };
      }
      return { ok: false, message: data.msg || '返回格式异常' };
    }

    if (!state.custom.url.trim()) return { ok: false, message: '请填写上传 URL' };
    // We do a HEAD to at least verify DNS/URL reachability; many servers reject HEAD though.
    const res = await fetch(state.custom.url, { method: 'HEAD' }).catch(() => null);
    if (!res) return { ok: false, message: 'URL 无法访问（可能是网络或 CORS 限制）' };
    return { ok: true, message: `URL 可达（HTTP ${res.status}），实际上传将在插入图片时进行` };
  } catch (error) {
    return { ok: false, message: `连接失败：${(error as Error).message}` };
  }
}
