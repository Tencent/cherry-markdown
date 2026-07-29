import CherryStream, { SyntaxHookBase } from './index.stream';

if (typeof window !== 'undefined') {
  window.Cherry = CherryStream;
}

export { SyntaxHookBase };
export default CherryStream;
