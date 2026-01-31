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
      // 禁用不安全优化，避免对象初始化时为 undefined 导致运行时错误
      unsafe_arrows: false,
      unsafe_methods: false,
      // ESM 启用更多优化
      ...(isESM && {
        dead_code: true,
        unused: true,
        inline: 2,
        reduce_funcs: true,
        reduce_vars: true,
      }),
    },

    // 输出选项
    format: {
      ecma: isESM ? 2018 : 5,
      comments: false,
      ascii_only: true,
      wrap_iife: !isESM,
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
