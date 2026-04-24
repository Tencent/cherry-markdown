export var ExitCode;
(function (ExitCode) {
    ExitCode[ExitCode["CommitlintDefault"] = 0] = "CommitlintDefault";
    ExitCode[ExitCode["CommitlintErrorDefault"] = 1] = "CommitlintErrorDefault";
    ExitCode[ExitCode["CommitLintWarning"] = 2] = "CommitLintWarning";
    ExitCode[ExitCode["CommitLintError"] = 3] = "CommitLintError";
    ExitCode[ExitCode["CommitlintInvalidArgument"] = 9] = "CommitlintInvalidArgument";
})(ExitCode || (ExitCode = {}));
export class CliError extends Error {
    __proto__ = Error;
    type;
    error_code;
    constructor(message, type, error_code = ExitCode.CommitlintErrorDefault) {
        super(message);
        this.type = type;
        this.error_code = error_code;
        Object.setPrototypeOf(this, CliError.prototype);
    }
}
//# sourceMappingURL=cli-error.js.map