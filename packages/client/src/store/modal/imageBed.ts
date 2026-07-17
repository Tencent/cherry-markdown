import { defineStore } from 'pinia';

// Image bed provider types: none = base64 inline (default), picgo = PicGo Server, custom = generic HTTP upload
export type ImageBedProvider = 'none' | 'picgo' | 'custom';

export interface CustomImageBedConfig {
  /** HTTP endpoint that accepts multipart/form-data upload */
  url: string;
  /** FormData field name used to carry the file */
  fieldName: string;
  /** Extra HTTP headers, e.g. auth token (do NOT set Content-Type) */
  headers: Array<{ key: string; value: string }>;
  /** JSON path in response body used to extract the final image URL, e.g. "data.url" */
  responseUrlPath: string;
}

export interface PicgoImageBedConfig {
  /** PicGo Server upload endpoint, default: http://127.0.0.1:36677/upload */
  url: string;
}

export interface ImageBedState {
  provider: ImageBedProvider;
  picgo: PicgoImageBedConfig;
  custom: CustomImageBedConfig;
}

const STORAGE_KEY = 'cherry_markdown_image_bed';

const DEFAULT_STATE: ImageBedState = {
  provider: 'none',
  picgo: {
    url: 'http://127.0.0.1:36677/upload',
  },
  custom: {
    url: '',
    fieldName: 'file',
    headers: [],
    responseUrlPath: 'data.url',
  },
};

const isProvider = (v: unknown): v is ImageBedProvider => v === 'none' || v === 'picgo' || v === 'custom';

const sanitizeHeaders = (raw: unknown): Array<{ key: string; value: string }> => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((h): h is { key: unknown; value: unknown } => typeof h === 'object' && h !== null)
    .map((h) => ({
      key: typeof h.key === 'string' ? h.key : '',
      value: typeof h.value === 'string' ? h.value : '',
    }))
    .filter((h) => h.key.trim().length > 0);
};

const loadFromStorage = (): ImageBedState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw) as Partial<ImageBedState>;
    return {
      provider: isProvider(parsed.provider) ? parsed.provider : DEFAULT_STATE.provider,
      picgo: {
        url:
          typeof parsed.picgo?.url === 'string' && parsed.picgo.url.trim() ? parsed.picgo.url : DEFAULT_STATE.picgo.url,
      },
      custom: {
        url: typeof parsed.custom?.url === 'string' ? parsed.custom.url : DEFAULT_STATE.custom.url,
        fieldName:
          typeof parsed.custom?.fieldName === 'string' && parsed.custom.fieldName.trim()
            ? parsed.custom.fieldName
            : DEFAULT_STATE.custom.fieldName,
        headers: sanitizeHeaders(parsed.custom?.headers),
        responseUrlPath:
          typeof parsed.custom?.responseUrlPath === 'string' && parsed.custom.responseUrlPath.trim()
            ? parsed.custom.responseUrlPath
            : DEFAULT_STATE.custom.responseUrlPath,
      },
    };
  } catch (error) {
    console.warn('加载图床配置失败:', error);
    return structuredClone(DEFAULT_STATE);
  }
};

const saveToStorage = (state: ImageBedState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('保存图床配置失败:', error);
  }
};

export const useImageBedStore = defineStore('imageBed', {
  state: (): ImageBedState => loadFromStorage(),
  actions: {
    setProvider(provider: ImageBedProvider) {
      this.provider = provider;
      saveToStorage(this.$state);
    },
    setPicgoConfig(config: Partial<PicgoImageBedConfig>) {
      this.picgo = { ...this.picgo, ...config };
      saveToStorage(this.$state);
    },
    setCustomConfig(config: Partial<CustomImageBedConfig>) {
      this.custom = { ...this.custom, ...config };
      saveToStorage(this.$state);
    },
    replaceAll(next: ImageBedState) {
      this.provider = next.provider;
      this.picgo = { ...next.picgo };
      this.custom = { ...next.custom, headers: [...next.custom.headers] };
      saveToStorage(this.$state);
    },
  },
});
