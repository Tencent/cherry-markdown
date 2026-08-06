# VS Code extension release

The extension is built and published through `.github/workflows/reusable-vscode-plugin.yml`.

Release mode performs the following steps:

1. Installs the frozen workspace dependencies.
2. Builds Cherry Markdown and the production Extension Host and Webview bundles.
3. Type-checks and tests the extension in Vitest and a VS Code Extension Host.
4. Verifies the required package artifacts.
5. Copies the verified extension into an isolated Marketplace staging directory and applies the public extension name there.
6. Packages and verifies one VSIX.
7. Publishes that same VSIX to Visual Studio Marketplace and Open VSX.

The source workspace keeps the internal name `cherry-markdown-vscode-plugin` because Yarn v1 workspaces cannot contain it and the core `cherry-markdown` package under the same name. Only the isolated staging manifest uses the public Marketplace name `cherry-markdown`; source packages and dependency declarations are not rewritten.

Required repository secrets:

- `VSCE_PAT`
- `OVSX_PAT`

Do not publish a locally generated VSIX unless the release workflow is unavailable and the archive has passed the same type, test, build, and package checks.
