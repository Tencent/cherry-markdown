import { resolve } from 'node:path';
import { workspaceRoot, verifyArtifactManifest } from './consumer-artifacts.mjs';

verifyArtifactManifest(resolve(workspaceRoot, 'packages/milkdown/preview'), 'demo');
