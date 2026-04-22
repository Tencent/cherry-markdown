import { Configuration } from '@rspack/core';
import * as path from 'path';
import * as fs from 'fs';

// 构建前清理 dist 目录
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true });
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
const webviewDistPath = path.resolve(__dirname, 'web-resources', 'dist');
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
    clean: false,
  },
  devtool: isProduction ? false : 'source-map',
  resolve: {
    extensions: ['.ts', '.js'],
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
      // 处理 CSS 文件（cherry-markdown 的样式）
      {
        test: /\.css$/,
        type: 'css',
      },
      // 处理字体文件
      {
        test: /\.(woff|woff2|ttf|eot)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]',
        },
      },
      // 处理图片/SVG
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
    ],
  },
  optimization: {
    minimize: isProduction,
  },
};

export default [extensionConfig, webviewConfig];
