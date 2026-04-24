import * as ensure from '@commitlint/ensure';
import message from '@commitlint/message';
export const scopeEnum = ({ scope }, when = 'always', value = []) => {
    if (!scope || !value.length) {
        return [true, ''];
    }
    // Scopes may contain slash or comma delimiters to separate them and mark them as individual segments.
    // This means that each of these segments should be tested separately with `ensure`.
    const delimiters = /\/|\\|, ?/g;
    const messageScopes = scope.split(delimiters);
    const errorMessage = ['scope must', `be one of [${value.join(', ')}]`];
    const isScopeInEnum = (scope) => ensure.enum(scope, value);
    let isValid;
    if (when === 'never') {
        isValid = !messageScopes.some(isScopeInEnum) && !isScopeInEnum(scope);
        errorMessage.splice(1, 0, 'not');
    }
    else {
        isValid = messageScopes.every(isScopeInEnum) || isScopeInEnum(scope);
    }
    return [isValid, message(errorMessage)];
};
//# sourceMappingURL=scope-enum.js.map