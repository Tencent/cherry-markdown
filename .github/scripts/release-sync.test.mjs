import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { checkReleaseResults, createSyncPullRequest } from './release-sync.mjs';

const sha = 'a'.repeat(40);
const syncPr = { number: 1, html_url: 'https://github.com/o/r/pull/1', head: { sha } };

function needs(packages = [], overrides = {}) {
  return {
    release: { result: 'success', outputs: { publishedPackages: JSON.stringify(packages), publishedMilkdownVersion: '0.0.1' } },
    'build-core-release': { result: 'skipped' },
    'build-miniProgram-release': { result: 'skipped' },
    'build-milkdown-release': { result: 'skipped' },
    'build-client-release': { result: 'skipped' },
    'build-vscodePlugin-release': { result: 'skipped' },
    ...overrides,
  };
}

test('no release does not create a sync PR', () => {
  assert.equal(checkReleaseResults(needs()).shouldSync, false);
});

test('only selected successful release jobs permit sync', () => {
  const packages = [{ name: 'cherry-markdown', version: '0.11.12' }];
  assert.equal(checkReleaseResults(needs(packages, { 'build-core-release': { result: 'success' } })).shouldSync, true);
  for (const result of ['failure', 'cancelled', 'skipped']) {
    assert.throws(() => checkReleaseResults(needs(packages, { 'build-core-release': { result } })), /did not succeed/);
  }
  assert.throws(() => checkReleaseResults(needs(packages, { release: { result: 'failure' } })), /did not succeed/);
  assert.throws(() => checkReleaseResults(needs([{ name: 'unknown', version: '1.0.0' }])), /Unexpected release package/);
});

test('manual Milkdown first release requires npm verification', () => {
  const packages = [{ name: '@cherry-markdown/milkdown', version: '0.0.1' }];
  const state = needs(packages, { 'build-milkdown-release': { result: 'success' } });
  assert.equal(checkReleaseResults(state).verifyMilkdown, true);
  state.release.outputs.publishedMilkdownVersion = '0.0.2';
  assert.throws(() => checkReleaseResults(state), /does not match/);
});

test('all selected packages must succeed and malformed plans are rejected', () => {
  const packages = [{ name: 'cherry-markdown', version: '0.11.12' }, { name: '@cherry-markdown/miniprogram', version: '0.0.3' }];
  const state = needs(packages, { 'build-core-release': { result: 'success' }, 'build-miniProgram-release': { result: 'success' } });
  assert.equal(checkReleaseResults(state).shouldSync, true);
  state['build-miniProgram-release'].result = 'failure';
  assert.throws(() => checkReleaseResults(state), /miniprogram.*did not succeed/);
  state.release.outputs.publishedPackages = '{}';
  assert.throws(() => checkReleaseResults(state), /not an array/);
  state.release.outputs.publishedPackages = JSON.stringify([packages[0], packages[0]]);
  assert.throws(() => checkReleaseResults(state), /Unexpected release package/);
});

test('sync PR is reused, created, or skipped without moving branches', async () => {
  const calls = [];
  let ahead = 1;
  let existing = [];
  const github = { rest: {
    repos: { compareCommitsWithBasehead: async (args) => { calls.push(['compare', args]); return { data: { ahead_by: ahead } }; } },
    git: {
      getRef: async () => { throw Object.assign(new Error('not found'), { status: 404 }); },
      createRef: async (args) => { calls.push(['createRef', args]); return { data: { object: { sha } } }; },
    },
    pulls: {
      list: async (args) => { calls.push(['list', args]); return { data: existing }; },
      create: async (args) => { calls.push(['create', args]); return { data: { html_url: 'https://github.com/o/r/pull/1' } }; },
    },
  } };
  const context = { repo: { owner: 'o', repo: 'r' }, serverUrl: 'https://github.com', runId: 7, sha };
  assert.match(await createSyncPullRequest(github, context), /Created sync PR/);
  assert.equal(calls.find(([name]) => name === 'create')[1].head, `release-sync/${sha}`);
  assert.equal(calls.find(([name]) => name === 'createRef')[1].sha, sha);
  existing = [syncPr];
  assert.match(await createSyncPullRequest(github, context), /Existing sync PR/);
  assert.equal(calls.filter(([name]) => name === 'create').length, 1);
  ahead = 0;
  assert.match(await createSyncPullRequest(github, context), /already contains the release commit/);
});

test('a concurrent creator is reused, while unrelated API failures surface', async () => {
  let listCount = 0;
  let status = 422;
  const github = { rest: {
    repos: { compareCommitsWithBasehead: async () => ({ data: { ahead_by: 1 } }) },
    git: { getRef: async () => ({ data: { object: { sha } } }) },
    pulls: {
      list: async () => ({ data: ++listCount === 1 ? [] : [syncPr] }),
      create: async () => { throw Object.assign(new Error('API error'), { status }); },
    },
  } };
  const context = { repo: { owner: 'o', repo: 'r' }, serverUrl: 'https://github.com', runId: 7, sha };
  assert.match(await createSyncPullRequest(github, context), /Existing sync PR/);
  listCount = 0;
  status = 403;
  await assert.rejects(createSyncPullRequest(github, context), /API error/);
});

test('a moved sync branch or PR cannot replace the verified release commit', async () => {
  let existing = [];
  const github = { rest: {
    repos: { compareCommitsWithBasehead: async () => ({ data: { ahead_by: 1 } }) },
    git: { getRef: async () => ({ data: { object: { sha: 'b'.repeat(40) } } }) },
    pulls: { list: async () => ({ data: existing }) },
  } };
  const context = { repo: { owner: 'o', repo: 'r' }, serverUrl: 'https://github.com', runId: 7, sha };
  await assert.rejects(createSyncPullRequest(github, context), /does not point to the release commit/);
  existing = [{ ...syncPr, head: { sha: 'b'.repeat(40) } }];
  await assert.rejects(createSyncPullRequest(github, context), /does not point to the release commit/);
});

test('divergent dev and advancing main preserve both branches and pin the release commit', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'release-sync-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    git('init', '-b', 'main');
    git('config', 'user.email', 'test@example.invalid');
    git('config', 'user.name', 'Test');
    writeFileSync(join(dir, 'base'), 'base');
    git('add', 'base');
    git('commit', '-m', 'base');
    git('branch', 'dev');
    writeFileSync(join(dir, 'release'), 'release');
    git('add', 'release');
    git('commit', '-m', 'release');
    const releaseSha = git('rev-parse', 'HEAD');
    writeFileSync(join(dir, 'later'), 'later');
    git('add', 'later');
    git('commit', '-m', 'later main');
    const mainSha = git('rev-parse', 'main');
    git('switch', 'dev');
    writeFileSync(join(dir, 'dev'), 'dev');
    git('add', 'dev');
    git('commit', '-m', 'new dev');
    const devSha = git('rev-parse', 'dev');

    const github = { rest: {
      repos: { compareCommitsWithBasehead: async () => ({ data: { ahead_by: Number(git('rev-list', '--count', `dev..${releaseSha}`)) } }) },
      git: {
        getRef: async () => { throw Object.assign(new Error('not found'), { status: 404 }); },
        createRef: async ({ ref, sha: target }) => { git('branch', ref.replace('refs/heads/', ''), target); return { data: { object: { sha: target } } }; },
      },
      pulls: { list: async () => ({ data: [] }), create: async () => ({ data: { html_url: 'https://github.com/o/r/pull/1' } }) },
    } };
    await createSyncPullRequest(github, { repo: { owner: 'o', repo: 'r' }, serverUrl: 'https://github.com', runId: 7, sha: releaseSha });
    assert.equal(git('rev-parse', 'dev'), devSha);
    assert.equal(git('rev-parse', 'main'), mainSha);
    assert.equal(git('rev-parse', `release-sync/${releaseSha}`), releaseSha);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
