import mergeWith from '@/utils/toolkit/mergeWith';
import cloneDeep from '@/utils/toolkit/cloneDeep';
import defaultConfig from '@/Cherry.config';
import { customizer } from '@/utils/config';
import UrlCache, { urlProcessorProxy } from '@/UrlCache';
import Engine from '@/Engine';
import locales from '@/locales/index';
import { isValidScheme } from '@/utils/sanitize';

export function cloneSemanticBlocks(blocks) {
  return cloneDeep(blocks);
}

export function isValidSemanticUrl(value, image = false) {
  return (image && /^data:image\/(?:png|jpe?g|gif|webp|svg\+xml)[;,]/i.test(value)) || isValidScheme(value);
}

class MiniProgramCherryContext {
  constructor(options) {
    this.options = options;
    this.locales = options.locales ? { ...options.locales, ...locales } : locales;
    this.locale = this.locales[this.options.locale] || this.locales.zh_CN;
    this.nameSpace = options.nameSpace || 'cherry';
  }

  getLocales() {
    return this.locale;
  }

  clearFlowSessionCursor() {}
}

function normalizeOptions(options = {}) {
  const defaultConfigCopy = cloneDeep(defaultConfig);
  const mergedOptions = mergeWith({}, defaultConfigCopy, options, customizer);
  if (typeof mergedOptions.engine.global.urlProcessor === 'function') {
    mergedOptions.engine.global.urlProcessor = urlProcessorProxy(mergedOptions.engine.global.urlProcessor);
    mergedOptions.callback.urlProcessor = mergedOptions.engine.global.urlProcessor;
  } else {
    mergedOptions.callback.urlProcessor = urlProcessorProxy(mergedOptions.callback.urlProcessor);
  }
  if (mergedOptions.engine.global.flowSessionCursor === 'default') {
    mergedOptions.engine.global.flowSessionCursor = '<span class="cherry-flow-session-cursor"></span>';
  }
  if (typeof mergedOptions.engine.global.flowSessionContext === 'undefined') {
    mergedOptions.engine.global.flowSessionContext = true;
  }
  return mergedOptions;
}

export function createMiniProgramEngine(options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const cherry = new MiniProgramCherryContext(normalizedOptions);
  const engine = new Engine(normalizedOptions, cherry);
  engine.$clearFlowSessionCursorCache = function clearFlowSessionCursorCache(md) {
    if (this.semanticRenderer) return md.replace(/CHERRYFLOWSESSIONCURSOR/g, this.semanticRenderer.atom('cursor', {}));
    if (this.$cherry.options.engine.global.flowSessionCursor) {
      return md.replace(/CHERRYFLOWSESSIONCURSOR/g, this.$cherry.options.engine.global.flowSessionCursor);
    }
    return md;
  };
  engine.restoreSemanticText = (value) =>
    engine.$decodeReservedKeywords(UrlCache.restoreAll(engine.$deCacheBigData(value)));
  return engine;
}

export { MiniProgramCherryContext };
