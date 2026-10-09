import { CONFIG_CATEGORIES } from './config-data.js';
import { cloneConfigValue, getToolbarItemKey } from './config-model.js';
import { escapeHtml } from './code-highlight.js';

const TEXT_PREVIEW_DELAY_MS = 150;

function readNumberInput(input, definition) {
  input.setCustomValidity('');
  const value = input.valueAsNumber;
  const valid = Number.isInteger(value) && input.validity.valid
    && (!definition.validate || definition.validate(value));
  const message = valid ? '' : (definition.validationMessage || `请输入 ${definition.min} 及以上的整数`);
  input.setCustomValidity(message);
  input.setAttribute('aria-invalid', String(!valid));
  const error = input.nextElementSibling;
  error.textContent = message ? `${message}；未应用，保留上一次有效值。` : '';
  error.hidden = valid;
  return valid ? value : null;
}

export function createConfigPanel({ getState, defaultConfig, onChange, onLocate }) {
  function renderConfigPanel() {
    const container = document.getElementById('config-categories');
    container.innerHTML = '';

    CONFIG_CATEGORIES.forEach((cat, catIdx) => {
      const catEl = document.createElement('div');
      catEl.className = 'config-category fade-in' + (catIdx < 3 ? ' open' : '');
      catEl.dataset.categoryId = cat.id;
      catEl.style.animationDelay = `${catIdx * 0.05}s`;

      catEl.innerHTML = `
        <button class="category-header" type="button" aria-expanded="${catIdx < 3}" aria-controls="category-items-${cat.id}">
          <span class="flex items-center gap-3">
            <span class="icon ${cat.iconBg}" aria-hidden="true">
              <i class="${cat.icon} ${cat.iconColor}"></i>
            </span>
            <span class="category-title">
              <span class="category-name">${cat.name}</span>
              <span class="category-description">${cat.description}</span>
            </span>
          </span>
          <span class="flex items-center gap-2">
            <span class="category-count">${cat.items.length} 项</span>
            <i class="fa-solid fa-chevron-down chevron" aria-hidden="true"></i>
          </span>
        </button>
        <div class="category-body" id="category-items-${cat.id}">
          <div class="config-items-list"></div>
        </div>
      `;

      const itemsList = catEl.querySelector('.config-items-list');
      cat.items.forEach(item => {
        itemsList.appendChild(renderConfigItem(item));
      });

      // 折叠/展开
      const categoryHeader = catEl.querySelector('.category-header');
      categoryHeader.addEventListener('click', () => {
        catEl.classList.toggle('open');
        categoryHeader.setAttribute('aria-expanded', catEl.classList.contains('open'));
      });

      container.appendChild(catEl);
    });
  }

  function commitConfigChange(item, element, {
    rerender = false,
    path = item.path,
    wholeValue = false,
    transient = false,
    previewDelay = 0,
  } = {}) {
    if (rerender) element.replaceWith(renderConfigItem(item));
    onChange(path, { wholeValue, transient, previewDelay });
  }

  function renderValueInput(item, state) {
    let valueHtml = '';
    if (item.inputType === 'toggle') {
      const checked = (item.type === 'boolean' ? state.value : state.enabled) ? 'checked' : '';
      valueHtml = `
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" class="sr-only peer toggle-input" data-key="${item.key}" ${checked}>
          <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
        </label>
      `;
    } else if (item.inputType === 'select') {
      const opts = item.options.map(o =>
        `<option value="${o}" ${state.value === o ? 'selected' : ''}>${o}</option>`
      ).join('');
      valueHtml = `<select class="config-select value-input" data-key="${item.key}">${opts}</select>`;
    } else if (item.inputType === 'text') {
      const numberAttributes = item.type === 'number' ? `step="1" min="${item.min}"` : '';
      valueHtml = `<input type="${item.type === 'number' ? 'number' : 'text'}" ${numberAttributes} class="config-value-input value-input" data-key="${item.key}" value="${escapeHtml(String(state.value))}">`;
      if (item.type === 'number') valueHtml += '<span class="config-input-error" role="status" hidden></span>';
    } else if (item.inputType === 'textarea') {
      valueHtml = `<textarea class="config-value-input config-textarea value-input" data-key="${item.key}" rows="5">${escapeHtml(String(state.value))}</textarea>`;
    } else if (item.inputType === 'toolbar-select') {
      // 如果支持 canDisable，增加一个"关闭"开关
      if (item.canDisable) {
        const isDisabled = state.disabled;
        const disableChecked = isDisabled ? '' : 'checked';
        valueHtml = `
          <div class="flex items-center gap-2 mb-1">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer disable-toggle" data-key="${item.key}" ${disableChecked}>
              <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
            </label>
            <span class="text-xs ${isDisabled ? 'text-red-500 font-medium' : 'text-gray-500'}">
              ${isDisabled ? '<i class="fa-solid fa-ban mr-1"></i>已关闭（值为 false）' : '启用中（数组模式）'}
            </span>
          </div>
        `;
        if (!isDisabled) {
          valueHtml += renderToolbarChips(item.key, item.options, state.value);
        }
      } else {
        valueHtml = renderToolbarChips(item.key, item.options, state.value);
      }
    }

    return valueHtml;
  }

  function bindToolbarEvents(item, div, configState) {
    // 工具栏芯片（普通按钮toggle）
    div.querySelectorAll('.toolbar-chip:not(.separator-add-btn)').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.parentKey;
        if (configState[key] && configState[key].disabled) return;
        const val = chip.dataset.value;
        const arr = configState[key].value;
        // 普通按钮：toggle（移除所有该值的实例，或添加一个）
        const idx = arr.findIndex(entry => getToolbarItemKey(entry) === val);
        if (idx > -1) {
          // 移除所有该值的实例
          configState[key].value = arr.filter(entry => getToolbarItemKey(entry) !== val);
        } else {
          const defaultItem = defaultConfig.toolbars.toolbar.find(entry => getToolbarItemKey(entry) === val);
          arr.push(defaultItem && typeof defaultItem === 'object' ? cloneConfigValue(defaultItem) : val);
        }
        commitConfigChange(item, div, { rerender: true });
      });
    });

    // 分割线添加按钮
    div.querySelectorAll('.separator-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.parentKey;
        if (configState[key] && configState[key].disabled) return;
        configState[key].value.push('|');
        commitConfigChange(item, div, { rerender: true });
      });
    });

    // 排序区：分割线删除按钮
    div.querySelectorAll('.sort-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.parentKey;
        const idx = parseInt(btn.dataset.sortIdx);
        configState[key].value.splice(idx, 1);
        commitConfigChange(item, div, { rerender: true });
      });
    });

    // 排序区：拖拽排序
    const sortArea = div.querySelector('.toolbar-sort-area');
    if (sortArea) {
      let dragSrcIdx = null;
      sortArea.querySelectorAll('.sort-item').forEach(sortItem => {
        sortItem.addEventListener('dragstart', (e) => {
          dragSrcIdx = parseInt(sortItem.dataset.sortIdx);
          sortItem.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', dragSrcIdx);
        });
        sortItem.addEventListener('dragend', () => {
          sortItem.classList.remove('dragging');
          sortArea.querySelectorAll('.sort-item').forEach(si => si.classList.remove('drag-over'));
        });
        sortItem.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          sortArea.querySelectorAll('.sort-item').forEach(si => si.classList.remove('drag-over'));
          sortItem.classList.add('drag-over');
        });
        sortItem.addEventListener('dragleave', () => {
          sortItem.classList.remove('drag-over');
        });
        sortItem.addEventListener('drop', (e) => {
          e.preventDefault();
          const targetIdx = parseInt(sortItem.dataset.sortIdx);
          const key = sortItem.dataset.parentKey;
          if (dragSrcIdx !== null && dragSrcIdx !== targetIdx) {
            const arr = configState[key].value;
            const [moved] = arr.splice(dragSrcIdx, 1);
            arr.splice(targetIdx, 0, moved);
            commitConfigChange(item, div, { rerender: true });
          }
          dragSrcIdx = null;
        });
      });
    }

  }

  function bindConfigItemEvents(item, div, configState) {
    // canDisable 关闭开关
    const disableToggle = div.querySelector('.disable-toggle');
    if (disableToggle) {
      disableToggle.addEventListener('change', (e) => {
        configState[item.key].disabled = !e.target.checked;
        commitConfigChange(item, div, { rerender: true, wholeValue: true });
      });
    }

    // Toggle 开关
    const toggle = div.querySelector('.toggle-input');
    if (toggle) {
      toggle.addEventListener('change', (e) => {
        configState[item.key].enabled = e.target.checked;
        if (item.type === 'boolean') {
          configState[item.key].value = e.target.checked;
        }
        commitConfigChange(item, div, { rerender: true, wholeValue: true });
      });
    }

    // 值输入
    const valueInput = div.querySelector('.value-input');
    if (valueInput) {
      const eventType = valueInput.tagName === 'SELECT' ? 'change' : 'input';
      valueInput.addEventListener(eventType, (e) => {
        const value = item.type === 'number' ? readNumberInput(e.target, item) : e.target.value;
        if (value === null) return;
        configState[item.key].value = value;
        commitConfigChange(item, div, {
          transient: item.type === 'string',
          previewDelay: e.type === 'input' ? TEXT_PREVIEW_DELAY_MS : 0,
        });
      });
    }

    bindToolbarEvents(item, div, configState);

    // 子项事件
    div.querySelectorAll('.sub-input').forEach(input => {
      const subIdx = parseInt(input.dataset.subIdx);
      const eventType = input.tagName === 'SELECT' || input.type === 'checkbox' ? 'change' : 'input';
      input.addEventListener(eventType, (e) => {
        const subItems = configState[item.key].subItems;
        if (subItems && subItems[subIdx]) {
          if (input.type === 'checkbox') {
            subItems[subIdx].value = e.target.checked;
          } else if (input.type === 'number') {
            const value = readNumberInput(input, subItems[subIdx]);
            if (value === null) return;
            subItems[subIdx].value = value;
          } else {
            subItems[subIdx].value = e.target.value;
          }
          commitConfigChange(item, div, {
            path: [item.path, subItems[subIdx].key].join('.'),
            wholeValue: input.type === 'checkbox',
            transient: subItems[subIdx].type === 'string',
            previewDelay: e.type === 'input' ? TEXT_PREVIEW_DELAY_MS : 0,
          });
        }
      });
    });

    // 在完整配置代码中定位当前配置项
    div.querySelector('.source-btn').addEventListener('click', () => {
      onLocate(item.path);
    });
  }

  function renderConfigItem(item) {
    const configState = getState();
    const state = configState[item.key];
    const div = document.createElement('div');
    div.className = 'config-item';
    div.dataset.key = item.key;
    div.dataset.searchText = `${item.name} ${item.path} ${item.description}`.toLowerCase();

    const valueHtml = renderValueInput(item, state);

    // 子配置项
    let subHtml = '';
    if (state.subItems && state.subItems.length > 0 && state.enabled) {
      subHtml = '<div class="mt-2 pl-2 border-l-2 border-gray-100 space-y-1.5">';
      state.subItems.forEach((sub, idx) => {
        subHtml += renderSubItem(item.key, sub, idx);
      });
      subHtml += '</div>';
    }

    div.innerHTML = `
      <div class="item-info">
        <div class="item-name">
          ${item.name}
          <span class="tag tag-type">${item.canDisable ? item.type + ' | false' : item.type}</span>
        </div>
        <div class="item-path">${item.path}</div>
        <div class="item-desc">${item.description}</div>
        <div class="value-area">${valueHtml}</div>
        ${subHtml}
      </div>
      <div class="item-actions">
        <button class="action-btn source-btn" type="button" data-key="${item.key}" title="在完整配置代码中定位${item.name}" aria-label="在完整配置代码中定位${item.name}">
          <i class="fa-solid fa-code" aria-hidden="true"></i><span>定位</span>
        </button>
      </div>
    `;

    // 绑定事件
    bindConfigItemEvents(item, div, configState);

    return div;
  }

  function renderSubItem(parentKey, sub, idx) {
    let inputHtml = '';
    if (sub.type === 'boolean') {
      inputHtml = `
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" class="sr-only peer sub-input" data-parent-key="${parentKey}" data-sub-idx="${idx}" ${sub.value ? 'checked' : ''}>
          <div class="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-400"></div>
        </label>`;
    } else if (sub.type === 'number') {
      inputHtml = `<div class="number-field">
        <input type="number" step="1" min="${sub.min}" class="config-value-input sub-input" style="max-width:80px" data-parent-key="${parentKey}" data-sub-idx="${idx}" value="${sub.value}">
        <span class="config-input-error" role="status" hidden></span>
      </div>`;
    } else if (sub.type === 'string') {
      inputHtml = `<input type="text" class="config-value-input sub-input" data-parent-key="${parentKey}" data-sub-idx="${idx}" value="${escapeHtml(String(sub.value))}">`;
    } else if (sub.type === 'select') {
      const opts = sub.options.map(o =>
        `<option value="${o}" ${sub.value === o ? 'selected' : ''}>${o === '' ? '默认（不设置 target）' : o}</option>`
      ).join('');
      inputHtml = `<select class="config-select sub-input" data-parent-key="${parentKey}" data-sub-idx="${idx}">${opts}</select>`;
    }

    return `
      <div class="flex items-center justify-between gap-2 py-0.5">
        <span class="text-xs text-gray-500">${sub.name}</span>
        ${inputHtml}
      </div>
    `;
  }

  // 工具栏按钮名称映射（英文key -> 中文名称）
  const TOOLBAR_BUTTON_LABELS = {
    'bold': '加粗',
    'italic': '斜体',
    'strikethrough': '删除线',
    'sub': '下标',
    'sup': '上标',
    'header': '标题',
    'list': '列表',
    'ol': '有序列表',
    'ul': '无序列表',
    'checklist': '检查列表',
    'graph': '图形',
    'size': '尺寸',
    'h1': '一级标题',
    'h2': '二级标题',
    'h3': '三级标题',
    'color': '颜色',
    'quote': '引用',
    'quickTable': '快速表格',
    'togglePreview': '切换预览',
    'code': '代码',
    'inlineCode': '内联代码',
    'codeTheme': '代码主题',
    'export': '导出',
    'settings': '设置',
    'fullScreen': '全屏',
    'mobilePreview': '移动预览',
    'copy': '复制',
    'undo': '撤销',
    'redo': '重做',
    'underline': '下划线',
    'switchModel': '切换模型',
    'image': '图像',
    'audio': '音频',
    'video': '视频',
    'br': '换行',
    'hr': '水平线',
    'formula': '公式',
    'link': '链接',
    'table': '表格',
    'toc': '目录',
    'proTable': '表格图表',
    'pdf': 'PDF',
    'word': 'Word',
    'ruby': 'Ruby',
    'theme': '主题',
    'file': '文件',
    'panel': '信息面板',
    'align': '对齐',
    'detail': '手风琴',
    'drawIo': 'DrawIo',
    'wordCount': '字数统计',
    'cursorPosition': '光标位置',
    'changeLocale': '切换语言',
    'shortcutKey': '快捷键',
    'insert': '插入菜单',
  };

  function getButtonLabel(val) {
    const key = getToolbarItemKey(val);
    return TOOLBAR_BUTTON_LABELS[key] || key;
  }

  function renderToolbarChips(key, options, selectedValues) {
    // 候选区：普通按钮（不含分割线）
    const normalOptions = options.filter(opt => opt !== '|');
    const candidateChips = normalOptions.map(opt => {
      const active = selectedValues.some(value => getToolbarItemKey(value) === opt) ? 'active' : '';
      const label = getButtonLabel(opt);
      return `<span class="toolbar-chip ${active}" data-parent-key="${key}" data-value="${opt}" title="${opt}">${label}</span>`;
    }).join('');

    // 添加分割线按钮
    const addSeparatorBtn = `<span class="toolbar-chip separator-add-btn" data-parent-key="${key}" data-value="|" title="点击添加分割线">
      <i class="fa-solid fa-grip-lines-vertical" style="margin-right:2px;"></i> | 分割线
    </span>`;

    // 已选排序区：展示当前已选项的顺序，支持拖拽排序
    let sortArea = '';
    if (selectedValues.length > 0) {
      const sortItems = selectedValues.map((val, idx) => {
        const isSep = val === '|';
        const label = isSep ? '|' : getButtonLabel(val);
        const cls = isSep ? 'sort-item separator-item' : 'sort-item';
        return `<span class="${cls}" draggable="true" data-parent-key="${key}" data-sort-idx="${idx}" data-value="${getToolbarItemKey(val)}" title="${isSep ? '分割线（拖拽排序 / 点击删除）' : label + '（拖拽排序）'}">
          <i class="fa-solid fa-grip-vertical sort-handle"></i>
          <span class="sort-label">${label}</span>
          ${isSep ? '<i class="fa-solid fa-xmark sort-remove" data-parent-key="' + key + '" data-sort-idx="' + idx + '"></i>' : ''}
        </span>`;
      }).join('');
      sortArea = `
        <div class="sort-area-label"><i class="fa-solid fa-arrow-down-short-wide" style="margin-right:4px;"></i>已选顺序（拖拽排序）：</div>
        <div class="toolbar-sort-area" data-parent-key="${key}">${sortItems}</div>
      `;
    }

    return `
      <div class="toolbar-items-grid">${candidateChips}${addSeparatorBtn}</div>
      ${sortArea}
    `;
  }

  return { render: renderConfigPanel };
}
