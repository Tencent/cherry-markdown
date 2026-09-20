import { useCallback, useMemo, useState } from 'react';
import { CONFIG_CATEGORIES, PRESETS } from '../data/config-data';
import type { ConfigItemDef, ConfigState, ConfigValue, PresetName } from '../types';
import { applyPresetOverrides, createInitialState, generateConfig } from '../utils/configGenerator';

/** 以 key 建立配置项定义索引，便于在 reducer 里查找类型信息 */
const ITEM_DEF_MAP: Record<string, ConfigItemDef> = CONFIG_CATEGORIES.reduce<Record<string, ConfigItemDef>>(
  (map, cat) => {
    cat.items.forEach((item) => {
      map[item.key] = item;
    });
    return map;
  },
  {},
);

function updateItem(state: ConfigState, key: string, updater: (item: ConfigState[string]) => ConfigState[string]) {
  const current = state[key];
  if (!current) return state;
  return { ...state, [key]: updater(current) };
}

/**
 * 配置面板的核心状态管理：
 * 持有所有配置项的运行时状态，并派生出最终的 Cherry 配置对象。
 */
export function useConfigState() {
  const [state, setState] = useState<ConfigState>(() => createInitialState(CONFIG_CATEGORIES));

  /** 重置为默认值 */
  const reset = useCallback(() => {
    setState(createInitialState(CONFIG_CATEGORIES));
  }, []);

  /** 应用预设 */
  const applyPreset = useCallback((name: PresetName) => {
    const preset = PRESETS[name];
    if (!preset) return null;
    setState(applyPresetOverrides(CONFIG_CATEGORIES, preset.overrides));
    return preset;
  }, []);

  /** toggle 开关 */
  const setEnabled = useCallback((key: string, enabled: boolean) => {
    const def = ITEM_DEF_MAP[key];
    setState((prev) =>
      updateItem(prev, key, (item) => ({
        ...item,
        enabled,
        value: def?.type === 'boolean' ? enabled : item.value,
      })),
    );
  }, []);

  /** 直接设置值（text / select / textarea） */
  const setValue = useCallback((key: string, value: ConfigValue) => {
    setState((prev) => updateItem(prev, key, (item) => ({ ...item, value })));
  }, []);

  /** canDisable 配置项：整体关闭 / 开启 */
  const setDisabled = useCallback((key: string, disabled: boolean) => {
    setState((prev) => updateItem(prev, key, (item) => ({ ...item, disabled })));
  }, []);

  /** 工具栏按钮：切换选中状态（移除所有该值的实例，或添加一个） */
  const toggleToolbarItem = useCallback((key: string, value: string) => {
    setState((prev) =>
      updateItem(prev, key, (item) => {
        if (item.disabled) return item;
        const arr = Array.isArray(item.value) ? item.value : [];
        const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
        return { ...item, value: next };
      }),
    );
  }, []);

  /** 工具栏按钮：添加分割线 */
  const addSeparator = useCallback((key: string) => {
    setState((prev) =>
      updateItem(prev, key, (item) => {
        if (item.disabled) return item;
        const arr = Array.isArray(item.value) ? item.value : [];
        return { ...item, value: [...arr, '|'] };
      }),
    );
  }, []);

  /** 工具栏按钮：删除指定位置的项 */
  const removeToolbarItemAt = useCallback((key: string, index: number) => {
    setState((prev) =>
      updateItem(prev, key, (item) => {
        const arr = Array.isArray(item.value) ? [...item.value] : [];
        arr.splice(index, 1);
        return { ...item, value: arr };
      }),
    );
  }, []);

  /** 工具栏按钮：拖拽排序 */
  const moveToolbarItem = useCallback((key: string, from: number, to: number) => {
    if (from === to) return;
    setState((prev) =>
      updateItem(prev, key, (item) => {
        const arr = Array.isArray(item.value) ? [...item.value] : [];
        if (from < 0 || from >= arr.length || to < 0 || to >= arr.length) return item;
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        return { ...item, value: arr };
      }),
    );
  }, []);

  /** 子配置项赋值 */
  const setSubItemValue = useCallback((key: string, subIndex: number, value: string | number | boolean) => {
    setState((prev) =>
      updateItem(prev, key, (item) => {
        if (!item.subItems || !item.subItems[subIndex]) return item;
        const subItems = item.subItems.map((sub, idx) => (idx === subIndex ? { ...sub, value } : sub));
        return { ...item, subItems };
      }),
    );
  }, []);

  /** 派生：最终配置对象 */
  const config = useMemo(() => generateConfig(CONFIG_CATEGORIES, state), [state]);

  return {
    state,
    config,
    categories: CONFIG_CATEGORIES,
    actions: {
      reset,
      applyPreset,
      setEnabled,
      setValue,
      setDisabled,
      toggleToolbarItem,
      addSeparator,
      removeToolbarItemAt,
      moveToolbarItem,
      setSubItemValue,
    },
  };
}

export type ConfigActions = ReturnType<typeof useConfigState>['actions'];
