import createDOMPurify from 'dompurify';

export const sanitizer = createDOMPurify(window);
