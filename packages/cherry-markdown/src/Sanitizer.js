// DOMPurify source: https://github.com/cure53/DOMPurify
// License: https://spdx.org/licenses/MPL-2.0.html or https://spdx.org/licenses/Apache-2.0.html
import createDOMPurify from 'dompurify';

// for browser
export const sanitizer = createDOMPurify(window);
