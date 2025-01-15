# Contributing

Excited to hear that you are interested in contributing to this project! Thanks!

## Documentation

The easiest way to contribute documentation to this project is to follow these steps:

1. [Fork the repository](https://docs.github.com/zh/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo).
2. Clone the newly forked repo from your GitHub account.
3. Create a new branch to add your work to, i.e. git checkout -b client/feat/xxx.
4. Make your changes and commit them
5. Push the branch to your fork
6. Go to <https://github.com/Tencent/cherry-markdown/pulls>, there should be a "Compare & Pull Request" button, where you can create a PR.

### Setup (locally)

**This client project is developed using Node+rust, so you must first ensure that the development environment is correct.**

- The first step is to [install rust](https://www.rust-lang.org/tools/install).
- And you need to [install node](https://nodejs.org/) too(It is recommended to use [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) to install).

---
This project uses [pnpm](https://pnpm.io/) to manage the dependencies, install it if you haven't via.

```shell
npm i -g pnpm
```

Clone this repo to your local machine and install the dependencies.

```shell
pnpm install
```

> [!TIP]
> If you are using another package manager, you need to pay attention to [`client/tauri.conf.json`](./tauri.conf.json) configuration.
> `build.beforeDevCommand:your package manager dev`
> `build.beforeBuildCommand:your package manager dev`
> Then you can use `yarn/npm/pnpm` to build the project.

### Development

- Build with watch mode.

```shell
pnpm tauri:dev

```

- To build all the packages at once, run the following command on the project root.

```shell
pnpm tauri:build
```

#### More

- Now using [tauri v2.0](https://tauri.app/).
