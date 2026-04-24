const RUNTIME_001 = 'RUNTIME-001';
const RUNTIME_002 = 'RUNTIME-002';
const RUNTIME_003 = 'RUNTIME-003';
const RUNTIME_004 = 'RUNTIME-004';
const RUNTIME_005 = 'RUNTIME-005';
const RUNTIME_006 = 'RUNTIME-006';
const RUNTIME_007 = 'RUNTIME-007';
const RUNTIME_008 = 'RUNTIME-008';
const RUNTIME_009 = 'RUNTIME-009';
const TYPE_001 = 'TYPE-001';
const BUILD_001 = 'BUILD-001';
const BUILD_002 = 'BUILD-002';

const getDocsUrl = (errorCode) => {
    const type = errorCode.split('-')[0].toLowerCase();
    return `View the docs to see how to solve: https://module-federation.io/guide/troubleshooting/${type}/${errorCode}`;
};
const getShortErrorMsg = (errorCode, errorDescMap, args, originalErrorMsg) => {
    const msg = [`${[errorDescMap[errorCode]]} #${errorCode}`];
    args && msg.push(`args: ${JSON.stringify(args)}`);
    msg.push(getDocsUrl(errorCode));
    originalErrorMsg && msg.push(`Original Error Message:\n ${originalErrorMsg}`);
    return msg.join('\n');
};

const runtimeDescMap = {
    [RUNTIME_001]: 'Failed to get remoteEntry exports.',
    [RUNTIME_002]: 'The remote entry interface does not contain "init"',
    [RUNTIME_003]: 'Failed to get manifest.',
    [RUNTIME_004]: 'Failed to locate remote.',
    [RUNTIME_005]: 'Invalid loadShareSync function call from bundler runtime',
    [RUNTIME_006]: 'Invalid loadShareSync function call from runtime',
    [RUNTIME_007]: 'Failed to get remote snapshot.',
    [RUNTIME_008]: 'Failed to load script resources.',
    [RUNTIME_009]: 'Please call createInstance first.',
};
const typeDescMap = {
    [TYPE_001]: 'Failed to generate type declaration. Execute the below cmd to reproduce and fix the error.',
};
const buildDescMap = {
    [BUILD_001]: 'Failed to find expose module.',
    [BUILD_002]: 'PublicPath is required in prod mode.',
};
const errorDescMap = {
    ...runtimeDescMap,
    ...typeDescMap,
    ...buildDescMap,
};

export { BUILD_001, BUILD_002, RUNTIME_001, RUNTIME_002, RUNTIME_003, RUNTIME_004, RUNTIME_005, RUNTIME_006, RUNTIME_007, RUNTIME_008, RUNTIME_009, TYPE_001, buildDescMap, errorDescMap, getShortErrorMsg, runtimeDescMap, typeDescMap };
//# sourceMappingURL=index.esm.mjs.map
