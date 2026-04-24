<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://assets.rspack.dev/rspack/rspack-banner-plain-dark.png">
  <img alt="Rspack Banner" src="https://assets.rspack.dev/rspack/rspack-banner-plain-light.png">
</picture>

# @rspack/dev-server

<p>
  <a href="https://npmjs.com/package/@rspack/dev-server?activeTab=readme"><img src="https://img.shields.io/npm/v/@rspack/dev-server?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>
  <a href="https://npmcharts.com/compare/@rspack/dev-server?minimal=true"><img src="https://img.shields.io/npm/dm/@rspack/dev-server.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
  <a href="https://nodejs.org/en/about/previous-releases"><img src="https://img.shields.io/node/v/@rspack/dev-server.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="node version"></a>
  <a href="https://github.com/web-infra-dev/rspack-dev-server/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" /></a>
</p>

Use Rspack with a development server that provides live reloading. This should be used for development only.

> `@rspack/dev-server` is based on `webpack-dev-server@5`

## Installation

First of all, install `@rspack/dev-server` and `@rspack/core` by your favorite package manager:

```bash
# npm
$ npm install @rspack/dev-server @rspack/core --save-dev

# yarn
$ yarn add @rspack/dev-server @rspack/core --dev

# pnpm
$ pnpm add @rspack/dev-server @rspack/core --save-dev

# bun
$ bun add @rspack/dev-server @rspack/core -D
```

## Usage

There are two recommended ways to use `@rspack/dev-server`:

### With the CLI

The easiest way to use it is with the [`@rspack/cli`](https://www.npmjs.com/package/@rspack/cli).

You can install it in your project by:

```bash
# npm
$ npm install @rspack/cli --save-dev

# yarn
$ yarn add @rspack/cli --dev

# pnpm
$ pnpm add @rspack/cli --save-dev

# bun
$ bun add @rspack/cli -D
```

And then start the development server by:

```bash
# with rspack.config.js
$ rspack serve

# with custom config file
$ rspack serve -c ./your.config.js
```

> See [CLI](https://rspack.dev/api/cli) for more details.

While starting the development server, you can specify the configuration by the `devServer` field of your Rspack config file:

```js
// rspack.config.js
module.exports = {
  // ...
  devServer: {
    // the configuration of the development server
    port: 8080
  },
};
```

> See [DevServer](https://rspack.dev/config/dev-server) for all configuration options.

### With the API

While it's recommended to run `@rspack/dev-server` via the CLI, you may also choose to start a server via the API.

```js
import { RspackDevServer } from "@rspack/dev-server";
import rspack from "@rspack/core";
import rspackConfig from './rspack.config.js';

const compiler = rspack(rspackConfig);
const devServerOptions = {
  ...rspackConfig.devServer,
  // override
  port: 8888
};

const server = new RspackDevServer(devServerOptions, compiler);

server.startCallback(() => {
  console.log('Successfully started server on http://localhost:8888');
});
```

> Cause `@rspack/dev-server` is based on `webpack-dev-server@5`, you can see the [webpack-dev-server API](https://webpack.js.org/api/webpack-dev-server/) for more methods of the server instance.

## Credits

Thanks to the [webpack-dev-server](https://github.com/webpack/webpack-dev-server) project created by [@sokra](https://github.com/sokra)

## License

[MIT licensed](https://github.com/web-infra-dev/rspack-dev-server/blob/main/LICENSE).
