export class WhitespacePluginError extends Error {
    __proto__ = Error;
    messageTemplate = 'whitespace-found';
    messageData = {};
    constructor(pluginName, data = {}) {
        super(`Whitespace found in plugin name '${pluginName}'`);
        this.messageData = data;
        Object.setPrototypeOf(this, WhitespacePluginError.prototype);
    }
}
export class MissingPluginError extends Error {
    __proto__ = Error;
    messageTemplate = 'plugin-missing';
    messageData;
    constructor(pluginName, errorMessage = '', data = {}) {
        super(`Failed to load plugin ${pluginName}: ${errorMessage}`);
        this.messageData = data;
        Object.setPrototypeOf(this, MissingPluginError.prototype);
    }
}
//# sourceMappingURL=plugin-errors.js.map