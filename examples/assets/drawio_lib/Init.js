// urlParams is null when used for embedding
window.urlParams = window.urlParams || {};

// Public global variables
window.DOM_PURIFY_CONFIG = window.DOM_PURIFY_CONFIG ||
    {ADD_TAGS: ['use'], FORBID_TAGS: ['form'],
    ALLOWED_URI_REGEXP: /^((?!javascript:).)*$/i,
    ADD_ATTR: ['target', 'content']};
// Public global variables
window.MAX_REQUEST_SIZE = window.MAX_REQUEST_SIZE  || 10485760;
window.MAX_AREA = window.MAX_AREA || 15000 * 15000;

// 修复引用路径
// URLs for save and export
window.EXPORT_URL = window.EXPORT_URL || './assets/drawio_lib';
window.SAVE_URL = window.SAVE_URL || './assets/drawio_lib';
window.PROXY_URL = window.PROXY_URL || null;
window.OPEN_URL = window.OPEN_URL || './assets/drawio_lib';
window.RESOURCES_PATH = window.RESOURCES_PATH || './assets/drawio_lib/resources';
window.STENCIL_PATH = window.STENCIL_PATH || './assets/drawio_lib/image/stencils';
window.IMAGE_PATH = window.IMAGE_PATH || './assets/drawio_lib/image';
window.STYLE_PATH = window.STYLE_PATH || './drawio_lib/src/css';
window.CSS_PATH = window.CSS_PATH || './drawio_lib/src/css';
window.OPEN_FORM = window.OPEN_FORM ||  './drawio_lib';

window.mxBasePath = window.mxBasePath || './drawio_lib/src';
window.mxLanguage = window.mxLanguage || window.RESOURCES_PATH + '/zh';
window.mxLanguages = window.mxLanguages || ['zh'];
