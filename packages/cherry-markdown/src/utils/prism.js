// Keep initialization as a value dependency so MiniProgram tree shaking retains
// it. The shared Babel adapter replaces the next import with language imports.
import Prism from './prism-runtime.js';
import 'prismjs';

export default Prism;
