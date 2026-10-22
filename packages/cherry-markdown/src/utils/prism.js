// The shared Babel adapter injects languages and scopes global compatibility
// to Prism's core in both production and development dependency prebundling.
import Prism from 'prismjs';

Prism.manual = true;
export default Prism;
