import createDOMPurify from 'dompurify';

// for browser
export const sanitizer = createDOMPurify(window);
