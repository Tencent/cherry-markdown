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

This release stops reading the retired `cherryMarkdown.UploadType` and `cherryMarkdown.PicGoServer` settings. **PicGo remains supported through the current `CustomUploader` settings**, using multipart file uploads. Old settings are not migrated automatically; there is no path-list or clipboard protocol fallback.

For an existing binary HTTP uploader, keep your current settings. Omitting `format` preserves the original binary request behavior:

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

With `format: "binary"` (the default), the endpoint must accept file bytes as the HTTP POST body (`application/octet-stream` by default, with an `X-File-Name` header). With `format: "multipart"`, the extension sends one file part; `fieldName` defaults to `files` and may be changed for other form-upload services. Field names may contain letters, digits, underscores, dots, hyphens and square brackets (1–128 characters).

Both formats accept supported URL responses, including `{ "url": "https://example.com/image.png" }` and PicGo's `{ "success": true, "result": ["https://example.com/image.png"] }`. A response with `success: false` is rejected. The extension does not guess a format from the address or retry another protocol or endpoint after a failure.

### PicGo configuration

1. Use **PicGo 2.4.0 or newer**, configure your image host in PicGo, and keep PicGo running with its HTTP server enabled. Earlier versions without multipart support must be upgraded.
2. Replace the retired VS Code settings with the following current settings. Use your actual PicGo server address if it differs from the default:

```json
{
  "cherryMarkdown.ImageUploadMode": "remote",
  "cherryMarkdown.CustomUploader": {
    "enable": true,
    "url": "http://127.0.0.1:36677/upload",
    "format": "multipart",
    "fieldName": "files",
    "headers": {}
  }
}
```

PicGo requires the multipart field name `files`. Do not merely copy its `/upload` URL into a binary uploader: changing the URL or setting an `application/json` header does not change the request encoding. The extension generates the multipart `Content-Type` boundary and body length automatically; configured `Content-Type` and `Content-Length` headers are ignored in multipart mode. Other headers, such as `Authorization`, remain available. If your PicGo server requires a secret, add `"Authorization": "Bearer YOUR_PICGO_SERVER_SECRET"` inside `headers`, preferably in user settings.

The file bytes are sent to PicGo, not a local path or clipboard command. In Remote SSH, containers or WSL, `127.0.0.1` refers to the extension host's network environment; ensure that it can reach the configured PicGo server. See the [official PicGo multipart API](https://docs.picgo.app/gui/guide/advance#upload-images-with-http-form-data).

With only retired settings present, attempting an upload shows an upgrade warning and sends no file. It explicitly directs PicGo 2.4.0+ users to `ImageUploadMode=remote`, `format=multipart` and `fieldName=files`, with **Open upload settings** and **View configuration guide** actions. Valid explicitly configured `ImageUploadMode` settings take precedence over retired settings, so leftover old keys do not repeatedly warn. This is a temporary detection-only notice, planned for removal in the next major release; it never performs migration or old-protocol uploads.

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
