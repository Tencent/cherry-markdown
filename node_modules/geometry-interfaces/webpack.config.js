const BabiliPlugin = require("babili-webpack-plugin");
const ModuleConcatenationPlugin = require('webpack/lib/optimize/ModuleConcatenationPlugin')

module.exports = {
    entry: [ ],
    resolve: {
        extensions: [ ".js", ".jsx", ]
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: [

                    {
                        loader: 'buble-loader',
                        options: {
                            target: { ie: 11 },
                            objectAssign: 'Object.assign',
                            transforms: {
                                modules: false,
                                dangerousForOf: true,
                            },
                        },
                    },

                ],
            },
        ],
    },
    plugins: [
        new ModuleConcatenationPlugin,
        new BabiliPlugin({}, {
            comments: false,
        }),
    ],
    devtool: "source-map",
}
