export declare enum ExitCode {
    CommitlintDefault = 0,
    CommitlintErrorDefault = 1,
    CommitLintWarning = 2,
    CommitLintError = 3,
    CommitlintInvalidArgument = 9
}
export declare class CliError extends Error {
    __proto__: ErrorConstructor;
    type: string;
    error_code: ExitCode;
    constructor(message: string, type: string, error_code?: ExitCode);
}
//# sourceMappingURL=cli-error.d.ts.map