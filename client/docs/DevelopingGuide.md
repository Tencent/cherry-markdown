# Developing Cherry Noted Client

Here is a guide for client [client](../../client) development. If you have any questions about the client's functionality, please refer to: [docs/README.md](/docs/README.md)

## Getting Started

In order to contribute to Electron, the first thing you'll want to do is get the code.

Please pull the `dev` branch of [Cherry markdown](https://github.com/Tencent/cherry-markdown). There is a **/client** folder under this repo, which is the development directory for Cherry Noted.

## Quick Start

- `/electron` : Process code for Electron.
  - `/electron/main/index` : The function entrance of Electron is preset with some Electon functions.
- `preload` : Contains custom Electron functionality.
- `src` : The production of rendered pages.
- Communication between [rendering processes](https://www.electronjs.org/docs/latest/api/ipc-renderer) and [service processes](https://www.electronjs.org/docs/latest/api/ipc-main).

## Future

[Future](/docs/Future.md) documented the future plans and ideas of the client. If you want to contribute to 'Cherry Noted client', please refer to this functional requirement.

If you want to add new functional requirements (not included in [Future](/docs/Future.md)),Please open an [issue](https://github.com/Tencent/cherry-markdown/issues) for discussion.

If the [Future](/docs/Future.md)  plan has been implemented, please ask the administrator to annotate it with the PR index and declare it completed.

## CHANGELOG

[CHANGELOG](/docs/CHANGELOG.md) is update logs for every **Cherry Noted** post. Administrators should update in a timely manner when publishing.

## README

[docs/README.md](/docs/README.md) The newly added features and usage tips should be explained here. It should mainly explain to users how to use it.
