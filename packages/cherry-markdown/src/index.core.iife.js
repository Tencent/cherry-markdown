import Cherry, { SyntaxHookBase, MenuHookBase } from './index.core';

if (typeof window !== 'undefined') {
  window.Cherry = Cherry;
}

export { SyntaxHookBase, MenuHookBase };
export default Cherry;
