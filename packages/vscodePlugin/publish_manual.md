# VS Code extension release

The extension is built and published through `.github/workflows/reusable-vscode-plugin.yml`.

Release mode performs the following steps:

1. Prepares the temporary Marketplace package names.
2. Installs dependencies and builds Cherry Markdown.
3. Type-checks and tests the extension.
4. Builds the production Extension Host and Webview bundles.
5. Verifies required package artifacts.
6. Packages one VSIX.
7. Publishes that VSIX to Visual Studio Marketplace and Open VSX.

Required repository secrets:

- `VSCE_PAT`
- `OVSX_PAT`

Do not publish a locally generated VSIX unless the release workflow is unavailable and the archive has passed the same type, test, build, and package checks.
