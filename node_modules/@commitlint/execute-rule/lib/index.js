export default execute;
export async function execute(rule) {
    if (!Array.isArray(rule)) {
        return null;
    }
    const [name, config] = rule;
    const fn = executable(config) ? config : async () => config;
    return [name, await fn()];
}
function executable(config) {
    return typeof config === 'function';
}
//# sourceMappingURL=index.js.map