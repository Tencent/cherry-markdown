/**
 * Cherry Markdown 加载器
 * 开发模式：从源码动态导入
 * 生产模式：从构建产物导入
 */

let CherryClass = null;
let isInitialized = false;

/**
 * 初始化 Cherry
 * @returns {Promise<typeof import('@cherry-markdown').default>}
 */
export async function initCherry() {
  if (isInitialized && CherryClass) {
    return CherryClass;
  }

  if (import.meta.env.DEV) {
    // 开发模式：从源码导入
    const module = await import('@cherry-markdown');
    await import('@cherry-markdown/sass/index.scss');
    CherryClass = module.default;
  } else {
    // 生产模式：从构建产物导入
    // 此时 window.Cherry 应该已经通过 <script> 标签加载
    CherryClass = window.Cherry;
  }

  isInitialized = true;
  return CherryClass;
}

/**
 * 加载 markdown 文件内容
 * @param {string} path - markdown 文件路径
 * @returns {Promise<string>}
 */
export async function loadMarkdown(path) {
  if (import.meta.env.DEV) {
    // 开发模式：使用 ?raw 后缀直接导入
    // @vite-ignore 因为路径是动态的，Vite 无法静态分析
    const module = await import(/* @vite-ignore */ `${path}?raw`);
    return module.default;
  } else {
    // 生产模式：使用 fetch 加载
    const response = await fetch(path);
    return response.text();
  }
}

/**
 * 创建 Cherry 实例
 * @param {Object} config - Cherry 配置
 * @returns {Promise<Object>}
 */
export async function createCherry(config) {
  const Cherry = await initCherry();
  const cherry = new Cherry(config);
  window.cherry = cherry;
  return cherry;
}

export default initCherry;
