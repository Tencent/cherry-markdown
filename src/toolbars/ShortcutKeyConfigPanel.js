import { mac } from 'codemirror/src/util/browser';
import {
  getAllowedShortcutKey,
  keyStackIsModifierkeys,
  ENTER_KEY,
  BACKSPACE_KEY,
  keyStack2UniqueString,
  shortcutCode2Key,
  keyStack2UnPlatformUniqueString,
  isEnableShortcutKey,
  setDisableShortcutKey,
  storageKeyMap,
} from '@/utils/shortcutKey';
import { createElement } from '@/utils/dom';
/**
 * 隐藏输入框，展示快捷键配置项
 * @param {Element} inputWrapper
 * @param {HTMLElement} shortcutPanel
 */
function hiddenInputWrapper(inputWrapper, shortcutPanel) {
  inputWrapper.setAttribute('style', 'display: none;');
  shortcutPanel.style.display = 'flex';
}

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
    // 双击快捷键区域
    this.handleDbClick = (/** @type {MouseEvent} */ e) => {
      if (!isEnableShortcutKey(this.$cherry.nameSpace)) {
        return;
      }
      if (e.target instanceof HTMLElement) {
        if (
          e.target.classList.contains(this.shortcutConfigPanelKbdClassName) ||
          e.target.classList.contains(this.shortcutKeyboardKeyClassName)
        ) {
          const shortcutPanel = e.target.classList.contains(this.shortcutConfigPanelKbdClassName)
            ? e.target
            : e.target.parentElement;
          // 隐藏展示快捷键的容器
          shortcutPanel.style.display = 'none';
          const inputWrapper = shortcutPanel.nextElementSibling;
          // 显示输入框
          inputWrapper.setAttribute('style', 'display: block;');
          const inputElement = inputWrapper.querySelector('input');
          const placeholder = [];
          shortcutPanel.childNodes.forEach((element) => {
            // @ts-ignore
            placeholder.push(element.innerText);
          });
          inputElement.placeholder = placeholder.join('-');
          // 获取焦点
          inputElement.focus();
          inputElement.onblur = () => {
            hiddenInputWrapper(inputWrapper, shortcutPanel);
            inputElement.value = '';
          };
          /** @type {string[]} 按下的快捷键栈 */
          let keyStack = [];
          inputElement.onkeydown = (/** @type {KeyboardEvent} */ e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.key === ENTER_KEY || e.key === BACKSPACE_KEY) {
              if (e.key === ENTER_KEY) {
                const { hookname = '' } = shortcutPanel.parentElement?.dataset ?? {};
                const oldShortcutKeys = [];
                for (let i = 0; i < shortcutPanel.children.length; i++) {
                  /** @type {HTMLDivElement} */
                  // @ts-ignore
                  const element = shortcutPanel.children.item(i);
                  const { code } = element.dataset ?? {};
                  if (code) {
                    oldShortcutKeys.push(code);
                  }
                }
                // 防止修改
                if (oldShortcutKeys.length === shortcutPanel.children.length) {
                  // 旧的shortcutKey用于在更新时比较，删除旧值
                  const oldShortcutKey = keyStack2UniqueString(oldShortcutKeys);
                  if (hookname) {
                    // 触发更新快捷键
                    this.$cherry?.toolbar?.updateShortcutKeyMap(oldShortcutKey, keyStack2UniqueString(keyStack));
                    // 取二者较大者
                    const endIndex = Math.max(keyStack.length, shortcutPanel.children.length);
                    // 更新界面展示的快捷键
                    for (let i = 0; i < endIndex; i++) {
                      const element = shortcutPanel.children.item(i);
                      // 如果当前快捷键栈不存在了，说明新的快捷键个数比上一次少，则应该删除当前element
                      if (!keyStack[i] && element) {
                        element.remove();
                        continue;
                      }
                      const matchRes = shortcutCode2Key(keyStack[i], mac);
                      if (element) {
                        element.setAttribute('title', matchRes.tip);
                        element.textContent = matchRes.text;
                        element.setAttribute('data-code', keyStack[i]);
                      } else {
                        const matchRes = shortcutCode2Key(keyStack[i], mac);
                        const kbd = createElement('span', this.shortcutKeyboardKeyClassName, {
                          title: matchRes.tip,
                        });
                        kbd.setAttribute('data-code', keyStack[i]);
                        kbd.innerText = matchRes.text;
                        shortcutPanel.appendChild(kbd);
                      }
                    }
                  }
                }
                hiddenInputWrapper(inputWrapper, shortcutPanel);
              } else {
                if (keyStack.length === 0) {
                  hiddenInputWrapper(inputWrapper, shortcutPanel);
                }
                // 退栈
                keyStack.pop();
                inputElement.value = keyStack2UnPlatformUniqueString(keyStack, mac);
              }
            } else {
              keyStack = getAllowedShortcutKey(e);
              if (!keyStackIsModifierkeys(keyStack) && Array.isArray(keyStack) && keyStack.length >= 2) {
                inputElement.value = keyStack2UnPlatformUniqueString(keyStack, mac);
              }
            }
          };
        }
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
        <div style="display: none;" class="input-shortcut-wrapper"><input type="text" /></div>
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
        <div class="shortcut-panel-title">${this.$cherry.locale.editShortcutKeyConfigTip}</div>
        <ul class="${this.shortcutUlClassName}" id="${this.shortcutUlId}">${liStr}</ul>
        ${this.$getStaticShortcut()}
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
          <div class="shortcut-key-config-panel-static">${one.key.replace(
            /\+/g,
            '<span class="shortcut-split">+</span>',
          )}
          </div>
        </li>
      `);
    }
    return `<div class="shortcut-static">
      <div class="shortcut-panel-title">${this.$cherry.locale.shortcutStaticTitle}</div>
      <ul class="cherry-shortcut-key-config-panel-ul">${li.join('')}</ul>
    </div>`;
  }

  /**
   * 显示快捷键配置面板
   */
  show() {
    this.dom.style.removeProperty('display');
    const ulWrapper = this.dom.querySelector(`#${this.shortcutUlId}`);
    if (ulWrapper instanceof HTMLUListElement) {
      // 监听双击
      ulWrapper.addEventListener('dblclick', this.handleDbClick);
    }
    const settingsDisableBtn = this.dom.querySelector('.j-shortcut-settings-disable-btn');
    if (settingsDisableBtn instanceof HTMLElement) {
      settingsDisableBtn.addEventListener('click', this.clickSettingsDisableBtn);
    }
    const settingsRecoverBtn = this.dom.querySelector('.j-shortcut-settings-recover-btn');
    if (settingsRecoverBtn instanceof HTMLElement) {
      settingsRecoverBtn.addEventListener('click', this.clickSettingsRecoverBtn);
    }
  }

  hide() {
    this.dom.style.display = 'none';
    const ulWrapper = this.dom.querySelector(`#${this.shortcutUlId}`);
    if (ulWrapper instanceof HTMLUListElement) {
      // 销毁时取消监听
      ulWrapper.removeEventListener('dblclick', this.handleDbClick);
    }
    const settingsDisableBtn = this.dom.querySelector('.j-shortcut-settings-disable-btn');
    if (settingsDisableBtn instanceof HTMLElement) {
      settingsDisableBtn.removeEventListener('click', this.clickSettingsDisableBtn);
    }
    const settingsRecoverBtn = this.dom.querySelector('.j-shortcut-settings-recover-btn');
    if (settingsRecoverBtn instanceof HTMLElement) {
      settingsRecoverBtn.removeEventListener('click', this.clickSettingsRecoverBtn);
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
