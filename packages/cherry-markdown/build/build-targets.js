import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

// Only the invoked entrypoint consumes CLI arguments; imports keep the default build.
export function buildArguments(moduleUrl) {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(moduleUrl) ? process.argv.slice(2) : [];
}

/**
 * Validate the complete selection before writing any output. Filtering preserves
 * the release build order and keeps the default output matrix unchanged.
 * @template {{ id: string, format: string }} T
 * @param {T[]} builds
 * @param {string[]} args
 * @returns {T[]}
 */
export function selectBuilds(builds, args) {
  const { values } = parseArgs({
    args,
    options: { targets: { type: 'string' }, formats: { type: 'string' } },
    strict: true,
    allowPositionals: false,
  });
  const selection = {};
  for (const [option, property] of [
    ['targets', 'id'],
    ['formats', 'format'],
  ]) {
    if (values[option] === undefined) continue;
    const available = new Set(builds.map((build) => build[property]));
    const requested = values[option].split(',');
    const invalid = requested.filter((value) => !available.has(value));
    if (invalid.length) {
      throw new Error(
        `Invalid --${option}: ${invalid.map((value) => JSON.stringify(value)).join(', ')}. Available: ${[...available].join(', ')}`,
      );
    }
    selection[property] = new Set(requested);
  }
  const selected = builds.filter((build) =>
    Object.entries(selection).every(([property, requested]) => requested.has(build[property])),
  );
  if (!selected.length) throw new Error('No build matches the requested targets and formats.');
  return selected;
}
