/**
 * Shared Terser configuration for optimized minification
 */
import terser from '@rollup/plugin-terser';
import os from 'os';

const CPU_COUNT = os.cpus().length;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Create optimized terser plugin
 * @param {Object} options - Additional terser options
 * @param {boolean} options.isESM - Whether this is for ESM output
 * @returns {import('rollup').Plugin}
 */
export function createTerserPlugin(options = {}) {
  const { isESM = false, ...rest } = options;

  return terser({
    // 多线程压缩 - 性能优化
    maxWorkers: Math.max(1, CPU_COUNT - 1),

    // 压缩选项 - 平衡压缩率和安全性
    compress: {
      ecma: isESM ? 2018 : 5,
      passes: 2, // 多次压缩获得更好的压缩率
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
      drop_debugger: true,
      drop_console: false, // 保留 console.warn/error 用于生产环境调试
      pure_getters: true,

      // 安全优化 - 禁用可能导致问题的优化
      unsafe_arrows: false,
      unsafe_methods: false,
      unsafe_comps: false,

      // 死代码消除
      dead_code: true,
      unused: true,

      // 条件语句优化
      conditionals: true,
      comparisons: true,
      evaluate: true,
      booleans: true,

      // 循环优化
      loops: true,

      // 内联优化
      inline: 2,

      // 常量折叠
      reduce_vars: true,
      collapse_vars: true,

      // 生产环境额外优化
      ...(IS_PRODUCTION && {
        global_defs: {
          'process.env.NODE_ENV': JSON.stringify('production'),
        },
      }),
    },

    // 输出选项 - 优化输出格式
    format: {
      ecma: 5,
      comments: false, // 移除所有注释
      ascii_only: true, // 确保兼容性
      wrap_iife: !isESM,
    },

    // Mangle 选项 - 变量名混淆
    mangle: IS_PRODUCTION
      ? {
          safari10: true, // Safari 10 兼容性
          properties: false, // 不混淆属性名，避免破坏 API
          // 保留类名，便于调试
          keep_classnames: false,
          // 保留函数名，便于调试
          keep_fnames: false,
        }
      : false,

    // ESM 特定优化
    ...(isESM && {
      module: true,
      toplevel: true, // ESM 可以安全地优化顶层作用域
    }),

    ...rest,
  });
}

// 预配置的 UMD terser
export const terserUMD = createTerserPlugin({ isESM: false });

// 预配置的 ESM terser
export const terserESM = createTerserPlugin({ isESM: true });
