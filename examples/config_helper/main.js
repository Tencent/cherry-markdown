/**
 * Cherry Markdown 配置生成器 - 主逻辑模块
 */
import { PRESETS } from './config-data.js';
import {
  cloneConfigValue, createConfigState,
  generateConfig as buildConfig, buildExportCode as serializeConfig,
} from './config-model.js';
import { createConfigPanel } from './config-panel.js';
import { escapeHtml, findChangedRange, findConfigLine, highlightCode } from './code-highlight.js';

// 页面状态；完整配置始终以 Cherry.config.defaults 为基础生成。
let cherryInstance = null;
let configState = {};
let focusedConfigPath = null;
let recentCodeChange = null;
let fullSourceText = null;
let previewUpdateTimer = null;

const DEFAULT_CONFIG = Cherry.config.defaults;

function initConfigState() {
  configState = createConfigState(DEFAULT_CONFIG);
}

function refreshPreview(delay = 0) {
  clearTimeout(previewUpdateTimer);
  previewUpdateTimer = delay ? setTimeout(() => {
    previewUpdateTimer = null;
    updatePreview();
  }, delay) : null;
  if (!delay) updatePreview();
}

const configPanel = createConfigPanel({
  getState: () => configState,
  defaultConfig: DEFAULT_CONFIG,
  onChange: (path, { wholeValue, transient, previewDelay }) => {
    refreshPreview(previewDelay);
    updateCodeOutput(path, { changed: true, wholeValue, transient });
  },
  onLocate: (path) => {
    recentCodeChange = null;
    focusedConfigPath = path;
    switchTab('code');
  },
});

function renderConfigPanel() {
  configPanel.render();
}

function generateConfig(forPreview = false) {
  return buildConfig(DEFAULT_CONFIG, configState, forPreview);
}

function buildExportCode() {
  return serializeConfig(DEFAULT_CONFIG, configState);
}

// ==================== 更新预览 ====================
function updatePreview() {
  // 销毁旧实例
  if (cherryInstance) {
    try {
      cherryInstance.destroy();
    } catch (e) {
      // 忽略销毁错误
    }
    cherryInstance = null;
  }

  const editorEl = document.getElementById('cherry-editor');
  editorEl.innerHTML = '';

  const config = generateConfig(true);
  // 覆盖必要的配置
  config.id = 'cherry-editor';
  config.value = configState.value?.value ?? '# Hello Cherry Markdown!';
  config.editor.codemirror = { ...config.editor.codemirror, autofocus: false };

  try {
    cherryInstance = new Cherry(config);
  } catch (e) {
    editorEl.innerHTML = `
      <div class="flex items-center justify-center h-full bg-red-50 text-red-500 p-8">
        <div class="text-center">
          <i class="fa-solid fa-triangle-exclamation text-4xl mb-4"></i>
          <p class="text-lg font-medium">预览加载失败</p>
          <p class="text-sm mt-2 text-red-400">${escapeHtml(e.message)}</p>
        </div>
      </div>
    `;
  }
}

function updateCodeOutput(path = focusedConfigPath, { changed = false, wholeValue = false, transient = false } = {}) {
  focusedConfigPath = path;
  const codeEl = document.getElementById('code-output');
  if (codeEl) {
    const previousCode = codeEl.textContent;
    const code = buildExportCode();
    if (changed) {
      recentCodeChange = { path, code, range: wholeValue ? null : findChangedRange(previousCode, code), transient };
    } else if (path === null) {
      recentCodeChange = null;
    }
    codeEl.textContent = code;
    const lineIndex = findConfigLine(code, path);
    const range = recentCodeChange?.path === path && recentCodeChange.code === code
      ? recentCodeChange.range : null;
    highlightCode(codeEl, lineIndex, range);
    if (lineIndex >= 0 && !document.getElementById('panel-code').classList.contains('hidden')) {
      const target = codeEl.querySelector('.code-focus-token');
      const codeRect = codeEl.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      codeEl.scrollTop += targetRect.top - codeRect.top - codeEl.clientHeight / 2;
      if (recentCodeChange?.transient && recentCodeChange.code === code) {
        const change = recentCodeChange;
        target.addEventListener('animationend', () => {
          if (recentCodeChange !== change || !target.isConnected) return;
          recentCodeChange = null;
          if (focusedConfigPath === path) focusedConfigPath = null;
          const scrollTop = codeEl.scrollTop;
          const scrollLeft = codeEl.scrollLeft;
          highlightCode(codeEl);
          codeEl.scrollTop = scrollTop;
          codeEl.scrollLeft = scrollLeft;
        }, { once: true });
      }
    }
  }
}

// ==================== 标签页切换 ====================
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));

  document.getElementById(`tab-${tabName}`).classList.add('active');
  const panel = document.getElementById(`panel-${tabName}`);
  panel.classList.remove('hidden');
  panel.classList.add('active');

  if (tabName === 'code') {
    updateCodeOutput();
  } else if (tabName === 'source') {
    renderFullSource();
  }
}

async function renderFullSource() {
  const sourceContent = document.getElementById('source-content');
  if (fullSourceText !== null) {
    sourceContent.textContent = fullSourceText;
    return;
  }
  sourceContent.textContent = '正在加载 Cherry.config.js…';
  for (const url of [
    '../../packages/cherry-markdown/src/Cherry.config.js',
    'https://raw.githubusercontent.com/Tencent/cherry-markdown/dev/packages/cherry-markdown/src/Cherry.config.js',
  ]) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      fullSourceText = await response.text();
      sourceContent.textContent = fullSourceText;
      return;
    } catch (error) {
      // 当前部署未包含源码时继续尝试仓库原文件。
    }
  }
  sourceContent.textContent = '配置源文件加载失败，请使用右上角的 GitHub 链接查看。';
}

// ==================== 搜索功能 ====================
function applySearch(value) {
  const query = value.toLowerCase().trim();
  let totalMatches = 0;
  document.querySelectorAll('.config-category').forEach(cat => {
    let matches = 0;
    cat.querySelectorAll('.config-item').forEach(item => {
      const matched = !query || (item.dataset.searchText || '').includes(query);
      item.style.display = matched ? '' : 'none';
      if (matched) matches++;
    });
    totalMatches += matches;
    cat.hidden = !!query && matches === 0;
    cat.querySelector('.category-count').textContent = `${matches} 项`;
    if (query) {
      if (cat.dataset.preSearchOpen === undefined) {
        cat.dataset.preSearchOpen = String(cat.classList.contains('open'));
      }
      cat.classList.toggle('open', matches > 0);
      cat.querySelector('.category-header').setAttribute('aria-expanded', matches > 0);
    } else if (cat.dataset.preSearchOpen !== undefined) {
      const wasOpen = cat.dataset.preSearchOpen === 'true';
      cat.classList.toggle('open', wasOpen);
      cat.querySelector('.category-header').setAttribute('aria-expanded', wasOpen);
      delete cat.dataset.preSearchOpen;
    }
  });
  document.getElementById('search-empty').hidden = !query || totalMatches > 0;
}

function initSearch() {
  document.getElementById('search-input').addEventListener('input', (e) => {
    applySearch(e.target.value);
  });
}

function refreshFromConfigState() {
  renderConfigPanel();
  applySearch(document.getElementById('search-input').value);
  refreshPreview();
  updateCodeOutput(null);
}

// ==================== 预设配置 ====================
function applyPreset(presetName) {
  const preset = PRESETS[presetName];
  if (!preset) return;

  // 先重置
  initConfigState();

  // 应用预设覆盖
  Object.entries(preset.overrides).forEach(([key, value]) => {
    if (configState[key]) {
      // 对于 canDisable 的配置项，false 表示关闭该功能
      if (configState[key].canDisable && value === false) {
        configState[key].disabled = true;
      } else if (typeof value === 'boolean') {
        configState[key].enabled = value;
        configState[key].value = value;
        if (configState[key].canDisable) {
          configState[key].disabled = false;
        }
      } else {
        configState[key].value = cloneConfigValue(value);
        if (configState[key].canDisable) {
          configState[key].disabled = false;
        }
      }
    }
  });

  refreshFromConfigState();
  showToast(`已应用「${preset.name}」预设`);
}

// ==================== 导出功能 ====================
function showExportModal() {
  const modal = document.getElementById('export-modal');
  modal.classList.remove('hidden');
  const modalCode = document.getElementById('modal-code');
  modalCode.textContent = buildExportCode();
  highlightCode(modalCode);
}

function hideExportModal() {
  document.getElementById('export-modal').classList.add('hidden');
}

// ==================== 复制功能 ====================
function copyCode(sourceEl) {
  const text = sourceEl?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    showToast('代码已复制到剪贴板！');
  }).catch(() => {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('代码已复制到剪贴板！');
  });
}

// ==================== Toast 提示 ====================
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-check-circle mr-2 text-green-400"></i>${message}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ==================== 工具函数 ====================
// ==================== 初始化 ====================
function init() {
  initConfigState();
  renderConfigPanel();
  initSearch();

  // 标签页切换
  document.getElementById('tab-preview').addEventListener('click', () => switchTab('preview'));
  document.getElementById('tab-code').addEventListener('click', () => switchTab('code'));
  document.getElementById('tab-source').addEventListener('click', () => switchTab('source'));

  // 预设按钮
  document.getElementById('preset-default').addEventListener('click', () => applyPreset('default'));
  document.getElementById('preset-simple').addEventListener('click', () => applyPreset('simple'));
  document.getElementById('preset-full').addEventListener('click', () => applyPreset('full'));
  document.getElementById('preset-preview').addEventListener('click', () => applyPreset('preview'));

  // 重置按钮
  document.getElementById('btn-reset').addEventListener('click', () => {
    initConfigState();
    refreshFromConfigState();
    showToast('配置已重置为默认值');
  });

  // 导出按钮
  document.getElementById('btn-export').addEventListener('click', showExportModal);
  document.getElementById('modal-close').addEventListener('click', hideExportModal);
  document.getElementById('modal-overlay').addEventListener('click', hideExportModal);

  // 复制按钮
  document.getElementById('btn-copy').addEventListener('click', () => {
    copyCode(document.getElementById('code-output'));
  });
  document.getElementById('btn-modal-copy').addEventListener('click', () => {
    copyCode(document.getElementById('modal-code'));
  });

  updatePreview();
  updateCodeOutput();
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
