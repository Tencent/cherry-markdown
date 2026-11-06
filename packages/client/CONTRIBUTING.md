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

- Build the current Cherry Markdown package, then build the client frontend.

```shell
yarn build:core
yarn build:client
```

`yarn dev:client` runs the package `tauri:dev` script through Vite+ and starts the native window and configured Vite dev server. `yarn build:client` runs the client `build` script, which checks types and builds frontend assets; it does not build the Cherry package or create a native installer. Build Cherry first when its current source is needed.

After installing Rust and the [Tauri platform prerequisites](https://v2.tauri.app/start/prerequisites/), build Cherry first if needed, then create the native Tauri bundle:

```shell
./node_modules/.bin/vp run -F @cherry-markdown/client tauri:build
```

#### More

### Editor regression tests

Run `vp run test:client` from the workspace root for document notification, asynchronous lifecycle and file-history regressions. Run `vp run -F @cherry-markdown/client test:e2e` for Chromium checks with the real client adapters; install Chromium with Playwright first.

The browser fixture uses the current Cherry source and the client editor adapters without a native Tauri shell. It checks immediate edits after programmatic writes, rapid engine changes, disposal during mounting and undo/redo across file boundaries. Both commands run in the PR test workflow. Changes to file loading must keep programmatic writes silent while preserving user notifications; clearing history must retain unrelated ProseMirror plugin state.

- Now using [tauri v2.0](https://tauri.app/).
