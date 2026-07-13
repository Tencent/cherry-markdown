import type { CherryEditorInstance } from '../editorTypes';

// 保存当前活跃的 Cherry 编辑器实例，供状态栏等组件访问真实实例
// （cherryInstance 是工厂函数，每次调用都会 new 一个，因此不能直接复用）。
let editorInstance: CherryEditorInstance | null = null;

export function setEditorInstance(instance: CherryEditorInstance | null): void {
  editorInstance = instance;
}

export function getEditorInstance(): CherryEditorInstance | null {
  return editorInstance;
}
