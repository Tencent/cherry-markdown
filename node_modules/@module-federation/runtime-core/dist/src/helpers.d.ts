import { resetFederationGlobalInfo, setGlobalFederationInstance, getGlobalFederationConstructor, setGlobalFederationConstructor, getInfoWithoutType, getGlobalSnapshot, getTargetSnapshotInfoByModuleInfo, getGlobalSnapshotInfoByModuleInfo, setGlobalSnapshotInfoByModuleInfo, addGlobalSnapshot, getRemoteEntryExports, registerGlobalPlugins, getGlobalHostPlugins, getPreloaded, setPreloaded, Global } from './global';
import { getRegisteredShare, getGlobalShareScope } from './utils/share';
import { getRemoteInfo, matchRemoteWithNameAndExpose } from './utils';
import { preloadAssets } from './utils/preload';
interface IShareUtils {
    getRegisteredShare: typeof getRegisteredShare;
    getGlobalShareScope: typeof getGlobalShareScope;
}
interface IGlobalUtils {
    Global: typeof Global;
    nativeGlobal: typeof global;
    resetFederationGlobalInfo: typeof resetFederationGlobalInfo;
    setGlobalFederationInstance: typeof setGlobalFederationInstance;
    getGlobalFederationConstructor: typeof getGlobalFederationConstructor;
    setGlobalFederationConstructor: typeof setGlobalFederationConstructor;
    getInfoWithoutType: typeof getInfoWithoutType;
    getGlobalSnapshot: typeof getGlobalSnapshot;
    getTargetSnapshotInfoByModuleInfo: typeof getTargetSnapshotInfoByModuleInfo;
    getGlobalSnapshotInfoByModuleInfo: typeof getGlobalSnapshotInfoByModuleInfo;
    setGlobalSnapshotInfoByModuleInfo: typeof setGlobalSnapshotInfoByModuleInfo;
    addGlobalSnapshot: typeof addGlobalSnapshot;
    getRemoteEntryExports: typeof getRemoteEntryExports;
    registerGlobalPlugins: typeof registerGlobalPlugins;
    getGlobalHostPlugins: typeof getGlobalHostPlugins;
    getPreloaded: typeof getPreloaded;
    setPreloaded: typeof setPreloaded;
}
declare const _default: {
    global: IGlobalUtils;
    share: IShareUtils;
    utils: {
        matchRemoteWithNameAndExpose: typeof matchRemoteWithNameAndExpose;
        preloadAssets: typeof preloadAssets;
        getRemoteInfo: typeof getRemoteInfo;
    };
};
export default _default;
export type { IGlobalUtils, IShareUtils };
