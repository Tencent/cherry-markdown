# Client-specific contribution notes

Excited to hear that you are interested in contributing to this project! Thanks!

The repository-wide contribution flow, branch conventions, Changesets, and Vite+ commands are documented in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md). This file only records requirements specific to the Tauri client.

### Setup (locally)

**This client project is developed using Node+rust, so you must first ensure that the development environment is correct.**

- The first step is to [install rust](https://www.rust-lang.org/tools/install).
- And you need to [install node](https://nodejs.org/) too(It is recommended to use [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) to install).

---

Install dependencies from the repository root with Yarn; do not create a separate pnpm lockfile for this workspace.

```shell
yarn install
```

The client is a workspace managed by Vite+. `yarn dev:client` invokes `tauri dev` and opens the native desktop client; use the package-level `dev` script only when you need the standalone web server.

### Development

- Start the native Tauri client in development mode.

```shell
yarn dev:client

```

- Build the client together with the current Cherry Markdown package.

```shell
yarn build:client
```

The root command runs the package `tauri:dev` script through Vite+, which invokes the Tauri CLI. After installing Rust and the platform dependencies, it starts the native window and the Vite dev server configured in `src-tauri/tauri.conf.json`.

For the native Tauri bundle, run:

```shell
./node_modules/.bin/vp run -F @cherry-markdown/client tauri:build
```

#### More

- Now using [tauri v2.0](https://tauri.app/).
