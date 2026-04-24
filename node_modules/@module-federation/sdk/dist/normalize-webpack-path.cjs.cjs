'use strict';

var path = require('path');

function getWebpackPath(compiler, options = { framework: 'other' }) {
    try {
        // @ts-ignore just throw err
        compiler.webpack();
        return '';
    }
    catch (err) {
        const trace = err.stack?.split('\n') || [];
        const webpackErrLocation = trace.find((item) => item.includes('at webpack')) || '';
        const webpackLocationWithDetail = webpackErrLocation
            .replace(/[^\(\)]+/, '')
            .slice(1, -1);
        const webpackPath = webpackLocationWithDetail
            .split(':')
            .slice(0, -2)
            .join(':');
        if (options?.framework === 'nextjs') {
            if (webpackPath.endsWith('webpack.js')) {
                return webpackPath.replace('webpack.js', 'index.js');
            }
            return '';
        }
        return require.resolve('webpack', { paths: [webpackPath] });
    }
}
const normalizeWebpackPath = (fullPath) => {
    if (fullPath === 'webpack') {
        return process.env['FEDERATION_WEBPACK_PATH'] || fullPath;
    }
    if (process.env['FEDERATION_WEBPACK_PATH']) {
        return path.resolve(process.env['FEDERATION_WEBPACK_PATH'], fullPath.replace('webpack', '../../'));
    }
    return fullPath;
};

exports.getWebpackPath = getWebpackPath;
exports.normalizeWebpackPath = normalizeWebpackPath;
//# sourceMappingURL=normalize-webpack-path.cjs.cjs.map
