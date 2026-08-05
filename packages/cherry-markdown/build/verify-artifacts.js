import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertArtifactContract, cherryBuildTargets, fontArtifacts, styleBuildTargets } from './artifact-contract.js';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

assertArtifactContract(root);

console.log(
  `[artifact contract] verified ${cherryBuildTargets.length} library bundles, ${styleBuildTargets.length * 2} stylesheets, addons, types, and ${fontArtifacts.length} fonts`,
);
