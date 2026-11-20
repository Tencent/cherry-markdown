import { mergeConfig } from 'vite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const dependencyBannerTitle = '! Bundled third-party dependencies';

/**
 * @param {{ moduleIds: string[] }} chunk
 */
export function bundledDependencyLinks({ moduleIds }) {
  const packages = new Set();
  const links = new Map();
  for (const id of moduleIds) {
    const root = id.match(/^(.+\/node_modules\/(?:@[^/]+\/)?[^/]+)\//)?.[1];
    if (!root || packages.has(root)) continue;
    packages.add(root);

    const { name, version, repository, license } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const key = `${name}@${version}`;
    const npmSource = `https://www.npmjs.com/package/${name}/v/${version}?activeTab=code`;
    const repositoryUrl = (typeof repository === 'string' ? repository : repository?.url)
      ?.replace(/^git\+/, '')
      .replace(/^git:\/\//, 'https://')
      .replace(/\.git$/, '');
    const source = /^https?:\/\/[^\s*]+$/.test(repositoryUrl ?? '') ? repositoryUrl : npmSource;
    const licenseIds = license?.match(/[\w.+-]+/g)?.filter((id) => !['AND', 'OR', 'WITH'].includes(id));
    const licenseFile = !licenseIds?.length && readdirSync(root).find((file) => /^licen[cs]e(?:\.|$)/i.test(file));
    const licenseUrls = licenseIds?.map((id) => `https://spdx.org/licenses/${id}.html`).join(' ');
    const licenseUrl = licenseFile ? `https://unpkg.com/${name}@${version}/${licenseFile}` : npmSource;
    links.set(key, `${key} | Source: ${source} | License: ${licenseUrls || licenseUrl}`);
  }
  return links;
}

/** @param {Iterable<string>} links */
export function formatDependencyBanner(links) {
  const lines = Array.from(links, (link) => ` * ${link}`);
  return lines.length ? `/*${dependencyBannerTitle}\n${lines.join('\n')}\n */` : '';
}

// Shared library output policy only. Entries, dependencies, runtime globals and
// format-specific compatibility remain with each package's build definition.
/**
 * @param {{ root: string, entry: string, file: string, format: 'es' | 'umd' | 'cjs', name?: string }} output
 * @param {import('vite').UserConfig} [overrides]
 * @returns {import('vite').UserConfig}
 */
export function createLibraryBuild({ root, entry, file, format, name }, overrides = {}) {
  return mergeConfig(
    {
      configFile: false,
      root,
      build: {
        emptyOutDir: false,
        target: 'es2015',
        minify: 'oxc',
        lib: { entry, formats: [format], fileName: () => file, name },
        rolldownOptions: {
          output: { codeSplitting: false },
        },
      },
    },
    overrides,
  );
}
