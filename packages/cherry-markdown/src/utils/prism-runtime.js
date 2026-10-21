/* global globalThis */
import Prism from 'prismjs/components/prism-core.js';

// Prism's separate language components access the global Prism instance. Core
// only publishes it on window/worker/Node globals, which MiniProgram may lack.
if (typeof globalThis !== 'undefined') {
  /** @type {{ Prism?: typeof Prism }} */ (globalThis).Prism = Prism;
}
Prism.manual = true;

export default Prism;
