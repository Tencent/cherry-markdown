import Cherry, { MenuHookBase, SyntaxHookBase } from './index.core';

if (typeof window !== 'undefined') {
  window.Cherry = Cherry;
}

export { MenuHookBase, SyntaxHookBase };
export default Cherry;
