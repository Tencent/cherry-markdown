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

With focus in the preview, press **Ctrl+F** (**Cmd+F** on macOS) to search rendered content using the VS Code Webview find widget. Search follows the Webview’s visible rendered text: expand collapsed sections before searching; formula and diagram text may not be searchable.

The preview follows the active Markdown document. When another file type has focus, visual editing is disabled so that changes cannot be written to the wrong document.

Uploads insert a unique temporary Markdown URL at the original selection before starting. Once that placeholder is synchronized to VS Code, switching documents or closing the preview does not redirect the result: it replaces the placeholder in the original open document. Deleting, undoing or duplicating the placeholder, or closing the document, cancels automatic insertion. Upload results remain unsaved edits; the extension does not save the document automatically. Failed or cancelled uploads may leave a placeholder or an already-uploaded asset for manual cleanup.

By default, the preview follows VS Code's light or dark theme, including high-contrast variants. Configure the corresponding Cherry themes with `cherryMarkdown.LightTheme` and `cherryMarkdown.DarkTheme`. Set `cherryMarkdown.ThemeMode` to `manual` or choose a theme from Cherry's built-in theme menu to use a manual theme. The selected manual theme is stored in the extension's global state and restored when manual mode is used again.

## Settings

| Setting                             | Values                        | Default          | Description                                                            |
| ----------------------------------- | ----------------------------- | ---------------- | ---------------------------------------------------------------------- |
| `cherryMarkdown.Usage`              | `active`, `only-manual`       | `active`         | Controls automatic preview opening.                                    |
| `cherryMarkdown.ImageUploadMode`    | `workspace`, `data`, `remote` | `workspace`      | Selects local workspace, Base64, or remote HTTP upload.                |
| `cherryMarkdown.AssetDirectory`     | relative path                 | `.cherry-assets` | Directory for files uploaded into the workspace.                       |
| `cherryMarkdown.CustomUploader`     | object                        | disabled         | Configures a custom HTTP uploader for remote mode.                     |
| `cherryMarkdown.BackfillImageProps` | array                         | `[]`             | Adds border, shadow, radius, or no-border metadata to inserted images. |

Configuration values are stable across VS Code display languages. Manual theme selections are stored in the extension's global state. The extension does not automatically migrate, rewrite or delete settings.

## Upload settings upgrade

This release stops using the retired `cherryMarkdown.UploadType` and `cherryMarkdown.PicGoServer` settings. There is no legacy PicGo request adapter. Existing users must configure the current settings manually, for example:

```json
{
  "cherryMarkdown.ImageUploadMode": "remote",
  "cherryMarkdown.CustomUploader": {
    "enable": true,
    "url": "https://uploads.example.com/upload",
    "headers": {}
  }
}
```

The endpoint must accept the file bytes as the HTTP POST body (`application/octet-stream` by default, with an `X-File-Name` header) and return a supported URL response such as `{ "url": "https://example.com/image.png" }`. An old PicGo endpoint is not automatically compatible with this protocol. Server errors are reported without silently switching to another uploader.

With only retired settings present, attempting an upload shows an upgrade warning and sends no file. The warning offers **Open upload settings** and **View configuration guide**. Valid explicitly configured `ImageUploadMode` settings take precedence over retired settings, so leftover old keys do not repeatedly warn. This is a temporary detection-only notice, planned for removal in the next major release; it never performs migration or old-protocol uploads.

Settings resolve per document: **workspace folder → workspace → user → default**. In a multi-root workspace, a folder's `.vscode/settings.json` applies only to documents in that folder. Folder settings that were previously ignored can now take effect; check the upload target and source shown at the bottom of the preview before uploading.

`CustomUploader` is selected as a whole object from one scope. A folder-specific URL does not inherit user-level authentication headers. Missing required fields or an invalid explicit setting stop the upload rather than falling back to another destination. `AssetDirectory` must stay inside the workspace folder.

In Restricted Mode, workspace and folder upload settings are ignored. User-level settings remain available. If no usable user-level configuration exists, the warning offers **Manage Workspace Trust**; this opens VS Code's native authorization UI and does not authorize or copy an endpoint automatically. Trusting a workspace enables more than just uploads. When trust is granted, the preview refreshes the selected configuration. Previously migrated global settings are not automatically removed because the extension cannot reliably distinguish them from intentional user settings.

## Upload security

- Workspace-defined remote uploader settings and asset directories are ignored in Restricted Mode.
- Upload endpoints must use HTTP or HTTPS.
- Upload files are limited to 50 MB and requests time out after 30 seconds.
- Workspace mode copies files into `.cherry-assets` and inserts a relative Markdown path.
- Base64 mode only supports images and is intended for documents without a workspace.

Authentication headers stored in settings are visible as plain text. Prefer user settings over workspace settings and avoid committing credentials to the repository.

If both border and no-border image properties are selected, no-border takes precedence. Shadow and rounded corners remain enabled independently.

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
