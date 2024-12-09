export default CherryEngineExport;
import SyntaxHookBase from "./core/SyntaxBase";
import MenuHookBase from "./toolbars/MenuBase";
type CherryEngineExport = typeof CherryStatic & (new (options: Partial<import('../../types/cherry').CherryOptions>) => Engine);
/**
 * @typedef {typeof CherryStatic & (new (options: Partial<import('../../types/cherry').CherryOptions>) => Engine)}
 */
declare const CherryEngineExport: typeof CherryEngine;
import { CherryStatic } from "./CherryStatic";
import Engine from "./Engine";
declare class CherryEngine extends CherryStatic {
    /**
     * @private
     */
    private static initialized;
    /**
     * @readonly
     */
    static readonly config: {
        defaults: Partial<Partial<import("../../types/cherry")._CherryOptions<import("../../types/cherry").CherryCustomOptions>>>;
    };
    /**
     * @param {any} options
     */
    constructor(options: any);
}
export { SyntaxHookBase, MenuHookBase };
