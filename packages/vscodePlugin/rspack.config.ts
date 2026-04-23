import { Configuration, rspack } from '@rspack/core';
import * as path from 'path';
import * as fs from 'fs';

// 构建前清理 dist 目录
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true });
}

// Webview 构建前清理 web-resources/dist 目录（由 rspack 完整生成）
const webviewDistPath = path.resolve(__dirname, 'web-resources', 'dist');
if (fs.existsSync(webviewDistPath)) {
  fs.rmSync(webviewDistPath, { recursive: true });
}

// 环境判断
const argv = process.argv.join(' ');
const isProduction =
  argv.includes('--mode production') ||
  process.env.RSPACK_BUILD_MODE === 'production' ||
  process.env.NODE_ENV === 'production';

// VSCode 扩展配置 (Node.js 环境)
const extensionConfig: Configuration = {
  target: 'node',
  mode: 'none',
  entry: {
    extension: './src/extension.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    clean: false, // 已手动清理
  },
  devtool: isProduction ? false : 'nosources-source-map',
  externals: {
    vscode: 'commonjs vscode',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
            },
            target: 'es2020',
          },
        },
        type: 'javascript/auto',
      },
    ],
  },
  optimization: {
    minimize: isProduction,
    // VSCode 扩展只识别单一入口文件，不能拆分 chunk
    splitChunks: false,
  },
  performance: {
    hints: isProduction ? 'warning' : false,
  },
};

// Webview 配置 (浏览器环境)
const webviewConfig: Configuration = {
  target: 'web',
  mode: isProduction ? 'production' : 'development',
  entry: {
    index: './web-resources/scripts/index.js',
  },
  output: {
    path: webviewDistPath,
    filename: '[name].js',
    libraryTarget: 'umd',
    // 资源文件（字体等）输出到 assets/ 子目录
    assetModuleFilename: 'assets/[name][ext]',
    clean: false, // 已手动清理
  },
  devtool: isProduction ? false : 'source-map',
  resolve: {
    extensions: ['.ts', '.js'],
    // 确保能解析 monorepo 根目录 node_modules 中的依赖（yarn workspace hoisting）
    modules: [path.resolve(__dirname, 'node_modules'), path.resolve(__dirname, '../../node_modules'), 'node_modules'],
    // CI 脚本将核心库重命名为 cherry-markdown-core，本地开发时包名仍为 cherry-markdown
    // 此 alias 确保两种场景下 import from 'cherry-markdown-core' 都能正确解析
    // 注意：rspack 需要显式指定入口文件路径，不能仅指定目录
    // __dirname = packages/vscodePlugin，目标在 packages/cherry-markdown/dist/
    alias: {
      'cherry-markdown-core$': path.resolve(__dirname, '../cherry-markdown/dist/cherry-markdown.esm.js'),
      'cherry-markdown-core/dist/cherry-markdown.min.css': path.resolve(
        __dirname,
        '../cherry-markdown/dist/cherry-markdown.min.css'
      ),
    },
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'ecmascript',
            },
          },
          env: {
            targets: '> 0.25%, not dead',
          },
        },
        type: 'javascript/auto',
      },
      // CSS：用 CssExtractRspackPlugin 提取为独立 .css 文件（替代实验性的 experiments.css）
      {
        test: /\.css$/,
        use: [rspack.CssExtractRspackPlugin.loader, 'css-loader'],
        type: 'javascript/auto',
      },
      // 字体文件
      {
        test: /\.(woff|woff2|ttf|eot)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]',
        },
      },
      // 图片 / SVG
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
    ],
  },
  plugins: [
    new rspack.CssExtractRspackPlugin({
      filename: '[name].css',
    }),
  ],
  optimization: {
    minimize: isProduction,
  },
};

export default [extensionConfig, webviewConfig];
