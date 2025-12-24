import { Configuration } from '@rspack/core';
import * as path from 'path';
import * as fs from 'fs';

// 构建前清理 dist 目录
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true });
}

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
  devtool: 'nosources-source-map',
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
};

// Webview 配置 (浏览器环境)
const webviewConfig: Configuration = {
  target: 'web',
  mode: 'none',
  entry: {
    index: './web-resources/scripts/index.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd',
    clean: false,
  },
  devtool: 'nosources-source-map',
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
    ],
  },
};

export default [extensionConfig, webviewConfig];
