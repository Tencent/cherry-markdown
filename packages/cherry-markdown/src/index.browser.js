import Cherry from './index';
export * from './index';

if (typeof window !== 'undefined') {
  window.Cherry = Cherry;
}

export default Cherry;
