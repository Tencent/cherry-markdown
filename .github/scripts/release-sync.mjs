const releaseJobs = {
  'cherry-markdown': 'build-core-release',
  '@cherry-markdown/miniprogram': 'build-miniProgram-release',
  '@cherry-markdown/milkdown': 'build-milkdown-release',
  '@cherry-markdown/client': 'build-client-release',
  'cherry-markdown-vscode-plugin': 'build-vscodePlugin-release',
};

export function checkReleaseResults(needs) {
  const release = needs.release;
  if (release?.result !== 'success') throw new Error('Release versioning or tagging did not succeed.');

  const packages = JSON.parse(release.outputs.publishedPackages || '[]');
  if (!Array.isArray(packages)) throw new Error('Published packages output is not an array.');
  if (packages.length === 0) return { shouldSync: false, verifyMilkdown: false, summary: 'No packages to release; no sync PR created.\n' };

  const seen = new Set();
  for (const pkg of packages) {
    const job = releaseJobs[pkg.name];
    if (!job || !pkg.version || seen.has(pkg.name)) throw new Error(`Unexpected release package: ${pkg.name}`);
    seen.add(pkg.name);
    if (needs[job]?.result !== 'success') throw new Error(`${pkg.name} release job did not succeed (${needs[job]?.result ?? 'missing'}).`);
  }

  const milkdown = packages.find((pkg) => pkg.name === '@cherry-markdown/milkdown');
  if (milkdown && release.outputs.publishedMilkdownVersion !== milkdown.version) {
    throw new Error('Milkdown version output does not match the release plan.');
  }
  return {
    shouldSync: true,
    verifyMilkdown: milkdown?.version === '0.0.1',
    summary: `Release jobs succeeded: ${packages.map(({ name, version }) => `\`${name}@${version}\``).join(', ')}.\n`,
  };
}

export async function createSyncPullRequest(github, context) {
  const { owner, repo } = context.repo;
  const sha = context.sha;
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid release commit SHA.');
  const branch = `release-sync/${sha}`;
  const comparison = await github.rest.repos.compareCommitsWithBasehead({ owner, repo, basehead: `dev...${sha}` });
  if (!Number.isInteger(comparison.data.ahead_by) || comparison.data.ahead_by < 0) throw new Error('Invalid branch comparison result.');
  if (comparison.data.ahead_by === 0) return 'dev already contains the release commit; no sync PR needed.\n';

  const listExisting = () => github.rest.pulls.list({ owner, repo, state: 'open', base: 'dev', head: `${owner}:${branch}`, per_page: 100 });
  const existingMessage = (pr) => {
    if (pr.head.sha !== sha) throw new Error(`Sync PR #${pr.number} does not point to the release commit.`);
    return `Existing sync PR: ${pr.html_url}\n`;
  };
  const existing = await listExisting();
  if (existing.data.length) return existingMessage(existing.data[0]);

  const readBranch = () => github.rest.git.getRef({ owner, repo, ref: `heads/${branch}` });
  let ref;
  try {
    ref = await readBranch();
  } catch (error) {
    if (error.status !== 404) throw error;
    try {
      ref = await github.rest.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha });
    } catch (createError) {
      if (createError.status !== 422) throw createError;
      ref = await readBranch();
    }
  }
  if (ref.data.object.sha !== sha) throw new Error(`Sync branch ${branch} does not point to the release commit.`);

  const runUrl = `${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId}`;
  try {
    const pr = await github.rest.pulls.create({
      owner,
      repo,
      base: 'dev',
      head: branch,
      title: 'chore: 同步发布版本到 dev',
      body: `将 main 的发布提交 \`${sha}\` 同步到 dev。请检查差异和冲突后再合并。\n\n发布流程：${runUrl}`,
    });
    return `Created sync PR: ${pr.data.html_url}\n`;
  } catch (error) {
    if (error.status !== 422) throw error;
    const concurrent = await listExisting();
    if (!concurrent.data.length) throw error;
    return existingMessage(concurrent.data[0]);
  }
}
