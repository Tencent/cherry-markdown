import { type Compiler, MultiCompiler } from "../..";
import type { MiddlewareHandler } from "../../config/devServer";
export declare const LAZY_COMPILATION_PREFIX = "/lazy-compilation-using-";
export declare const lazyCompilationMiddleware: (compiler: Compiler | MultiCompiler) => MiddlewareHandler;
