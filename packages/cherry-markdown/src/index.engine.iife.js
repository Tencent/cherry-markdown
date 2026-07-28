import CherryEngine, { SyntaxHookBase, MenuHookBase } from './index.engine';

if (typeof window !== 'undefined') {
  window.CherryEngine = CherryEngine;
}

export { SyntaxHookBase, MenuHookBase };
export default CherryEngine;
