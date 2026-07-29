import CherryEngine from './index.engine';
export * from './index.engine';

if (typeof window !== 'undefined') {
  window.CherryEngine = CherryEngine;
}

export default CherryEngine;
