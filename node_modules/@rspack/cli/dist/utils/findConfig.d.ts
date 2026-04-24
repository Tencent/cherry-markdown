/**
 * Takes a basePath like `webpack.config`, return `webpack.config.{ext}` if
 * exists. returns undefined if none of them exists
 */
declare const findConfig: (basePath: string) => string | undefined;
export default findConfig;
