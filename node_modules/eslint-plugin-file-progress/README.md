# eslint-plugin-file-progress

[![Version](https://badgen.net/npm/v/eslint-plugin-file-progress)](https://www.npmjs.com/package/eslint-plugin-file-progress)
[![Version](https://badgen.net/npm/license/eslint-plugin-file-progress?color=red)](https://github.com/sibiraj-s/eslint-plugin-file-progress/blob/master/LICENSE)
[![Tests](https://github.com/sibiraj-s/eslint-plugin-file-progress/workflows/Tests/badge.svg)](https://github.com/sibiraj-s/eslint-plugin-file-progress/actions)

> Eslint plugin to print file progress

## Getting Started

### Installation

```bash
npm i -D eslint-plugin-file-progress
# or
yarn add --dev eslint-plugin-file-progress
```

### Usage

```yml
# .eslintrc.yml

plugins:
  - file-progress

rules:
  file-progress/activate: 1

settings:
  progress:
    hide: false # hides the progress with spinner. Print's a static `Linting...` text
    successMessage: "Lint done..."
```

### Demo

Who likes a silent console ¯\\\_(ツ)\_/¯

![Progress](assets/progress.gif)

### Only on CLI

Some eslint plugins for code editors may conflict with this plugin rule (or, in that context, a file progress is not relevant)

```bash
npx eslint . --plugin file-progress --rule 'file-progress/activate: 1'
```

Or, in your package.json's command:

```diff
{
  "scripts: [
-    "lint": "eslint ."
+    "lint": "eslint . --plugin file-progress --rule \"file-progress/activate: 1\""
  ]
}
```

Use `file-progress/activate: 0` to disable the plugin. See https://eslint.org/docs/latest/user-guide/command-line-interface#specifying-rules-and-plugins for more details on how to use CLI
