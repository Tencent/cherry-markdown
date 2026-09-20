/**
 * Cherry Markdown 配置生成器 - 类型定义
 */

/** 配置项在面板中的输入控件类型 */
export type InputType = 'toggle' | 'select' | 'text' | 'textarea' | 'toolbar-select';

/** 配置项对应 Cherry 配置的值类型 */
export type ValueType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'function';

/** 子配置项的输入类型 */
export type SubItemType = 'boolean' | 'number' | 'string' | 'select';

/** 配置项可能持有的值 */
export type ConfigValue = string | number | boolean | string[];

/** 子配置项（对象类型配置项的字段） */
export interface SubItemDef {
  key: string;
  name: string;
  type: SubItemType;
  value: string | number | boolean;
  options?: string[];
}

/** 单个配置项定义 */
export interface ConfigItemDef {
  /** 唯一 key，同时作为 SOURCE_CODE_MAP 的索引 */
  key: string;
  /** 展示名称 */
  name: string;
  /** 在 Cherry 配置对象中的路径，如 editor.theme */
  path: string;
  /** 值类型 */
  type: ValueType;
  /** 默认值（字符串形式，用于展示 / 函数类型直接输出） */
  default: string;
  description: string;
  inputType: InputType;
  /** 初始是否启用 */
  enabled: boolean;
  /** 初始值 */
  value: ConfigValue;
  /** select / toolbar-select 的候选项 */
  options?: string[];
  /** 数组类配置是否允许整体关闭（输出 false） */
  canDisable?: boolean;
  /** 对象类配置的子字段 */
  subItems?: SubItemDef[];
}

/** 配置分类 */
export interface ConfigCategoryDef {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  description: string;
  items: ConfigItemDef[];
}

/** 预设 */
export interface PresetDef {
  name: string;
  description: string;
  overrides: Record<string, ConfigValue>;
}

/** 单个配置项的运行时状态 */
export interface ItemState {
  enabled: boolean;
  value: ConfigValue;
  subItems: SubItemDef[] | null;
  canDisable: boolean;
  /** 当 canDisable 为 true 时，disabled 为 true 表示该配置项被设为 false */
  disabled: boolean;
}

/** 全部配置项状态，key 为 ConfigItemDef.key */
export type ConfigState = Record<string, ItemState>;

/** 生成出的 Cherry 配置对象（嵌套结构） */
export type GeneratedConfig = Record<string, unknown>;

/** 预览区标签页：实时预览 / 配置代码 / 配置参考 */
export type TabName = 'preview' | 'code' | 'source';

/** 预设名称 */
export type PresetName = 'default' | 'simple' | 'full' | 'preview';
