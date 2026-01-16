/**
 * Shared Terser configuration for optimized minification
 */
import terser from '@rollup/plugin-terser';
import os from 'os';

const CPU_COUNT = os.cpus().length;

/**
 * Create optimized terser plugin
 * @param {Object} options - Additional terser options
 * @param {boolean} options.isESM - Whether this is for ESM output
 * @returns {import('rollup').Plugin}
 */
export function createTerserPlugin(options = {}) {
  const { isESM = false, ...rest } = options;

  return terser({
    // 多线程压缩
    maxWorkers: Math.max(1, CPU_COUNT - 1),

    // 压缩选项
    compress: {
      ecma: isESM ? 2018 : 5,
      passes: 2, // 多次压缩，更好的压缩
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
      drop_debugger: true,
      drop_console: false, // 保留 console.warn/error
      pure_getters: true,
      unsafe_arrows: isESM,
      unsafe_methods: isESM,
    },

    // 输出选项
    format: {
      ecma: 5, // 始终使用 ES5 输出语法，避免 shorthand properties 等 ES6 语法
      comments: false, // 移除所有注释
      ascii_only: true, // 避免编码问题
      wrap_iife: !isESM, // UMD 包裹 IIFE
    },

    // Mangle 选项
    mangle: {
      safari10: !isESM, // UMD 需要兼容旧浏览器
    },

    // ESM 特定优化
    ...(isESM && { module: true }),

    ...rest,
  });
}

// 预配置的 UMD terser
export const terserUMD = createTerserPlugin({ isESM: false });

// 预配置的 ESM terser
export const terserESM = createTerserPlugin({ isESM: true });
