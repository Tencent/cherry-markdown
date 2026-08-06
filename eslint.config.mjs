/**
 * 根目录统一 ESLint Flat Config（配合 `eslint .`）
 * 尽量贴近 eslint-config-tencent 官方 flat 工厂，仅保留 monorepo 必需项
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import globals from 'globals';
import babelParser from '@babel/eslint-parser';
import tsParser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';
import prettier from 'eslint-plugin-prettier/recommended';
import tencentFlatFactory from 'eslint-config-tencent/flat';

/** 仓库根目录 */
const ROOT = path.dirname(fileURLToPath(import.meta.url));

/** ESLint 忽略：仅排除产物与复制进来的第三方依赖，其余源码均检测 */
const ignores = [
  // 依赖与锁文件
  '**/node_modules/**',
  'yarn.lock',
  'package-lock.json',
  'pnpm-lock.yaml',

  // 构建 / 测试产物
  '**/dist/**',
  '**/out/**',
  '**/coverage/**',
  '**/target/**',

  // 第三方、示例站点与打包进来的静态资源
  'examples/**',
  'packages/cherry-markdown/src/libs/*.js',
  'packages/cherry-markdown/src/addons/advance/maps/**',
  'packages/vscodePlugin/web-resources/scripts/pinyin/**',

  // 样式与构建模板（非 JS/TS 语义）
  '**/*.css',
  '**/*.scss',
  'packages/cherry-markdown/templates/**',
];

/** 腾讯 JS 基础规则（base + import），来自官方 flat 入口 */
const tencentBaseConfigs = tencentFlatFactory({});

/** 官方 flat 工厂中的 TS 相关配置块名称 */
const TENCENT_TS_CONFIG_NAMES = new Set(['typescript-eslint/base', '@tencent/eslint-config-ts']);

/** 各 workspace 的 tsconfig 根目录 */
const packageRoots = {
  cherryMarkdown: path.join(ROOT, 'packages/cherry-markdown'),
  /** 测试目录独立 tsconfig，避免误用仅含 src 入口的 tsconfig.json */
  cherryMarkdownTest: path.join(ROOT, 'packages/cherry-markdown/test'),
  client: path.join(ROOT, 'packages/client'),
  vscodePlugin: path.join(ROOT, 'packages/vscodePlugin'),
};

/**
 * 按包生成官方腾讯 TS flat 配置（不含重复的 base/import）
 * @param {string} tsconfigRootDir 对应包内 tsconfig.json 所在目录
 * @param {string[]} files 限制规则生效的文件 glob
 */
function createTencentTsConfigs(tsconfigRootDir, files, project = true) {
  return tencentFlatFactory({
    tsconfigRootDir,
    project,
  })
    .filter((config) => TENCENT_TS_CONFIG_NAMES.has(config.name))
    .map((config) => ({
      ...config,
      files,
    }));
}

/** 为 Vue 文件套用官方腾讯 TS 配置，并切换为 vue-eslint-parser */
function createTencentVueConfigs(tsconfigRootDir, files, extraGlobals = {}, project = true) {
  return createTencentTsConfigs(tsconfigRootDir, files, project).map((config) => ({
    ...config,
    languageOptions: {
      ...config.languageOptions,
      parser: vueParser,
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        parser: tsParser,
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...config.languageOptions?.globals,
        ...extraGlobals,
      },
    },
  }));
}

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores },
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        BUILD_ENV: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-env'],
        },
      },
    },
  },
  ...tencentBaseConfigs,
  // client
  ...createTencentTsConfigs(
    packageRoots.client,
    ['packages/client/**/*.{ts,tsx}', 'packages/client/vite.config.ts'],
    './tsconfig.eslint.json',
  ),
  {
    files: ['packages/client/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        __APP_VERSION__: 'readonly',
      },
    },
  },
  ...createTencentVueConfigs(
    packageRoots.client,
    ['packages/client/**/*.vue'],
    { __APP_VERSION__: 'readonly' },
    './tsconfig.eslint.json',
  ),
  // vscode plugin
  ...createTencentTsConfigs(packageRoots.vscodePlugin, ['packages/vscodePlugin/**/*.{ts,mts}']),
  // cherry-markdown：types / 构建配置
  ...createTencentTsConfigs(
    packageRoots.cherryMarkdown,
    [
      'packages/cherry-markdown/types/**/*.d.ts',
      'packages/cherry-markdown/vite*.ts',
      'packages/cherry-markdown/vitest.config.ts',
    ],
    './tsconfig.eslint.json',
  ),
  // cherry-markdown 测试
  {
    files: ['packages/cherry-markdown/test/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  ...createTencentTsConfigs(packageRoots.cherryMarkdownTest, ['packages/cherry-markdown/test/**/*.ts']),
  // client：Vite define 注入的全局常量命名
  {
    files: ['packages/client/src/vite-env.d.ts'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  },
  // cherry-markdown：声明文件结构由业务语义决定，不强制 member-ordering
  {
    files: ['packages/cherry-markdown/types/**/*.d.ts'],
    rules: {
      '@typescript-eslint/member-ordering': 'off',
    },
  },
  // cherry-markdown build：Rollup 插件需就地修改 bundle 等入参
  {
    files: ['packages/cherry-markdown/build/**/*.js'],
    rules: {
      'no-param-reassign': 'off',
    },
  },
  // cherry-markdown：关闭未使用变量、下划线命名、就地修改参数 lint
  {
    files: ['packages/cherry-markdown/src/**/*.{js,ts}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-underscore-dangle': 'off',
      'no-param-reassign': 'off',
    },
  },
  // 放在最后：关闭与 Prettier 冲突的格式规则（缩进、引号等交给 Prettier）
  prettier,
];
