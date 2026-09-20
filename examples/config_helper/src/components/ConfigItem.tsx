import type { ReactNode } from 'react';
import type { ConfigActions } from '../hooks/useConfigState';
import type { ConfigItemDef, ItemState } from '../types';
import SubItemInput from './SubItemInput';
import Toggle from './Toggle';
import ToolbarSelector from './ToolbarSelector';

interface ConfigItemProps {
  item: ConfigItemDef;
  state: ItemState;
  actions: ConfigActions;
  /** 点击"查看配置参考"按钮 */
  onShowSource: (key: string) => void;
}

/** 单个配置项：名称 / 路径 / 描述 / 值编辑区 / 子项 / 查看配置参考 */
export default function ConfigItem({ item, state, actions, onShowSource }: ConfigItemProps) {
  const { key } = item;
  const selectedToolbar = Array.isArray(state.value) ? state.value : [];
  /** 关闭后会输出 false 的配置项（可整体关闭的数组、带子项的对象配置） */
  const canOutputFalse = !!item.canDisable || (item.type === 'object' && !!item.subItems);

  let valueArea: ReactNode = null;

  if (item.inputType === 'toggle') {
    const isSyntaxObject = item.type === 'object' && !!item.subItems;
    // 布尔配置项直接以实际值为准，其余 toggle 以 enabled 为准
    const checked = item.type === 'boolean' ? Boolean(state.value) : state.enabled;
    valueArea = (
      <>
        <Toggle checked={checked} onChange={(next) => actions.setEnabled(key, next)} />
        {isSyntaxObject && (
          <span className={`text-xs ${state.enabled ? 'text-gray-500' : 'text-red-500 font-medium'}`}>
            {state.enabled ? (
              '启用中'
            ) : (
              <>
                <i className="fa-solid fa-ban mr-1" />
                已关闭（值为 false）
              </>
            )}
          </span>
        )}
      </>
    );
  } else if (item.inputType === 'select') {
    valueArea = (
      <select
        className="config-select"
        value={String(state.value)}
        onChange={(e) => actions.setValue(key, e.target.value)}
      >
        {(item.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  } else if (item.inputType === 'text') {
    valueArea = (
      <input
        type="text"
        className="config-value-input"
        value={String(state.value)}
        onChange={(e) => actions.setValue(key, e.target.value)}
      />
    );
  } else if (item.inputType === 'textarea') {
    valueArea = (
      <textarea
        className="config-value-input font-mono"
        style={{ maxWidth: '100%', minHeight: 96, resize: 'vertical' }}
        value={String(state.value)}
        onChange={(e) => actions.setValue(key, e.target.value)}
      />
    );
  } else if (item.inputType === 'toolbar-select') {
    const selector = (
      <ToolbarSelector
        options={item.options ?? []}
        selected={selectedToolbar}
        onToggle={(value) => actions.toggleToolbarItem(key, value)}
        onAddSeparator={() => actions.addSeparator(key)}
        onRemoveAt={(idx) => actions.removeToolbarItemAt(key, idx)}
        onMove={(from, to) => actions.moveToolbarItem(key, from, to)}
      />
    );
    if (item.canDisable) {
      // 支持整体关闭：增加一个"关闭"开关
      valueArea = (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-1">
            <Toggle checked={!state.disabled} onChange={(checked) => actions.setDisabled(key, !checked)} />
            <span className={`text-xs ${state.disabled ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
              {state.disabled ? (
                <>
                  <i className="fa-solid fa-ban mr-1" />
                  已关闭（值为 false）
                </>
              ) : (
                '启用中（数组模式）'
              )}
            </span>
          </div>
          {!state.disabled && selector}
        </div>
      );
    } else {
      valueArea = <div className="w-full">{selector}</div>;
    }
  }

  const showSubItems = !!state.subItems && state.subItems.length > 0 && state.enabled;

  return (
    <div className="config-item">
      <div className="item-info">
        <div className="item-name">
          {item.name}
          <span className="tag tag-type">{canOutputFalse ? `${item.type} | false` : item.type}</span>
          {item.type === 'function' && <span className="tag tag-default">回调</span>}
        </div>
        <div className="item-path">{item.path}</div>
        <div className="item-desc">{item.description}</div>
        <div className="value-area">{valueArea}</div>
        {showSubItems && (
          <div className="mt-2 pl-2 border-l-2 border-gray-100 space-y-1.5">
            {state.subItems!.map((sub, idx) => (
              <SubItemInput key={sub.key} sub={sub} onChange={(value) => actions.setSubItemValue(key, idx, value)} />
            ))}
          </div>
        )}
      </div>
      <div className="item-actions">
        <button
          type="button"
          className="action-btn source-btn"
          title="查看配置参考"
          onClick={() => onShowSource(key)}
        >
          <i className="fa-solid fa-book" />
        </button>
      </div>
    </div>
  );
}
