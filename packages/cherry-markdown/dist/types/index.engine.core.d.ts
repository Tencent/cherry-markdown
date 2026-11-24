export default CherryEngineExport;
/**
 * Preserve the static API while declaring the Engine instance returned by the
 * compatibility constructor. A class declaration alone cannot express this.
 */
export type CherryEngineConstructor = Omit<typeof CherryEngine, "prototype"> & (new (options?: ConstructorParameters<typeof CherryEngine>[0]) => Engine);
import SyntaxHookBase from './core/SyntaxBase.js';
import MenuHookBase from './toolbars/MenuBase.js';
/**
 * Preserve the static API while declaring the Engine instance returned by the
 * compatibility constructor. A class declaration alone cannot express this.
 * @typedef {Omit<typeof CherryEngine, 'prototype'> & (new (options?: ConstructorParameters<typeof CherryEngine>[0]) => Engine)} CherryEngineConstructor
 */
declare const CherryEngineExport: CherryEngineConstructor;
declare class CherryEngine extends CherryStatic {
    /**
     * @private
     */
    private static initialized;
    /**
     * @readonly
     */
    static readonly config: {
        defaults: Partial<Partial<import("../../types/cherry.js").CherryOptionsBase<import("../../types/cherry.js").CherryCustomOptions>>>;
    };
    /**
     * @param {any} options
     */
    constructor(options: any);
}
import Engine from './Engine.js';
import { CherryStatic } from './CherryStatic.js';
export { SyntaxHookBase, MenuHookBase };
