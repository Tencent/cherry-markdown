#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * 同步版本号脚本
 * 将 package.json 的版本号同步到 tauri.conf.json 和 Cargo.toml
 */

const clientDir = path.resolve(dirname, '..');
const packageJsonPath = path.join(clientDir, 'package.json');
const tauriConfPath = path.join(clientDir, 'src-tauri', 'tauri.conf.json');
const cargoTomlPath = path.join(clientDir, 'src-tauri', 'Cargo.toml');

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ 读取文件失败: ${filePath}`, error.message);
    process.exit(1);
  }
}

function writeJsonFile(filePath, data) {
  try {
    const content = `${JSON.stringify(data, null, 2)}\n`;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 更新成功: ${path.relative(clientDir, filePath)}`);
  } catch (error) {
    console.error(`❌ 写入文件失败: ${filePath}`, error.message);
    process.exit(1);
  }
}

function updateCargoToml(filePath, newVersion) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // 更新 version 字段
    content = content.replace(/^version\s*=\s*"[^"]*"/m, `version = "${newVersion}"`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 更新成功: ${path.relative(clientDir, filePath)}`);
  } catch (error) {
    console.error(`❌ 更新 Cargo.toml 失败: ${filePath}`, error.message);
    process.exit(1);
  }
}

function main() {
  console.log('🔄 开始同步版本号...\n');

  // 检查文件是否存在
  const files = [packageJsonPath, tauriConfPath, cargoTomlPath];
  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.error(`❌ 文件不存在: ${file}`);
      process.exit(1);
    }
  }

  // 读取 package.json 中的版本号
  const packageJson = readJsonFile(packageJsonPath);
  const { version } = packageJson;

  if (!version) {
    console.error('❌ package.json 中未找到版本号');
    process.exit(1);
  }

  console.log(`📦 当前版本: ${version}\n`);

  // 更新 tauri.conf.json
  const tauriConf = readJsonFile(tauriConfPath);
  const oldTauriVersion = tauriConf.version;

  if (oldTauriVersion !== version) {
    tauriConf.version = version;
    writeJsonFile(tauriConfPath, tauriConf);
    console.log(`   ${oldTauriVersion} → ${version}`);
  } else {
    console.log(`✅ tauri.conf.json 版本已是最新: ${version}`);
  }

  // 更新 Cargo.toml
  const cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
  const cargoVersionMatch = cargoContent.match(/^version\s*=\s*"([^"]*)"/m);
  const oldCargoVersion = cargoVersionMatch ? cargoVersionMatch[1] : null;

  if (oldCargoVersion !== version) {
    updateCargoToml(cargoTomlPath, version);
    console.log(`   ${oldCargoVersion} → ${version}`);
  } else {
    console.log(`✅ Cargo.toml 版本已是最新: ${version}`);
  }

  console.log('\n🎉 版本同步完成!');
}

main();
