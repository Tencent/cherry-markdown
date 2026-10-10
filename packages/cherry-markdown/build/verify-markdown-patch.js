import assert from 'node:assert/strict';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dependency = '@codemirror/lang-markdown';
const require = createRequire(import.meta.url);
const options = { nonTightLists: false, continueLooseLists: false, exitParagraphBoundary: true };

function checkCommand(markdown, EditorState, label) {
  // Exercise behavior, since unpatched upstream silently ignores unknown options.
  for (const [before, after, lineSeparator] of [
    ['- a\n\n- b|', '- a\n\n- b\n- |', '\n'],
    ['> - a\n> - |\n> - c', '> - a\n>\n> |\n>\n> - c', '\n'],
    ['- a\n- |', '- a\n\n|', '\r\n'],
  ]) {
    let state = EditorState.create({
      doc: before.replace('|', '').replace(/\n/g, lineSeparator),
      selection: { anchor: before.indexOf('|') },
      extensions: [markdown.markdown(), EditorState.lineSeparator.of(lineSeparator)],
    });
    const handled = markdown.insertNewlineContinueMarkupCommand(options)({
      state,
      dispatch: (transaction) => {
        state = transaction.state;
      },
    });
    assert.equal(handled, true, `${label}: command did not handle the list`);
    const text = state.doc.sliceString(0, state.doc.length, '\n');
    const { head } = state.selection.main;
    assert.equal(`${text.slice(0, head)}|${text.slice(head)}`, after, `${label}: patched Enter behavior is missing`);
  }
}

export async function verifyMarkdownPatch() {
  try {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    const version = manifest.dependencies[dependency];
    assert.match(version, /^\d+\.\d+\.\d+$/, `${dependency} must use an exact version`);
    assert.ok(
      existsSync(new URL(`../../../patches/@codemirror+lang-markdown+${version}.patch`, import.meta.url)),
      `Missing dependency patch for ${version}`,
    );

    const entries = [fileURLToPath(import.meta.resolve(dependency)), require.resolve(dependency)];
    for (const entry of entries) {
      const installed = JSON.parse(readFileSync(resolve(dirname(entry), '../package.json'), 'utf8'));
      assert.equal(installed.version, version, `${entry}: installed dependency version differs from the pin`);
      const declaration = entry.replace(/\.(?:cjs|js)$/, entry.endsWith('.cjs') ? '.d.cts' : '.d.ts');
      const types = readFileSync(declaration, 'utf8');
      for (const option of ['continueLooseLists', 'exitParagraphBoundary']) {
        assert.match(types, new RegExp(`${option}\\s*\\?\\s*:\\s*boolean`), `${declaration}: missing ${option}`);
      }
    }

    checkCommand(await import(dependency), (await import('@codemirror/state')).EditorState, 'ESM');
    checkCommand(require(dependency), require('@codemirror/state').EditorState, 'CJS');
  } catch (error) {
    throw new Error(
      `[Cherry Markdown patch] ${error.message}\nRun vp install --frozen-lockfile at the workspace root with lifecycle scripts enabled. See patches/README.md.`,
      { cause: error },
    );
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifyMarkdownPatch().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
