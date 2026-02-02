import pkg from 'replace-in-file';
const { replaceInFile } = pkg;

async function replacePaths() {
  try {
    const results = [];
    const firstResults = await replaceInFile({
      files: 'dist/types/**/*.d.ts',
      from: /~types\//g,
      to: '../../types/',
    });
    results.push(...firstResults);
    const secondResults = await replaceInFile({
      files: 'dist/types/**/*.d.ts',
      from: /@\/addons\//g,
      to: './addons/',
    });
    results.push(...secondResults);
    for (const result of results) {
      if (result.hasChanged) {
        console.log(result);
      }
    }
  } catch (error) {
    throw error;
  }
}

replacePaths();
