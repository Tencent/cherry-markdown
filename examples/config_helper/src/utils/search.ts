import type { ConfigItemDef } from '../types';

/** 配置项是否命中搜索关键字（query 需为小写且已 trim，为空表示全部命中） */
export function matchQuery(item: ConfigItemDef, query: string): boolean {
  if (!query) return true;
  return `${item.name} ${item.path} ${item.description}`.toLowerCase().includes(query);
}
