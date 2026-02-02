import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// 为 Node.js 环境创建虚拟 window 对象
// dompurify 需要 window 对象才能在 Node.js 环境中工作
const { window } = new JSDOM('');

export const sanitizer = createDOMPurify(window);
