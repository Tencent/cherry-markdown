type LogMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';
type LoggerDelegate = Partial<Record<LogMethod, (...args: any[]) => void>> & {
    [key: string]: ((...args: any[]) => void) | undefined;
};
declare class Logger {
    prefix: string;
    private delegate;
    constructor(prefix: string, delegate?: LoggerDelegate);
    setPrefix(prefix: string): void;
    setDelegate(delegate?: LoggerDelegate): void;
    private emit;
    log(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    success(...args: any[]): void;
    info(...args: any[]): void;
    ready(...args: any[]): void;
    debug(...args: any[]): void;
}
declare function createLogger(prefix: string): Logger;
type InfrastructureLogger = Logger & {
    __mf_infrastructure_logger__: true;
};
declare function createInfrastructureLogger(prefix: string): InfrastructureLogger;
type InfrastructureLoggerCapableCompiler = {
    getInfrastructureLogger?: (name: string) => unknown;
};
declare function bindLoggerToCompiler(loggerInstance: Logger, compiler: InfrastructureLoggerCapableCompiler, name: string): void;
declare const logger: Logger;
declare const infrastructureLogger: InfrastructureLogger;
export { logger, infrastructureLogger, createLogger, createInfrastructureLogger, bindLoggerToCompiler, };
export type { Logger, InfrastructureLogger };
