import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');

export const sanitizer = createDOMPurify(/** @type {Window} */ (window));
