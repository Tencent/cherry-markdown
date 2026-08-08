# Cherry Markdown for VS Code

Cherry Markdown for VS Code provides a live Markdown preview and an optional visual editing surface powered by [Cherry Markdown](https://github.com/Tencent/cherry-markdown).

## Features

- Live preview with bidirectional scroll synchronization
- Optional visual editing with VS Code undo, save, and external-change protection
- CommonMark, GitHub Flavored Markdown, formulas, tables, checklists, media, and Cherry Markdown extensions
- Relative workspace images and links
- PNG export
- Image insertion into workspace assets, Base64 data, or a custom HTTP uploader
- English, Simplified Chinese, and Russian UI

## Usage

Open a Markdown file and run **Cherry Markdown: Preview in Cherry Markdown** from the Command Palette or the editor context menu.

By default, the preview opens automatically for active Markdown documents. Set `cherryMarkdown.Usage` to `only-manual` to open it only through the command.

The preview follows the active Markdown document. When another file type has focus, visual editing is disabled so that changes cannot be written to the wrong document.

Cherry Markdown's built-in theme menu controls the theme. The selected theme is stored in the extension's global state and restored when the preview opens again.

## Settings

| Setting                             | Values                        | Default          | Description                                                            |
| ----------------------------------- | ----------------------------- | ---------------- | ---------------------------------------------------------------------- |
| `cherryMarkdown.Usage`              | `active`, `only-manual`       | `active`         | Controls automatic preview opening.                                    |
| `cherryMarkdown.ImageUploadMode`    | `workspace`, `data`, `remote` | `workspace`      | Selects local workspace, Base64, or remote HTTP upload.                |
| `cherryMarkdown.AssetDirectory`     | relative path                 | `.cherry-assets` | Directory for files uploaded into the workspace.                       |
| `cherryMarkdown.CustomUploader`     | object                        | disabled         | Configures a custom HTTP uploader for remote mode.                     |
| `cherryMarkdown.BackfillImageProps` | array                         | `[]`             | Adds border, shadow, radius, or no-border metadata to inserted images. |

Configuration values are stable across VS Code display languages. Existing theme values are migrated as a fallback, but theme changes are now stored in the extension's global state rather than exposed as a VS Code setting.

## Upload security

- Workspace-defined remote uploader settings and asset directories are ignored in Restricted Mode.
- Upload endpoints must use HTTP or HTTPS.
- Upload files are limited to 50 MB and requests time out after 30 seconds.
- Workspace mode copies files into `.cherry-assets` and inserts a relative Markdown path.
- Base64 mode only supports images and is intended for documents without a workspace.

Authentication headers stored in settings are visible as plain text. Prefer user settings over workspace settings and avoid committing credentials to the repository.

## Development

From the repository root:

```bash
vp install
vp run build:vscodePlugin
vp run -F cherry-markdown-vscode-plugin typecheck
vp run -F cherry-markdown-vscode-plugin test:unit
vp run -F cherry-markdown-vscode-plugin test:package
vp run -F cherry-markdown-vscode-plugin test:integration
```

To inspect the distributable package:

```bash
cd packages/vscodePlugin
vp run package
```

The integration test downloads a fixed VS Code version so local and CI runs use the same Extension Host contract.

## Feedback

Report extension issues using the [VS Code Plugin Feedback template](https://github.com/Tencent/cherry-markdown/issues/new?template=6.vscode_plugin_feedback.yml).
