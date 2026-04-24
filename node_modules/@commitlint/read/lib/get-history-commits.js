import gitRawCommits from 'git-raw-commits';
import { streamToPromise } from './stream-to-promise.js';
// Get commit messages from history
export async function getHistoryCommits(options, opts = {}) {
    return streamToPromise(gitRawCommits(options, { cwd: opts.cwd }));
}
//# sourceMappingURL=get-history-commits.js.map