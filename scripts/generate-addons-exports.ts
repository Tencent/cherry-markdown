/**
 * 自动生成插件 exports 配置
 * 扫描 src/addons 目录，自动生成插件的条件 package.json 导出配置（ESM、UMD 和类型声明）
 */
import * as path from 'path';
import * as fs from 'fs';

const cwd = process.cwd();
const packageJsonPath = path.join(cwd, 'packages/cherry-markdown/package.json');
const addonsSrcDir = path.join(cwd, 'packages/cherry-markdown/src/addons');

/**
 * 递归扫描插件目录，查找所有 *-plugin.js 文件
 */
function scanAddons(dir: string, baseDir: string): string[] {
  const plugins: string[] = [];

  function scan(currentDir: string) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (file.endsWith('-plugin.js')) {
        // 找到插件文件
        const relativePath = path.relative(baseDir, fullPath);
        // 移除 .js 扩展名，得到插件标识
        const pluginKey = relativePath.replace('.js', '');
        plugins.push(pluginKey);
      }
    }
  }

  scan(dir);
  return plugins;
}

/**
 * 生成插件的 exports 配置（ESM、UMD 和类型声明）
 */
function generateAddonsExports(plugins: string[]): Record<string, any> {
  const exports: Record<string, any> = {};

  for (const pluginKey of plugins) {
    // 将路径分隔符转换为 /（适配 exports 路径格式）
    const normalizedPath = pluginKey.replace(/\\/g, '/');
    const exportPath = `./addons/${normalizedPath}`;
    exports[exportPath] = {
      import: `./dist/addons/${normalizedPath}.esm.js`,
      require: `./dist/addons/${normalizedPath}.js`,
      types: `./dist/addons/types/${normalizedPath}.d.ts`,
    };
  }

  return exports;
}

/**
 * 更新 package.json 的 exports 字段
 */
function updatePackageExports() {
  // 检查 src/addons 是否存在
  if (!fs.existsSync(addonsSrcDir)) {
    console.log('[generate-addons-exports] src/addons directory not found, skipping...');
    return;
  }

  // 读取 package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  // 扫描插件
  const plugins = scanAddons(addonsSrcDir, addonsSrcDir);
  console.log(`[generate-addons-exports] Found ${plugins.length} plugins:`);
  plugins.forEach((p) => console.log(`  - ${p}`));

  // 生成插件 exports
  const addonsExports = generateAddonsExports(plugins);

  // 更新 exports 字段
  // 保留根路径、cherry-markdown.core、cherry-markdown.engine 的配置
  const existingExports = packageJson.exports || {};
  const newExports: Record<string, any> = {};

  // 保留非插件的导出配置
  const reservedKeys = [
    '.',
    './cherry-markdown.core',
    './cherry-markdown.engine',
    './dist/cherry-markdown.css',
    './dist/cherry-markdown.markdown.css',
  ];
  for (const key of reservedKeys) {
    if (existingExports[key]) {
      newExports[key] = existingExports[key];
    }
  }

  // 添加插件导出
  Object.assign(newExports, addonsExports);

  // 更新 package.json
  packageJson.exports = newExports;

  // 写回文件（使用 2 空格缩进）
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
  console.log(`[generate-addons-exports] Updated exports with ${Object.keys(addonsExports).length} plugin entries`);
}

// 执行
updatePackageExports();
