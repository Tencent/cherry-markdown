import Cherry, { SyntaxHookBase, MenuHookBase } from './index';

if (typeof window !== 'undefined') {
  window.Cherry = Cherry;
}

export { SyntaxHookBase, MenuHookBase };
export default Cherry;
