# Cherry Markdown for VS Code

Cherry Markdown for VS Code provides a live Markdown preview and an optional visual editing surface powered by [Cherry Markdown](https://github.com/Tencent/cherry-markdown).

## Features

- Live preview with bidirectional scroll synchronization
- Optional visual editing with VS Code undo, save, and external-change protection
- CommonMark, GitHub Flavored Markdown, formulas, tables, checklists, media, and Cherry Markdown extensions
- Relative workspace images and links
- PNG export
- Image insertion using base64, a custom uploader, or PicGo
- English, Simplified Chinese, and Russian UI

## Usage

Open a Markdown file and run **Cherry Markdown: Preview in Cherry Markdown** from the Command Palette or the editor context menu.

By default, the preview opens automatically for active Markdown documents. Set `cherryMarkdown.Usage` to `only-manual` to open it only through the command.

The preview follows the active Markdown document. When another file type has focus, visual editing is disabled so that changes cannot be written to the wrong document.

## Settings

| Setting                             | Values                            | Default                         | Description                                                            |
| ----------------------------------- | --------------------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| `cherryMarkdown.Usage`              | `active`, `only-manual`           | `active`                        | Controls automatic preview opening.                                    |
| `cherryMarkdown.Theme`              | `default`, `dark`, `green`, `red` | `default`                       | Selects the Cherry Markdown theme.                                     |
| `cherryMarkdown.UploadType`         | `none`, `custom`, `picgo`         | `none`                          | Selects image insertion behavior.                                      |
| `cherryMarkdown.CustomUploader`     | object                            | disabled                        | Configures a custom HTTP uploader.                                     |
| `cherryMarkdown.PicGoServer`        | URL                               | `http://127.0.0.1:36677/upload` | Configures the PicGo server endpoint.                                  |
| `cherryMarkdown.BackfillImageProps` | array                             | `[]`                            | Adds border, shadow, radius, or no-border metadata to inserted images. |

Configuration values are stable across VS Code display languages. Values written by older English, Chinese, and Russian versions are still recognized.

## Upload security

- Workspace-defined custom uploader and PicGo endpoints are ignored in Restricted Mode.
- Upload endpoints must use HTTP or HTTPS.
- Upload files are limited to 50 MB and requests time out after 30 seconds.
- Without an uploader, only images are accepted and inserted as data URLs.

Authentication headers stored in settings are visible as plain text. Prefer user settings over workspace settings and avoid committing credentials to the repository.

## Development

From the repository root:

```bash
yarn install
yarn build:vscodePlugin
yarn workspace cherry-markdown-vscode-plugin typecheck
yarn workspace cherry-markdown-vscode-plugin test:unit
yarn workspace cherry-markdown-vscode-plugin test:package
yarn workspace cherry-markdown-vscode-plugin test:integration
```

To inspect the distributable package:

```bash
cd packages/vscodePlugin
yarn package
```

The integration test downloads a fixed VS Code version so local and CI runs use the same Extension Host contract.

## Feedback

Report extension issues using the [VS Code Plugin Feedback template](https://github.com/Tencent/cherry-markdown/issues/new?template=6.vscode_plugin_feedback.yml).
