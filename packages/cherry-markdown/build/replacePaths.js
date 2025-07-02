const replaceInFile = require('replace-in-file');

async function replacePaths() {
  const results = await replaceInFile({
    files: 'dist/types/**/*.d.ts',
    from: /~types\//g,
    to: '../../types/',
  });
  for (const result of results) {
    if (result.hasChanged) {
      console.log(result);
    }
  }
}

replacePaths();
