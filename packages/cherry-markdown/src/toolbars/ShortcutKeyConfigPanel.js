import { mac } from 'codemirror/src/util/browser';
import {
  getAllowedShortcutKey,
  keyStackIsModifierkeys,
  keyStack2UniqueString,
  shortcutCode2Key,
  isEnableShortcutKey,
  setDisableShortcutKey,
  storageKeyMap,
} from '@/utils/shortcutKey';

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

    this.handleSaveBtnClick = (/** @type {MouseEvent} */ e, /** @type {HTMLElement} */ item) => {
      e.preventDefault();
      e.stopPropagation();
      this.saveEdit(item);
    };

    this.handleCancelBtnClick = (/** @type {MouseEvent} */ e, /** @type {HTMLElement} */ item) => {
      e.preventDefault();
      e.stopPropagation();
      this.cancelEdit(item);
    };

    this.handleKeyDown = (/** @type {KeyboardEvent} */ e) => {
      if (!this.editingItem) return;

      e.preventDefault();
      e.stopPropagation();

      const newKeyStack = getAllowedShortcutKey(e);
      if (!keyStackIsModifierkeys(newKeyStack) && Array.isArray(newKeyStack) && newKeyStack.length >= 2) {
        this.keyStack = newKeyStack;
        this.updateEditingKeys();
      }
    };

    this.clickSettingsDisableBtn = () => {
      if (!isEnableShortcutKey(this.$cherry.nameSpace)) {
        setDisableShortcutKey(this.$cherry.nameSpace, 'enable');
        this.dom.classList.remove('disable');
        this.$cherry.editor.disableShortcut(false);
      } else {
        setDisableShortcutKey(this.$cherry.nameSpace, 'disable');
        this.dom.classList.add('disable');
        this.$cherry.editor.disableShortcut(true);
      }
    };

    this.clickSettingsRecoverBtn = () => {
      setDisableShortcutKey(this.$cherry.nameSpace, 'enable');
      this.dom.classList.remove('disable');
      this.$cherry.editor.disableShortcut(false);
      this.$cherry.toolbar.shortcutKeyMap = {};
      this.$cherry.toolbar.collectShortcutKey(false);
      storageKeyMap(this.$cherry.nameSpace, this.$cherry.toolbar.shortcutKeyMap);
      this.dom.innerHTML = this.generateShortcutKeyConfigPanelHtmlStr();
      this.show();
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

    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * 取消编辑
   * @param {HTMLElement} item
   */
  cancelEdit(item) {
    item.classList.remove('editing');
    if (this.editingItem === item) {
      // 恢复原来的快捷键显示
      const kbdContainer = item.querySelector(`.${this.shortcutConfigPanelKbdClassName}`);
      if (kbdContainer && this.originalKeyStack) {
        kbdContainer.innerHTML = this.originalKeyStack
          .map((key) => {
            const matchRes = shortcutCode2Key(key, mac);
            return `<span class="${this.shortcutKeyboardKeyClassName}" title="${matchRes.tip}" data-code="${key}">${matchRes.text}</span>`;
          })
          .join('');
      }
      this.editingItem = null;
      this.keyStack = [];
      this.originalKeyStack = null;
      document.removeEventListener('keydown', this.handleKeyDown);
    }
  }

  /**
   * 保存编辑
   * @param {HTMLElement} item
   */
  saveEdit(item) {
    if (!this.editingItem || !this.keyStack.length) return;

    const kbdContainer = item.querySelector(`.${this.shortcutConfigPanelKbdClassName}`);
    if (!kbdContainer) return;

    const { hookname = '' } = item.dataset;

    if (hookname) {
      // 触发更新快捷键
      this.$cherry?.toolbar?.updateShortcutKeyMap(
        keyStack2UniqueString(this.originalKeyStack || []),
        keyStack2UniqueString(this.keyStack),
      );

      // 更新界面
      kbdContainer.innerHTML = this.keyStack
        .map((key) => {
          const matchRes = shortcutCode2Key(key, mac);
          return `<span class="${this.shortcutKeyboardKeyClassName}" title="${matchRes.tip}" data-code="${key}">${matchRes.text}</span>`;
        })
        .join('');
    }

    this.editingItem = null;
    this.keyStack = [];
    this.originalKeyStack = null;
    document.removeEventListener('keydown', this.handleKeyDown);
    item.classList.remove('editing');
  }

  /**
   * 更新编辑中的快捷键显示
   */
  updateEditingKeys() {
    if (!this.editingItem) return;

    const kbdContainer = this.editingItem.querySelector(`.${this.shortcutConfigPanelKbdClassName}`);
    if (!kbdContainer) return;

    kbdContainer.innerHTML = this.keyStack
      .map((key) => {
        const matchRes = shortcutCode2Key(key, mac);
        return `<span class="${this.shortcutKeyboardKeyClassName}" title="${matchRes.tip}" data-code="${key}">${matchRes.text}</span>`;
      })
      .join('');
  }

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
  }

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
          <div class="shortcut-key-config-panel-name">${aliasName}</div>
          <div class="shortcut-key-right">
            <div class="${this.shortcutConfigPanelKbdClassName}">${key
              ?.split('-')
              .map((singalKey) => {
                const matchRes = shortcutCode2Key(singalKey, mac);
                const shortKey = matchRes ?? {
                  text: singalKey,
                  tip: singalKey,
                };
                return `<span class="${this.shortcutKeyboardKeyClassName}" title="${shortKey.tip}" data-code="${singalKey}">${shortKey.text}</span>`;
              })
              .join('')}</div>
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
          <btn class="shortcut-settings-btn j-shortcut-settings-disable-btn"><i class="ch-icon ch-icon-cherry-table-delete"></i> ${
            this.$cherry.locale.disableShortcut
          }</btn>
          <btn class="shortcut-settings-btn j-shortcut-settings-recover-btn"><i class="ch-icon ch-icon-undo"></i> ${
            this.$cherry.locale.recoverShortcut
          }</btn>
        </div>
        <div class="shortcut-tabs">
          <div class="shortcut-tab active" data-tab="custom">自定义快捷键</div>
          <div class="shortcut-tab" data-tab="static">内置快捷键</div>
        </div>
        <div class="shortcut-panels">
          <div class="shortcut-panel active" data-panel="custom">
            <ul class="${this.shortcutUlClassName}" id="${this.shortcutUlId}">${liStr}</ul>
          </div>
          <div class="shortcut-panel" data-panel="static">
            ${this.$getStaticShortcut()}
          </div>
        </div>
        <div class="shortcut-panel-tips">${this.$cherry.locale.editShortcutKeyConfigTip} <i class="ch-icon ch-icon-pen-fill"></i></div>
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
    const list = [
      { name: this.$cherry.locale.shortcutStatic1, key: 'Ctrl+[' },
      { name: this.$cherry.locale.shortcutStatic2, key: 'Ctrl+]' },
      { name: this.$cherry.locale.shortcutStatic3, key: 'Ctrl+Shift+D' },
      { name: this.$cherry.locale.shortcutStatic4, key: 'Ctrl+Enter' },
      { name: this.$cherry.locale.shortcutStatic5, key: 'Ctrl+Shift+Enter' },
      { name: this.$cherry.locale.shortcutStatic6, key: 'Ctrl+Shift+↑' },
      { name: this.$cherry.locale.shortcutStatic7, key: 'Ctrl+Shift+↓' },
      { name: this.$cherry.locale.shortcutStatic8, key: 'Ctrl+Shift+K' },
      { name: this.$cherry.locale.shortcutStatic9, key: 'Ctrl+Shift+←' },
      { name: this.$cherry.locale.shortcutStatic10, key: 'Ctrl+Shift+→' },
      { name: this.$cherry.locale.shortcutStatic11, key: 'Ctrl+Backspace' },
      { name: this.$cherry.locale.shortcutStatic12, key: 'Ctrl+Shift+M' },
      { name: this.$cherry.locale.shortcutStatic13, key: `Ctrl+${this.$cherry.locale.leftMouseButton}` },
      { name: this.$cherry.locale.shortcutStatic14, key: 'Ctrl+Shift+L' },
      { name: this.$cherry.locale.shortcutStatic16, key: 'Alt+F3' },
      { name: this.$cherry.locale.shortcutStatic17, key: 'Ctrl+Z' },
      { name: this.$cherry.locale.shortcutStatic18, key: 'Ctrl+Y' },
    ];
    const li = [];
    for (let i = 0; i < list.length; i++) {
      const one = list[i];
      li.push(`
        <li class="cherry-dropdown-item shortcut-key-item">
          <div class="shortcut-key-config-panel-name">${one.name}</div>
          <div class="shortcut-key-right-static">
            <div class="${this.shortcutConfigPanelKbdClassName}">
              ${one.key
                .split('+')
                .map((key) => {
                  // 如果是鼠标左键，直接返回文本
                  if (key === this.$cherry.locale.leftMouseButton) {
                    return key;
                  }
                  return `<span class="${this.shortcutKeyboardKeyClassName}" title="${key}">${key}</span>`;
                })
                .join('')}
            </div>
          </div>
        </li>
      `);
    }
    return `<ul class="cherry-shortcut-key-config-panel-ul">${li.join('')}</ul>`;
  }

  show() {
    this.dom.style.removeProperty('display');
    const ulWrapper = this.dom.querySelector(`#${this.shortcutUlId}`);
    if (ulWrapper instanceof HTMLUListElement) {
      // 监听编辑按钮点击
      const handleClick = (e) => {
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

  hide() {
    // 如果有正在编辑的项，取消编辑
    if (this.editingItem) {
      this.cancelEdit(this.editingItem);
    }

    this.dom.style.display = 'none';
    const ulWrapper = this.dom.querySelector(`#${this.shortcutUlId}`);
    if (ulWrapper instanceof HTMLUListElement && this.handleClick) {
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
