# Developing Cherry Noted Client

Here is a guide for client [client](../../client) development.

## Getting Started

In order to contribute to Electron, the first thing you'll want to do is get the code.

Please pull the `dev` branch of [Cherry markdown](https://github.com/Tencent/cherry-markdown). There is a **/client** folder under this repo, which is the development directory for Cherry Noted.

## Quick Start

- Environment:`node>=18`.
- Directory `cd client`
- Install `yarn`
- Run `yarn dev`

## Introduction to Basic Knowledge

- `/electron` : Process code for Electron.
  - `/electron/main/index` : The function entrance of Electron is preset with some Electon functions.
- `preload` : Contains custom Electron functionality.
- `src` : The production of rendered pages.use [vue3](https://vuejs.org/).
- Communication between [rendering processes](https://www.electronjs.org/docs/latest/api/ipc-renderer) and [service processes](https://www.electronjs.org/docs/latest/api/ipc-main).

## Future

[Future](/docs/Future.md) documented the future plans and ideas of the client. If you want to contribute to 'Cherry Noted client', please refer to this functional requirement.

If you want to add new functional requirements (not included in [Future](/docs/Future.md)),Please open an [issue](https://github.com/Tencent/cherry-markdown/issues) for discussion.

If the [Future](/docs/Future.md)  plan has been implemented, please ask the administrator to annotate it with the PR index and declare it completed.
