import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import glob from 'glob';

const baseExternal = ['jsdom'];
const coreExternal = [...baseExternal, 'mermaid', '@replit/codemirror-vim', 'codemirror', /^codemirror\//];
const engineExternal = [...baseExternal, 'mermaid'];
const streamExternal = [...engineExternal, 'codemirror', /^codemirror\//];

export const cherryBuildTargets = [
  {
    id: 'full-esm',
    entry: 'src/index.js',
    file: 'cherry-markdown.esm.js',
    format: 'es',
    name: 'Cherry',
    external: baseExternal,
  },
  {
    id: 'full-umd',
    entry: 'src/index.browser.js',
    file: 'cherry-markdown.js',
    format: 'umd',
    name: 'Cherry',
    global: 'Cherry',
    external: baseExternal,
  },
  {
    id: 'core-esm',
    entry: 'src/index.core.js',
    file: 'cherry-markdown.core.esm.js',
    format: 'es',
    name: 'Cherry',
    external: coreExternal,
  },
  {
    id: 'core-umd',
    entry: 'src/index.core.browser.js',
    file: 'cherry-markdown.core.js',
    format: 'umd',
    name: 'Cherry',
    global: 'Cherry',
    external: coreExternal,
  },
  {
    id: 'engine-esm',
    entry: 'src/index.engine.js',
    file: 'cherry-markdown.engine.esm.js',
    format: 'es',
    name: 'CherryEngine',
    external: engineExternal,
  },
  {
    id: 'engine-umd',
    entry: 'src/index.engine.browser.js',
    file: 'cherry-markdown.engine.js',
    format: 'umd',
    name: 'CherryEngine',
    global: 'CherryEngine',
    external: engineExternal,
  },
  {
    id: 'stream-esm',
    entry: 'src/index.stream.js',
    file: 'cherry-markdown.stream.esm.js',
    format: 'es',
    name: 'Cherry',
    external: streamExternal,
  },
  {
    id: 'stream-umd',
    entry: 'src/index.stream.browser.js',
    file: 'cherry-markdown.stream.js',
    format: 'umd',
    name: 'Cherry',
    global: 'Cherry',
    external: streamExternal,
  },
];

export const styleBuildTargets = [
  { input: 'src/sass/index.scss', name: 'cherry-markdown' },
  { input: 'src/sass/markdown_pure.scss', name: 'cherry-markdown.markdown' },
];

export const fontArtifacts = [
  'dist/fonts/ch-icon.eot',
  'dist/fonts/ch-icon.svg',
  'dist/fonts/ch-icon.ttf',
  'dist/fonts/ch-icon.woff',
  'dist/fonts/ch-icon.woff2',
];

export const typeEntryArtifacts = [
  'dist/types/index.d.ts',
  'dist/types/index.core.d.ts',
  'dist/types/index.engine.d.ts',
  'dist/types/index.engine.core.d.ts',
  'dist/types/index.stream.d.ts',
  'dist/types/Cherry.d.ts',
  'dist/types/CherryStatic.d.ts',
  'dist/types/CherryStream.d.ts',
];

export const forbiddenArtifactPatterns = [
  /(?:^|\/)cherry-markdown\.min\.js$/,
  /(?:^|\/)cherry-previewer(?:\.min)?\.css$/,
  /\.iife\.js$/,
  /\.umd\.js$/,
];

const normalizePath = (filePath) => filePath.replaceAll('\\', '/');

const listFiles = (directory, base = directory) => {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) return listFiles(absolute, base);
    return [normalizePath(absolute.slice(base.length + 1))];
  });
};

export const compareExactFiles = (actual, expected, label) => {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const errors = [];
  for (const file of expectedSet) {
    if (!actualSet.has(file)) errors.push(`${label}: missing ${file}`);
  }
  for (const file of actualSet) {
    if (!expectedSet.has(file)) errors.push(`${label}: unexpected ${file}`);
  }
  return errors;
};

export const validateBundleSource = (target, source, version) => {
  const errors = [];
  if (source.includes('process.env.BUILD_VERSION')) {
    errors.push(`${target.file}: contains process.env.BUILD_VERSION`);
  }
  if (!source.includes(version)) {
    errors.push(`${target.file}: does not contain package version ${version}`);
  }
  if (target.format === 'es') {
    if (!/\bexport\s*(?:\{|default|\*)/.test(source)) errors.push(`${target.file}: is not an ESM bundle`);
    if (/window\.Cherry(?:Engine)?\s*=/.test(source)) errors.push(`${target.file}: assigns a browser global`);
  } else {
    if (!source.includes('typeof exports') || !source.includes('typeof define')) {
      errors.push(`${target.file}: is not a UMD bundle`);
    }
    if (!new RegExp(`window\\.${target.global}\\s*=`).test(source)) {
      errors.push(`${target.file}: does not expose window.${target.global}`);
    }
  }
  return errors;
};

export const validatePackageMetadata = (packageJson) => {
  const errors = [];
  const expected = {
    main: './dist/cherry-markdown.js',
    module: './dist/cherry-markdown.esm.js',
    style: './dist/cherry-markdown.min.css',
    types: './dist/types/index.d.ts',
  };
  for (const [field, value] of Object.entries(expected)) {
    if (packageJson[field] !== value) errors.push(`package.json: ${field} must be ${value}`);
  }
  const expectedExports = ['.', './dist/*', './package.json', './types/*', './umd'];
  errors.push(...compareExactFiles(Object.keys(packageJson.exports || {}).sort(), expectedExports, 'package.json exports'));
  if (packageJson.exports?.['.']?.import !== './dist/cherry-markdown.esm.js') {
    errors.push('package.json: root import must use the ESM artifact');
  }
  if (packageJson.exports?.['.']?.types !== './dist/types/index.d.ts') {
    errors.push('package.json: root types must use dist/types/index.d.ts');
  }
  if (packageJson.exports?.['./umd'] !== './dist/cherry-markdown.js') {
    errors.push('package.json: ./umd must preserve dist/cherry-markdown.js');
  }
  for (const forbidden of ['./core', './stream', './iife']) {
    if (packageJson.exports?.[forbidden]) errors.push(`package.json: forbidden export ${forbidden}`);
  }
  if (!packageJson.files?.includes('dist') || !packageJson.files?.includes('types')) {
    errors.push('package.json: files must include dist and types');
  }
  return errors;
};

const requireNonEmptyFiles = (root, files, errors) => {
  for (const file of files) {
    const absolute = resolve(root, file);
    if (!existsSync(absolute)) {
      errors.push(`missing artifact ${file}`);
    } else if (statSync(absolute).size === 0) {
      errors.push(`empty artifact ${file}`);
    }
  }
};

export const getAddonContracts = (root) =>
  glob.sync('src/addons/**/*-plugin.js', { cwd: root }).map((entry) => {
    const relative = entry.replace(/^src\/addons\//, '');
    const stem = relative.slice(0, -extname(relative).length);
    const fileName = basename(stem);
    const global = fileName
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    return {
      esm: `dist/addons/${stem}.esm.js`,
      umd: `dist/addons/${stem}.js`,
      type: `dist/types/addons/${stem}.d.ts`,
      global,
    };
  });

export const collectArtifactContractErrors = (root) => {
  const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
  const errors = validatePackageMetadata(packageJson);
  const rootJs = cherryBuildTargets.map(({ file }) => file).sort();
  const rootCss = styleBuildTargets.flatMap(({ name }) => [`${name}.css`, `${name}.min.css`]).sort();

  errors.push(
    ...compareExactFiles(
      listFiles(resolve(root, 'dist')).filter((file) => !file.includes('/') && file.endsWith('.js')),
      rootJs,
      'root JavaScript artifacts',
    ),
    ...compareExactFiles(
      listFiles(resolve(root, 'dist')).filter((file) => !file.includes('/') && file.endsWith('.css')),
      rootCss,
      'root CSS artifacts',
    ),
  );

  requireNonEmptyFiles(
    root,
    [
      ...cherryBuildTargets.map(({ file }) => `dist/${file}`),
      ...rootCss.map((file) => `dist/${file}`),
      ...fontArtifacts,
      ...typeEntryArtifacts,
      'types/global.d.ts',
      'types/modules.d.ts',
    ],
    errors,
  );

  const modulesDeclaration = resolve(root, 'types/modules.d.ts');
  if (existsSync(modulesDeclaration)) {
    const source = readFileSync(modulesDeclaration, 'utf-8');
    for (const file of rootCss) {
      if (!source.includes(`declare module 'cherry-markdown/dist/${file}'`)) {
        errors.push(`types/modules.d.ts: missing declaration for dist/${file}`);
      }
    }
    for (const addon of ['cherry-code-block-mermaid-plugin', 'cherry-code-block-plantuml-plugin']) {
      if (!source.includes(`declare module 'cherry-markdown/dist/addons/${addon}'`)) {
        errors.push(`types/modules.d.ts: missing declaration for dist/addons/${addon}`);
      }
    }
  }

  const globalDeclaration = resolve(root, 'types/global.d.ts');
  if (existsSync(globalDeclaration)) {
    const source = readFileSync(globalDeclaration, 'utf-8');
    for (const match of source.matchAll(/from ['"](\.[^'"]+)['"]/g)) {
      const declaration = resolve(root, 'types', `${match[1]}.d.ts`);
      if (!existsSync(declaration)) errors.push(`types/global.d.ts: unresolved ${match[1]}`);
    }
  }

  const fullStylesheet = resolve(root, 'dist/cherry-markdown.css');
  if (existsSync(fullStylesheet)) {
    const source = readFileSync(fullStylesheet, 'utf-8');
    for (const font of fontArtifacts) {
      const fontName = basename(font);
      if (!source.includes(`./fonts/${fontName}`)) errors.push(`dist/cherry-markdown.css: missing ${fontName}`);
    }
  }

  for (const target of cherryBuildTargets) {
    const artifact = resolve(root, 'dist', target.file);
    if (existsSync(artifact)) {
      errors.push(...validateBundleSource(target, readFileSync(artifact, 'utf-8'), packageJson.version));
    }
  }

  const addons = getAddonContracts(root);
  const addonJs = addons.flatMap(({ esm, umd }) => [esm.replace(/^dist\/addons\//, ''), umd.replace(/^dist\/addons\//, '')]);
  const addonTypes = addons.map(({ type }) => type.replace(/^dist\/types\/addons\//, ''));
  errors.push(
    ...compareExactFiles(listFiles(resolve(root, 'dist/addons')).filter((file) => file.endsWith('.js')), addonJs, 'addon JavaScript artifacts'),
    ...compareExactFiles(listFiles(resolve(root, 'dist/types/addons')).filter((file) => file.endsWith('.d.ts')), addonTypes, 'addon type artifacts'),
  );
  requireNonEmptyFiles(root, addons.flatMap(({ esm, umd, type }) => [esm, umd, type]), errors);

  for (const { esm, umd, global } of addons) {
    if (existsSync(resolve(root, esm))) {
      const source = readFileSync(resolve(root, esm), 'utf-8');
      if (!/\bexport\s*(?:\{|default|\*)/.test(source)) errors.push(`${esm}: is not an ESM bundle`);
    }
    if (existsSync(resolve(root, umd))) {
      const source = readFileSync(resolve(root, umd), 'utf-8');
      if (!source.includes('typeof exports') || !source.includes('typeof define') || !source.includes(global)) {
        errors.push(`${umd}: does not preserve the UMD global ${global}`);
      }
    }
  }

  const allDistFiles = listFiles(resolve(root, 'dist')).map((file) => `dist/${file}`);
  for (const file of allDistFiles) {
    if (forbiddenArtifactPatterns.some((pattern) => pattern.test(file))) {
      errors.push(`forbidden artifact ${file}`);
    }
  }
  return errors;
};

export const assertArtifactContract = (root) => {
  const errors = collectArtifactContractErrors(root);
  if (errors.length > 0) {
    throw new Error(`Cherry Markdown artifact contract failed:\n- ${errors.join('\n- ')}`);
  }
};
