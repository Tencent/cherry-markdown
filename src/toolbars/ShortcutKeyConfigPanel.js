import { mac } from 'codemirror/src/util/browser';
import {
  getAllowedShortcutKey,
  keyStackIsModifierkeys,
  ENTER_KEY,
  BACKSPACE_KEY,
  keyStack2UniqueString,
  shortcutCode2Key,
  keyStack2UnPlatformUniqueString,
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
                  if (hookname && this.$cherry?.toolbar?.menus?.hooks?.[hookname]) {
                    // 触发更新快捷键
                    this.$cherry?.toolbar?.menus?.hooks?.[hookname].updateShortcutKeyMap(
                      oldShortcutKey,
                      keyStack2UniqueString(keyStack),
                    );
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
        <div class="cherry-dropdown-item">${this.$cherry.locale.editShortcutKeyConfigTip}</div>
        <ul class="${this.shortcutUlClassName}" id="${this.shortcutUlId}">${liStr}</ul>
      </div>`;
    return ulStr;
  }

  /**
   * 显示快捷键配置面板
   */
  show() {
    this.dom.style.removeProperty('display');
    const ulWrapper = document.querySelector(`#${this.shortcutUlId}`);
    if (ulWrapper instanceof HTMLUListElement) {
      // 监听双击
      ulWrapper.addEventListener('dblclick', this.handleDbClick);
    }
  }

  hide() {
    this.dom.style.display = 'none';
    const ulWrapper = document.querySelector(`#${this.shortcutUlId}`);
    if (ulWrapper instanceof HTMLUListElement) {
      // 销毁时取消监听
      ulWrapper.removeEventListener('dblclick', this.handleDbClick);
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
    if (this.isHide()) {
      this.dom.style.left = `${pos.left + pos.width}px`;
      this.dom.style.top = `${pos.top + pos.height}px`;
      this.show();
      return;
    }
    return this.hide();
  }
}
