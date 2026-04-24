import { helpers } from '@module-federation/runtime-core';
import { getGlobalFederationInstance } from './utils';
export type { IGlobalUtils, IShareUtils, } from '@module-federation/runtime-core';
declare const _default: {
    global: typeof helpers.global & {
        getGlobalFederationInstance: typeof getGlobalFederationInstance;
    };
    share: typeof helpers.share;
    utils: typeof helpers.utils;
};
export default _default;
