/**
 * 安全获取 window 上的外部依赖（如 echarts、katex、MathJax、mermaid）
 *
 * 解决的问题：
 * 1. SSR / 非浏览器环境安全：内部已做 isBrowser 守卫，调用方无需重复判断
 * 2. 统一获取逻辑：避免各处散落 `window.xxx ?? externals?.xxx` 的重复代码
 * 3. 类型安全：返回值带有正确的类型标注
 *
 * @template T - 依赖的类型
 * @param {string} name - window 上的属性名，如 'echarts'、'katex'
 * @param {T} [externalsValue] - 外部注入的备选值（优先使用）
 * @returns {T | undefined} 找到的依赖实例，或 undefined
 */
export function getExternal<T>(name: string, externalsValue?: T): T | undefined;
declare const _default: {};
export default _default;
