import SyntaxBase from '../../src/core/SyntaxBase';
import ParagraphBase from '../../src/core/ParagraphBase';

type HookClassConstructor = typeof SyntaxBase | typeof ParagraphBase;

/** 为 Hook 测试类注入框架要求的静态字段（避免 static HOOK_* 触发 classProperty 命名规则） */
export function assignHookClassProps<T extends HookClassConstructor>(
  HookClass: T,
  props: { hookName?: string; hookType?: string },
): T {
  if (props.hookName !== undefined) {
    Object.defineProperty(HookClass, 'HOOK_NAME', { value: props.hookName, configurable: true });
  }
  if (props.hookType !== undefined) {
    Object.defineProperty(HookClass, 'HOOK_TYPE', { value: props.hookType, configurable: true });
  }
  return HookClass;
}
