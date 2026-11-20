// DOMPurify source: https://github.com/cure53/DOMPurify
// License: https://spdx.org/licenses/MPL-2.0.html or https://spdx.org/licenses/Apache-2.0.html
import createDOMPurify from 'dompurify';
// jsdom source: https://github.com/jsdom/jsdom
// License: https://spdx.org/licenses/MIT.html
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');

export const sanitizer = createDOMPurify(/** @type {Window} */ (window));
