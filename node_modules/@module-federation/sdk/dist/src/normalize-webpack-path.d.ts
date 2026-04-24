import type webpack from 'webpack';
export declare function getWebpackPath(compiler: webpack.Compiler, options?: {
    framework: 'nextjs' | 'other';
}): string;
export declare const normalizeWebpackPath: (fullPath: string) => string;
