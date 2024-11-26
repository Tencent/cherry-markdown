import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');

// @ts-expect-error
export const sanitizer = createDOMPurify(window);
