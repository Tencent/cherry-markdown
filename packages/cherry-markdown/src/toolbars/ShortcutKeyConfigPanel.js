import {
  getAllowedShortcutKey,
  keyStackIsModifierkeys,
  ENTER_KEY,
  BACKSPACE_KEY,
  keyStack2UniqueString,
  shortcutCode2Key,
  isEnableShortcutKey,
  setDisableShortcutKey,
  storageKeyMap,
  clearStorageKeyMap,
  mac,
} from '@/utils/shortcutKey';
import { createElement } from '@/utils/dom';

export default class ShortcutKeyConfigPanel {
  /**
   *
   * @param {Partial<import('@/Cherry').default> & {$currentMenuOptions?:import('~types/menus').CustomMenuConfig}} $cherry
   */
  constructor($cherry) {
    this.$cherry = $cherry;
    this.shortcutUlClassName = 'cherry-shortcut-key-config-panel-ul';
    this.shortcutUlId = this.shortcutUlClassName;
    this.shortcutConfigPanelKbdClassName = 'shortcut-key-config-panel-kbd';
    this.shortcutKeyboardKeyClassName = 'keyboard-key';
    this.activeTab = 'custom'; // 默认显示自定义快捷键的tab
    this.editingItem = null; // 当前正在编辑的项
    this.keyStack = []; // 当前编辑的快捷键栈
    this.originalKeyStack = null; // 保存原始快捷键栈

    // 点击标签切换快捷键类型（可自定义/静态）
    this.handleTabClick = (/** @type {MouseEvent} */ e) => {
      if (e.target instanceof HTMLElement) {
        const tab = e.target.closest('.shortcut-tab');
        if (tab instanceof HTMLElement) {
          const tabId = tab.dataset.tab;
          if (tabId) {
            this.switchTab(tabId);
          }
        }
      }
    };

    // 点击编辑按钮
    this.handleEditBtnClick = (/** @type {MouseEvent} */ e, /** @type {HTMLElement} */ item) => {
      e.preventDefault();
      e.stopPropagation();

      // 如果有其他正在编辑的项，先取消编辑
      if (this.editingItem && this.editingItem !== item) {
        this.cancelEdit(this.editingItem);
      }

      // 开始编辑当前项
      this.startEdit(item);
    };

    // 双击快捷键区域
    this.handleDbClick = (/** @type {MouseEvent} */ e) => {
      if (!(e.target instanceof HTMLElement)) return;
      // 如果快捷键被禁用，不处理双击事件
      if (!isEnableShortcutKey(this.$cherry.nameSpace)) {
        return;
      }
      // 找到最近的快捷键项
      const item = e.target.closest('.shortcut-key-item');
      if (!(item instanceof HTMLElement)) {
        return;
      }
      // 如果是静态快捷键，不处理双击事件
      if (this.activeTab === 'static') {
        return;
      }
      // 如果有其他正在编辑的项，先取消编辑
      if (this.editingItem && this.editingItem !== item) {
        this.cancelEdit(this.editingItem);
      }
      // 开始编辑当前项
      this.startEdit(item);
    };

    // 点击保存按钮
    this.handleSaveBtnClick = (/** @type {MouseEvent} */ e, /** @type {HTMLElement} */ item) => {
      e.preventDefault();
      e.stopPropagation();
      this.saveEdit(item);
    };

    // 点击取消编辑按钮
    this.handleCancelBtnClick = (/** @type {MouseEvent} */ e, /** @type {HTMLElement} */ item) => {
      e.preventDefault();
      e.stopPropagation();
      this.cancelEdit(item);
    };

    // 处理键盘按键事件
    this.handleKeyDown = (/** @type {KeyboardEvent} */ e) => {
      if (!this.editingItem) return;

      e.preventDefault();
      e.stopPropagation();

      if (e.key === ENTER_KEY || e.key === BACKSPACE_KEY) {
        if (e.key === ENTER_KEY) {
          // 按enter键可保存编辑
          this.saveEdit(this.editingItem);
          return;
        }
        // 按backspace键可删除最新加入的键
        if (this.keyStack.length === 1) {
          this.cancelEdit(this.editingItem);
          return;
        }
        this.keyStack.pop(); // 按键出栈
        this.updateEditingKeys();
      }

      const newKeyStack = getAllowedShortcutKey(e);
      if (!keyStackIsModifierkeys(newKeyStack) && Array.isArray(newKeyStack) && newKeyStack.length >= 2) {
        this.keyStack = newKeyStack;
        this.updateEditingKeys();
      }
    };

    // 点击禁用按钮
    this.clickSettingsDisableBtn = () => {
      // 如果有其他正在编辑的项，先取消编辑
      if (this.editingItem) {
        this.cancelEdit(this.editingItem);
      }
      const isEnabled = isEnableShortcutKey(this.$cherry.nameSpace);
      if (!isEnabled) {
        setDisableShortcutKey(this.$cherry.nameSpace, 'enable');
        this.dom.classList.remove('disable');
        this.$cherry.editor.disableShortcut(false);
        this.updateTipText(this.activeTab === 'static' ? 'static' : 'default');
      } else {
        setDisableShortcutKey(this.$cherry.nameSpace, 'disable');
        this.dom.classList.add('disable');
        this.$cherry.editor.disableShortcut(true);
        this.updateTipText();
      }
      // 更新按钮文本和图标
      const disableBtn = this.dom.querySelector('.j-shortcut-settings-disable-btn');
      if (disableBtn instanceof HTMLElement) {
        disableBtn.innerHTML = `<i class="ch-icon ${
          isEnabled ? 'ch-icon-command' : 'ch-icon-cherry-table-delete'
        }"></i> ${isEnabled ? this.$cherry.locale.enableShortcut : this.$cherry.locale.disableShortcut}`;
      }
    };

    // 点击恢复默认按钮
    this.clickSettingsRecoverBtn = () => {
      if (this.editingItem) {
        this.cancelEdit(this.editingItem);
      }
      setDisableShortcutKey(this.$cherry.nameSpace, 'enable');
      this.dom.classList.remove('disable');
      this.$cherry.editor.disableShortcut(false);
      this.$cherry.toolbar.shortcutKeyMap = {};
      this.$cherry.toolbar.collectShortcutKey(false);
      storageKeyMap(this.$cherry.nameSpace, this.$cherry.toolbar.shortcutKeyMap);
      this.dom.innerHTML = this.generateShortcutKeyConfigPanelHtmlStr();
      this.show();
      this.updateTipText(this.activeTab === 'static' ? 'static' : 'default');
      clearStorageKeyMap(this.$cherry.nameSpace);
    };

    this.init();
  }

  /**
   * 开始编辑快捷键
   * @param {HTMLElement} item
   */
  startEdit(item) {
    this.editingItem = item;
    item.classList.add('editing');

    // 获取并保存当前快捷键
    const kbdContainer = item.querySelector(`.${this.shortcutConfigPanelKbdClassName}`);
    if (kbdContainer) {
      this.originalKeyStack = Array.from(kbdContainer.children)
        .map((key) => {
          if (key instanceof HTMLElement) {
            return key.dataset.code || '';
          }
          return '';
        })
        .filter(Boolean);
      this.keyStack = [...this.originalKeyStack];
    }

    this.updateTipText('editing');

    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeyDown);

    // 添加点击外部区域的事件监听
    this.handleClickOutside = (/** @type {MouseEvent} */ e) => {
      if (!(e.target instanceof HTMLElement)) return;
      // 如果点击的不是编辑区域内的元素，取消编辑
      const isClickInEditingItem = e.target.closest('.shortcut-key-item.editing');
      if (!isClickInEditingItem) {
        this.cancelEdit(item);
      }
    };
    document.addEventListener('click', this.handleClickOutside);
  }

  /**
   * 处理单个按键，返回对应的 HTML 字符串
   * @param {string} key 按键字符串
   * @param {boolean} [withCode=true] 是否包含 data-code 属性
   * @returns {string} 生成的 HTML 字符串
   */
  processKeyToSpan(key, withCode = true) {
    // 如果是鼠标左键，直接返回文本
    if (key === this.$cherry.locale.leftMouseButton) {
      return key;
    }

    const matchRes = shortcutCode2Key(key, mac);
    const shortKey = matchRes ?? {
      text: key,
      tip: key,
    };

    return this.generateKeyboardKeySpan({
      title: shortKey.tip,
      code: withCode ? key : undefined,
      text: shortKey.text,
    });
  }

  /**
   * 将按键数组转换为带分隔符的 HTML 字符串
   * @param {string[]} keys 按键数组
   * @param {boolean} [withCode=true] 是否在按键 span 中包含 data-code 属性
   * @returns {string} 生成的 HTML 字符串
   */
  processKeysToHtml(keys, withCode = true) {
    return keys.map((key) => this.processKeyToSpan(key, withCode)).join('<span class="shortcut-split">+</span>');
  }

  /**
   * 更新快捷键显示内容
   * @param {HTMLElement} kbdContainer 快捷键容器元素
   * @param {string[]} keys 快捷键数组
   */
  updateKeyboardContainer(kbdContainer, keys) {
    if (!(kbdContainer instanceof HTMLElement)) return;
    kbdContainer.innerHTML = this.processKeysToHtml(keys);
  }

  /**
   * 更新提示文本
   * @param {'default' | 'editing' | 'static'} type 提示类型
   */
  updateTipText(type = 'default') {
    const tipElement = this.dom.querySelector('.shortcut-panel-tips');
    if (!(tipElement instanceof HTMLElement)) return;

    // 如果快捷键被禁用，显示禁用状态提示
    if (!isEnableShortcutKey(this.$cherry.nameSpace)) {
      tipElement.innerHTML = this.$cherry.locale.disabledShortcutTip;
      return;
    }

    switch (type) {
      case 'editing':
        tipElement.innerHTML = this.$cherry.locale.editingShortcutKeyConfigTip;
        break;
      case 'static':
        tipElement.innerHTML = this.$cherry.locale.staticShortcutTip;
        break;
      default:
        tipElement.innerHTML = this.$cherry.locale.editShortcutKeyConfigTip;
    }
  }

  /**
   * 取消编辑的快捷键
   * @param {HTMLElement} item
   */
  cancelEdit(item) {
    item.classList.remove('editing');
    if (this.editingItem === item) {
      // 恢复原来的快捷键显示
      const kbdContainer = item.querySelector(`.${this.shortcutConfigPanelKbdClassName}`);
      if (kbdContainer instanceof HTMLElement && this.originalKeyStack) {
        this.updateKeyboardContainer(kbdContainer, this.originalKeyStack);
      }
      this.editingItem = null;
      this.keyStack = [];
      this.originalKeyStack = null;
      document.removeEventListener('keydown', this.handleKeyDown);
      // 移除点击外部区域的事件监听
      if (this.handleClickOutside) {
        document.removeEventListener('click', this.handleClickOutside);
        this.handleClickOutside = null;
      }
      this.updateTipText(this.activeTab === 'static' ? 'static' : 'default');
    }
  }

  /**
   * 保存编辑的快捷键
   * @param {HTMLElement} item
   */
  saveEdit(item) {
    if (!this.editingItem || !this.keyStack.length) return;

    const kbdContainer = item.querySelector(`.${this.shortcutConfigPanelKbdClassName}`);
    if (!(kbdContainer instanceof HTMLElement)) return;

    const { hookname = '' } = item.dataset;

    if (hookname) {
      // 触发更新快捷键
      this.$cherry?.toolbar?.updateShortcutKeyMap(
        keyStack2UniqueString(this.originalKeyStack || []),
        keyStack2UniqueString(this.keyStack),
      );

      this.updateKeyboardContainer(kbdContainer, this.keyStack);
    }

    this.editingItem = null;
    this.keyStack = [];
    this.originalKeyStack = null;
    document.removeEventListener('keydown', this.handleKeyDown);
    // 移除点击外部区域的事件监听
    if (this.handleClickOutside) {
      document.removeEventListener('click', this.handleClickOutside);
      this.handleClickOutside = null;
    }
    item.classList.remove('editing');
    this.updateTipText(this.activeTab === 'static' ? 'static' : 'default');
  }

  /**
   * 更新编辑中的快捷键显示
   */
  updateEditingKeys() {
    if (!this.editingItem) return;

    const kbdContainer = this.editingItem.querySelector(`.${this.shortcutConfigPanelKbdClassName}`);
    if (!(kbdContainer instanceof HTMLElement)) return;

    this.updateKeyboardContainer(kbdContainer, this.keyStack);
  }

  /**
   * 切换快捷键配置面板的tab
   * @param {string} tabId
   */
  switchTab(tabId) {
    this.activeTab = tabId;
    const tabs = this.dom.querySelectorAll('.shortcut-tab');
    const panels = this.dom.querySelectorAll('.shortcut-panel');

    tabs.forEach((tab) => {
      if (tab instanceof HTMLElement && tab.dataset.tab === tabId) {
        tab.classList.add('active');
      } else if (tab instanceof HTMLElement) {
        tab.classList.remove('active');
      }
    });

    panels.forEach((panel) => {
      if (panel instanceof HTMLElement && panel.dataset.panel === tabId) {
        panel.classList.add('active');
      } else if (panel instanceof HTMLElement) {
        panel.classList.remove('active');
      }
    });

    // 根据标签页和编辑状态更新提示文本
    if (tabId === 'static') {
      this.updateTipText('static');
    } else if (this.editingItem) {
      this.updateTipText('editing');
    } else {
      this.updateTipText('default');
    }
  }

  /**
   * 初始化快捷键配置面板
   */
  init() {
    if (this.$cherry?.toolbar?.shortcutKeyMap) {
      this.dom = document.createElement('div');
      this.dom.className = [
        'cherry-dropdown',
        'cherry-shortcut-key-config-panel',
        'cherry-shortcut-key-config-panel-wrapper',
      ].join(' ');
      this.dom.innerHTML = this.generateShortcutKeyConfigPanelHtmlStr();
      // 实例化后，将容器插入到富文本编辑器中，默认隐藏
      this.dom.style.display = 'none';
      if (!isEnableShortcutKey(this.$cherry.nameSpace)) {
        this.dom.classList.add('disable');
      }
      this.$cherry.wrapperDom.append(this.dom);
    }
  }

  /**
   * 生成快捷键span标签HTML字符串
   * @param {Object} params 参数对象
   * @param {string} params.title 提示文本
   * @param {string} [params.code] 按键代码（可选）
   * @param {string} params.text 显示文本
   * @returns {string} 生成的HTML字符串
   */
  generateKeyboardKeySpan({ title, code, text }) {
    const attributes = {
      title,
    };
    if (code) {
      attributes['data-code'] = code;
    }
    const span = createElement('span', this.shortcutKeyboardKeyClassName, attributes);
    span.textContent = text;
    return span.outerHTML;
  }

  /**
   * 获取快捷键的别名i18n
   * @param {string} aliasName
   * @returns {string} 别名
   */
  getAliasLocale(aliasName) {
    const aliasNames = aliasName.split('-');
    return aliasNames.map((name) => this.$cherry.locale[name] || name).join('-');
  }

  /**
   * 生成快捷键配置面板HTML字符串
   * @returns {string} 生成的HTML字符串
   */
  generateShortcutKeyConfigPanelHtmlStr() {
    const liStr = Object.entries(this.$cherry.toolbar.shortcutKeyMap ?? {})
      .filter(([key, val]) => typeof val === 'object' && val)
      .map(([key, val]) => {
        const { hookName, aliasName, ...rest } = val;
        let otherDataSet = '';
        if (rest && typeof rest === 'object') {
          otherDataSet = Object.entries(rest)
            .map(([otherField, fieldValue]) => `data-${otherField}=${fieldValue}`)
            .join(' ');
        }
        return `<li class="cherry-dropdown-item shortcut-key-item" data-hookname=${hookName} ${otherDataSet}>
          <div class="shortcut-key-config-panel-name">${this.getAliasLocale(aliasName)}</div>
          <div class="shortcut-key-right">
            <div class="edit-btn" title="${this.$cherry.locale.edit}">
              <i class="ch-icon ch-icon-pen-fill"></i>
            </div>
            <div class="edit-actions">
              <div class="action-btn save" title="${this.$cherry.locale.save}">
                <i class="ch-icon ch-icon-ok"></i>
              </div>
              <div class="action-btn cancel" title="${this.$cherry.locale.cancel}">
                <i class="ch-icon ch-icon-close"></i>
              </div>
            </div>
            <div class="${this.shortcutConfigPanelKbdClassName}">
              ${this.processKeysToHtml(key.split('-'))}
            </div>
          </div>
        </li>`;
      })
      .join('');

    //   <div class="cherry-dropdown-item">
    //   <input type="checkbox" id="enableMacControl" name="enableMacControl" checked />
    //   <label for="enableMacControl">启用Mac平台的Control键</label>
    // </div>
    const ulStr = `
      <div class="cherry-shortcut-key-config-panel-inner">
        <div class="shortcut-panel-settings">
          <btn class="shortcut-settings-btn j-shortcut-settings-disable-btn"><i class="ch-icon ${
            !isEnableShortcutKey(this.$cherry.nameSpace) ? 'ch-icon-command' : 'ch-icon-cherry-table-delete'
          }"></i> ${
            !isEnableShortcutKey(this.$cherry.nameSpace)
              ? this.$cherry.locale.enableShortcut
              : this.$cherry.locale.disableShortcut
          }</btn>
          <btn class="shortcut-settings-btn j-shortcut-settings-recover-btn"><i class="ch-icon ch-icon-undo"></i> ${
            this.$cherry.locale.recoverShortcut
          }</btn>
        </div>
        <div class="shortcut-tabs">
          <div class="shortcut-tab active" data-tab="custom">${this.$cherry.locale.customShortcut}</div>
          <div class="shortcut-tab" data-tab="static">${this.$cherry.locale.staticShortcut}</div>
        </div>
        <div class="shortcut-panels">
          <div class="shortcut-panel active" data-panel="custom">
            <ul class="${this.shortcutUlClassName}" id="${this.shortcutUlId}">${liStr}</ul>
          </div>
          <div class="shortcut-panel" data-panel="static">
            ${this.$getStaticShortcut()}
          </div>
        </div>
        <div class="shortcut-panel-tips">${this.$cherry.locale.editShortcutKeyConfigTip}</div>
      </div>`;
    return ulStr;
  }

  /**
   * 定义不支持修改的快捷键信息（是codemirror提供的类sublime快捷键）
   */
  $getStaticShortcut() {
    if (this.$cherry.options.editor.keyMap === 'vim') {
      return '';
    }
    const pcList = [
      { name: this.$cherry.locale.shortcutStatic1, key: 'Control+[' },
      { name: this.$cherry.locale.shortcutStatic2, key: 'Control+]' },
      { name: this.$cherry.locale.shortcutStatic3, key: 'Control+Shift+D' },
      { name: this.$cherry.locale.shortcutStatic4, key: 'Control+Enter' },
      { name: this.$cherry.locale.shortcutStatic5, key: 'Control+Shift+Enter' },
      { name: this.$cherry.locale.shortcutStatic6, key: 'Control+Shift+↑' },
      { name: this.$cherry.locale.shortcutStatic7, key: 'Control+Shift+↓' },
      { name: this.$cherry.locale.shortcutStatic8, key: 'Control+Shift+K' },
      { name: this.$cherry.locale.shortcutStatic9, key: 'Control+Shift+←' },
      { name: this.$cherry.locale.shortcutStatic10, key: 'Control+Shift+→' },
      { name: this.$cherry.locale.shortcutStatic11, key: 'Control+Backspace' },
      { name: this.$cherry.locale.shortcutStatic12, key: 'Control+Shift+M' },
      { name: this.$cherry.locale.shortcutStatic13, key: `Control+${this.$cherry.locale.leftMouseButton}` },
      { name: this.$cherry.locale.shortcutStatic14, key: 'Control+Shift+L' },
      { name: this.$cherry.locale.shortcutStatic16, key: 'Alt+F3' },
      { name: this.$cherry.locale.shortcutStatic17, key: 'Control+Z' },
      { name: this.$cherry.locale.shortcutStatic18, key: 'Control+Y' },
    ];
    const macList = [
      { name: this.$cherry.locale.shortcutStatic1, key: 'Meta+[' },
      { name: this.$cherry.locale.shortcutStatic2, key: 'Meta+]' },
      { name: this.$cherry.locale.shortcutStatic3, key: 'Meta+Shift+D' },
      { name: this.$cherry.locale.shortcutStatic4, key: 'Meta+Enter' },
      { name: this.$cherry.locale.shortcutStatic5, key: 'Meta+Shift+Enter' },
      { name: this.$cherry.locale.shortcutStatic6, key: 'Control+Meta+↑' },
      { name: this.$cherry.locale.shortcutStatic7, key: 'Control+Meta+↓' },
      { name: this.$cherry.locale.shortcutStatic8, key: 'Control+Shift+K' },
      { name: this.$cherry.locale.shortcutStatic9, key: 'Control+Shift+←' },
      { name: this.$cherry.locale.shortcutStatic10, key: 'Control+Shift+→' },
      { name: this.$cherry.locale.shortcutStatic11, key: 'Alt+Backspace' },
      { name: this.$cherry.locale.shortcutStatic12, key: 'Meta+Shift+M' },
      { name: this.$cherry.locale.shortcutStatic13, key: `Meta+${this.$cherry.locale.leftMouseButton}` },
      { name: this.$cherry.locale.shortcutStatic14, key: 'Meta+Shift+L' },
      { name: this.$cherry.locale.shortcutStatic16, key: 'Alt+F3' },
      { name: this.$cherry.locale.shortcutStatic17, key: 'Meta+Z' },
      { name: this.$cherry.locale.shortcutStatic18, key: 'Meta+Y' },
    ];
    const list = mac ? macList : pcList;
    const li = [];
    for (let i = 0; i < list.length; i++) {
      const one = list[i];
      li.push(`
        <li class="cherry-dropdown-item shortcut-key-item">
          <div class="shortcut-key-config-panel-name">${one.name}</div>
          <div class="shortcut-key-right-static">
            <div class="${this.shortcutConfigPanelKbdClassName}">
              ${this.processKeysToHtml(one.key.split('+'), false)}
            </div>
          </div>
        </li>
      `);
    }
    return `<ul class="cherry-shortcut-key-config-panel-ul">${li.join('')}</ul>`;
  }

  /**
   * 显示快捷键配置面板
   */
  show() {
    this.dom.style.removeProperty('display');
    const ulWrapper = this.dom.querySelector(`#${this.shortcutUlId}`);
    if (ulWrapper instanceof HTMLUListElement) {
      // 监听双击事件
      ulWrapper.addEventListener('dblclick', this.handleDbClick);
      // 监听编辑相关按钮的点击
      const handleClick = (/** @type {MouseEvent} */ e) => {
        if (e.target instanceof HTMLElement) {
          const editBtn = e.target.closest('.edit-btn');
          const saveBtn = e.target.closest('.action-btn.save');
          const cancelBtn = e.target.closest('.action-btn.cancel');
          const item = e.target.closest('.shortcut-key-item');

          if (item instanceof HTMLElement) {
            if (editBtn) {
              this.handleEditBtnClick(e, item);
            } else if (saveBtn) {
              this.handleSaveBtnClick(e, item);
            } else if (cancelBtn) {
              this.handleCancelBtnClick(e, item);
            }
          }
        }
      };
      ulWrapper.addEventListener('click', handleClick);
      // 保存事件处理器引用以便后续移除
      this.handleClick = handleClick;
    }
    const settingsDisableBtn = this.dom.querySelector('.j-shortcut-settings-disable-btn');
    if (settingsDisableBtn instanceof HTMLElement) {
      settingsDisableBtn.addEventListener('click', this.clickSettingsDisableBtn);
    }
    const settingsRecoverBtn = this.dom.querySelector('.j-shortcut-settings-recover-btn');
    if (settingsRecoverBtn instanceof HTMLElement) {
      settingsRecoverBtn.addEventListener('click', this.clickSettingsRecoverBtn);
    }
    const tabs = this.dom.querySelector('.shortcut-tabs');
    if (tabs instanceof HTMLElement) {
      tabs.addEventListener('click', this.handleTabClick);
    }
    // 默认显示自定义快捷键tab
    this.switchTab(this.activeTab);
  }

  /**
   * 隐藏快捷键配置面板
   */
  hide() {
    // 如果有正在编辑的项，取消编辑
    if (this.editingItem) {
      this.cancelEdit(this.editingItem);
    }

    this.dom.style.display = 'none';
    const ulWrapper = this.dom.querySelector(`#${this.shortcutUlId}`);
    if (ulWrapper instanceof HTMLUListElement && this.handleClick) {
      // 销毁时取消监听
      ulWrapper.removeEventListener('dblclick', this.handleDbClick);
      ulWrapper.removeEventListener('click', this.handleClick);
    }
    const settingsDisableBtn = this.dom.querySelector('.j-shortcut-settings-disable-btn');
    if (settingsDisableBtn instanceof HTMLElement) {
      settingsDisableBtn.removeEventListener('click', this.clickSettingsDisableBtn);
    }
    const settingsRecoverBtn = this.dom.querySelector('.j-shortcut-settings-recover-btn');
    if (settingsRecoverBtn instanceof HTMLElement) {
      settingsRecoverBtn.removeEventListener('click', this.clickSettingsRecoverBtn);
    }
    const tabs = this.dom.querySelector('.shortcut-tabs');
    if (tabs instanceof HTMLElement) {
      tabs.removeEventListener('click', this.handleTabClick);
    }
  }

  isShow() {
    return this.dom.style.display === 'block';
  }

  isHide() {
    return this.dom.style.display === 'none';
  }

  /**
   * 展示/隐藏快捷键配置面板
   * @param {HTMLElement} settingsDom
   */
  toggle(settingsDom) {
    if (!(settingsDom instanceof HTMLElement)) {
      throw new Error(`settingsDom must be an instance of HTMLElement, but got: ${settingsDom}`);
    }
    const pos = settingsDom.getBoundingClientRect();
    const cherryWrapPos = this.$cherry.wrapperDom.getBoundingClientRect();
    if (this.isHide()) {
      this.dom.style.left = `${pos.left - cherryWrapPos.left + pos.width / 2}px`;
      this.dom.style.top = `${pos.top - cherryWrapPos.top + pos.height}px`;
      this.show();
      const me = this.dom.getBoundingClientRect();
      this.dom.style.marginLeft = `0px`;
      this.dom.style.left = `${pos.left - cherryWrapPos.left + pos.width / 2 - me.width / 2}px`;
      // 如果弹窗位置超出屏幕，则自动调整位置
      if (me.left + me.width > window.innerWidth) {
        this.dom.style.left = `${window.innerWidth - me.width - 5}px`;
      }
      return;
    }
    return this.hide();
  }
}
