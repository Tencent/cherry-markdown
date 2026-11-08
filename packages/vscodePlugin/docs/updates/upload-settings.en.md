# Cherry Markdown: important upload configuration changes

**PicGo remains supported and existing binary uploads stay unchanged.** Settings are never automatically migrated, rewritten or deleted.

## What needs attention?

| Change                                                                             | Action                                                                      |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Retired `UploadType`, `PicGoServer` and old upload-mode aliases are no longer read | Configure the current settings shown below                                  |
| Folder-level settings now take effect                                              | In multi-root workspaces, check the upload target and source in the preview |
| Each uploader comes entirely from one settings scope                               | Project uploaders no longer inherit user-level authentication headers       |
| Invalid modes, URLs, field names or asset directories stop uploads                 | Correct the settings; the extension does not switch targets or formats      |
| Retired `Theme` is no longer read or migrated                                      | Use current theme settings; saved manual themes remain available            |

Restricted Mode still permits user upload settings. Project settings require authorization through VS Code's native Workspace Trust UI. Keep credentials out of repositories.

## PicGo setup

Configure an image host in PicGo 2.4.0+, enable its HTTP server and manually set the following VS Code settings (adjust the address if needed):

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

The extension sends file contents and generates the multipart boundary and length. Add `Authorization` to `headers` if your server requires a secret. In Remote SSH, containers or WSL, `127.0.0.1` refers to the extension host; ensure it can reach PicGo.

Existing binary HTTP uploaders can keep their settings: omitting `format` still means `binary`. Server failures never trigger another protocol automatically.

## Will this notification repeat?

This notice appears automatically once per VS Code profile, including when dismissed. Window reloads and ordinary patch releases do not repeat it. On the first release of this feature, new installs cannot reliably be distinguished from upgrades, so both see it once.

Only the extension's internal notice state is recorded; user settings are not changed. Upload-time configuration warnings remain available. Run **Cherry Markdown: View update notes** from the Command Palette to reopen this page later.

[Full configuration and upgrade guide](../../README.md#upload-settings-upgrade)
