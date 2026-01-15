import pkg from 'replace-in-file';
const { replaceInFile } = pkg;

async function replacePaths() {
  try {
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
  } catch (error) {
    throw error;
  }
}

replacePaths();
