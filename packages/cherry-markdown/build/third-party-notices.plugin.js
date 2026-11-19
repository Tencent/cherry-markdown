import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const licenseInventory = 'cherry-bundled-dependency-licenses.json';
export const bundledLicenses = { fileName: licenseInventory };

function readVendoredYaml(modules) {
  // Mermaid ships js-yaml inside a compiled chunk that Vite attributes to Mermaid.
  for (const id of modules) {
    if (!/\/mermaid\/dist\/chunks\/mermaid\.core\/chunk-[^/]+\.mjs$/.test(id)) continue;
    const version = readFileSync(id, 'utf8').match(/\/\.pnpm\/js-yaml@(\d+\.\d+\.\d+)\//)?.[1];
    if (version) {
      return {
        name: 'js-yaml',
        version,
        identifier: 'MIT',
        source: `https://github.com/nodeca/js-yaml/tree/${version}`,
      };
    }
  }
}

function packageRepositories(modules) {
  const roots = new Set();
  for (const id of modules) {
    const root = id.match(/^(.+\/node_modules\/(?:@[^/]+\/)?[^/]+)\//)?.[1];
    if (root) roots.add(root);
  }
  const repositories = new Map();
  for (const root of roots) {
    const { name, version, repository } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const raw = typeof repository === 'string' ? repository : repository?.url;
    const url = raw
      ?.replace(/^git\+/, '')
      .replace(/^git:\/\//, 'https://')
      .replace(/\.git$/, '');
    if (/^https?:\/\/[^\s*]+$/.test(url)) repositories.set(`${name}@${version}`, url);
  }
  return repositories;
}

function dependencyLinks(entry, repositories) {
  const key = `${entry.name}@${entry.version}`;
  const source =
    entry.source ||
    repositories.get(key) ||
    `https://www.npmjs.com/package/${entry.name}/v/${entry.version}?activeTab=code`;
  // Some older npm packages omit the SPDX field but ship the MIT text.
  const identifier =
    entry.identifier || (/Permission is hereby granted, free of charge/i.test(entry.text) ? 'MIT' : '');
  if (!identifier) throw new Error(`Missing bundled license identifier for ${key}`);
  const ids = identifier.match(/[\w.+-]+/g).filter((id) => !['AND', 'OR', 'WITH'].includes(id));
  return `${key} (${identifier}) | Source: ${source} | License: ${ids.map((id) => `https://spdx.org/licenses/${id}.html`).join(' ')}`;
}

function elkjsNotice(version) {
  if (version !== '0.12.1') throw new Error(`Verify the Eclipse ELK source release for elkjs@${version}`);
  return [
    `elkjs ${version}`,
    'Copyright (c) 2017 Kiel University and others.',
    'Copyright (c) 2021 Kiel University and others.',
    'SPDX-License-Identifier: EPL-2.0 OR GPL-3.0-or-later',
    'Eclipse Public License 2.0: https://www.eclipse.org/legal/epl-2.0/',
    'Corresponding source is available under the EPL:',
    `  elkjs: https://github.com/kieler/elkjs/releases/tag/${version}`,
    '  Eclipse Layout Kernel: https://github.com/eclipse-elk/elk/releases/tag/v0.12.1',
  ];
}

export function thirdPartyNoticesPlugin() {
  return {
    name: 'cherry-third-party-notices',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const inventory = bundle[licenseInventory];
        if (inventory?.type !== 'asset') throw new Error('Missing Vite bundled license inventory');
        const entries = JSON.parse(String(inventory.source));
        // Use the bundler's inventory internally and publish only JS comments.
        delete bundle[licenseInventory];
        if (!entries.length) return;

        const chunks = Object.values(bundle).filter((output) => output.type === 'chunk');
        const modules = [...new Set(chunks.flatMap((output) => output.moduleIds))];
        const repositories = packageRepositories(modules);
        const yaml = readVendoredYaml(modules);
        if (yaml && !entries.some(({ name, version }) => name === yaml.name && version === yaml.version)) {
          entries.push(yaml);
        }

        const elkjs = entries.find(({ name }) => name === 'elkjs');
        const lines = [
          'Bundled third-party dependencies',
          ...entries.map((entry) => dependencyLinks(entry, repositories)),
          ...(elkjs ? ['', ...elkjsNotice(elkjs.version)] : []),
        ];
        const notice = `/*!\n${lines.map((line) => ` * ${line}\n`).join('')} */`;
        for (const chunk of chunks) {
          // Preserve existing generated positions and keep the source map directive last.
          const code = chunk.code.trimEnd();
          const mapIndex = code.search(/\n\/\/# sourceMappingURL=[^\r\n]*$/);
          const insertAt = mapIndex < 0 ? code.length : mapIndex;
          chunk.code = `${code.slice(0, insertAt)}\n${notice}${code.slice(insertAt)}${chunk.code.slice(code.length)}`;
        }
      },
    },
  };
}
