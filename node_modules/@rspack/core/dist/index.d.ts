import * as rspackExports from "./exports";
import { rspack as rspackFn } from "./rspack";
type Rspack = typeof rspackFn & typeof rspackExports & {
    rspack: Rspack;
    webpack: Rspack;
};
declare const rspack: Rspack;
export * from "./exports";
export default rspack;
export { rspack };
