import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const licenseInventory = 'cherry-bundled-dependency-licenses.json';
export const bundledLicenses = { fileName: licenseInventory };

function readVendoredYaml(modules) {
  // Mermaid publishes js-yaml inside a compiled chunk. Vite's package
  // inventory sees mermaid here, so recover the version from the input chunk.
  for (const id of modules) {
    if (!/\/mermaid\/dist\/chunks\/mermaid\.core\/chunk-[^/]+\.mjs$/.test(id)) continue;
    const version = readFileSync(id, 'utf8').match(/\/\.pnpm\/js-yaml@(\d+\.\d+\.\d+)\//)?.[1];
    if (version) {
      return {
        name: 'js-yaml',
        version,
        identifier: 'MIT',
        text: readFileSync(new URL(`./licenses/js-yaml-${version}.txt`, import.meta.url), 'utf8').trim(),
        source: `https://github.com/nodeca/js-yaml/tree/${version}`,
      };
    }
  }
}

function packageDirectories(modules) {
  const directories = new Map();
  for (const id of modules) {
    const root = id.match(/^(.+\/node_modules\/(?:@[^/]+\/)?[^/]+)\//)?.[1];
    if (!root) continue;
    const meta = join(root, 'package.json');
    directories.set(meta, root);
  }
  return new Map(
    [...directories].map(([file, root]) => {
      const { name, version } = JSON.parse(readFileSync(file, 'utf8'));
      return [`${name}@${version}`, root];
    }),
  );
}

function renderNotice(entry, roots) {
  const { name, version, identifier, source } = entry;
  const root = roots.get(`${name}@${version}`);
  let { text } = entry;
  if (!text && name === 'browser-split') {
    // This npm package carries its MIT grant in the README.
    text = readFileSync(join(root, 'README.md'), 'utf8')
      .split(/^## License\s*$/m)[1]
      ?.trim();
  }
  if (!text) throw new Error(`Missing bundled license text for ${name}@${version}`);

  const notices = root
    ? readdirSync(root)
        .filter((file) => /^NOTICE(?:\.[^.]+)?$/i.test(file))
        .sort()
        .map((file) => readFileSync(join(root, file), 'utf8').trim())
    : [];
  const location = source || `https://www.npmjs.com/package/${name}/v/${version}`;
  return [`${name}@${version}${identifier ? ` (${identifier})` : ''}`, location, text, ...notices].join('\n\n');
}

function elkjsNotice(version) {
  // The ELK release is the source of the Java engine compiled into elkjs.
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
        delete bundle[licenseInventory];
        if (!entries.length) return;

        const chunks = Object.values(bundle).filter((output) => output.type === 'chunk');
        const modules = [...new Set(chunks.flatMap((output) => output.moduleIds))];
        const roots = packageDirectories(modules);
        const yaml = readVendoredYaml(modules);
        if (yaml && !entries.some(({ name, version }) => name === yaml.name && version === yaml.version)) {
          entries.push(yaml);
        }

        const elkjs = entries.find(({ name }) => name === 'elkjs');
        const elk = elkjs ? elkjsNotice(elkjs.version) : [];
        const sections = entries.map((entry) => renderNotice(entry, roots));
        const text = ['Third-party software bundled with Cherry Markdown', elk.join('\n'), ...sections]
          .filter(Boolean)
          .join('\n\n----\n\n');
        // Identical inventories can be shared by ESM and UMD. Targeted builds
        // cannot overwrite a notice referenced by another JS artifact.
        const digest = createHash('sha256').update(text).digest('hex').slice(0, 16);
        const fileName = `THIRD_PARTY_NOTICES.${digest}.txt`;
        this.emitFile({ type: 'asset', fileName, source: `${text}\n` });

        for (const chunk of chunks) {
          const notice = `/*!\n * Third-party licenses: ./${fileName}\n${elk.map((line) => ` * ${line}\n`).join('')} */`;
          // Preserve the existing generated positions and trailing source map directive.
          const code = chunk.code.trimEnd();
          const mapIndex = code.search(/\n\/\/# sourceMappingURL=[^\r\n]*$/);
          const insertAt = mapIndex < 0 ? code.length : mapIndex;
          chunk.code = `${code.slice(0, insertAt)}\n${notice}${code.slice(insertAt)}${chunk.code.slice(code.length)}`;
        }
      },
    },
  };
}
