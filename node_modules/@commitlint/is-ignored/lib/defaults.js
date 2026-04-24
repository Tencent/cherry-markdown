import semver from 'semver';
const isSemver = (c) => {
    const firstLine = c.split('\n').shift();
    if (typeof firstLine !== 'string') {
        return false;
    }
    const stripped = firstLine.replace(/^chore(\([^)]+\))?:/, '').trim();
    return semver.valid(stripped) !== null;
};
const test = (r) => r.test.bind(r);
export const wildcards = [
    test(/^((Merge pull request)|(Merge (.*?) into (.*?)|(Merge branch (.*?)))(?:\r?\n)*$)/m),
    test(/^(Merge tag (.*?))(?:\r?\n)*$/m),
    test(/^(R|r)evert (.*)/),
    test(/^(R|r)eapply (.*)/),
    test(/^(amend|fixup|squash)!/),
    isSemver,
    test(/^(Merged (.*?)(in|into) (.*)|Merged PR (.*): (.*))/),
    test(/^Merge remote-tracking branch(\s*)(.*)/),
    test(/^Automatic merge(.*)/),
    test(/^Auto-merged (.*?) into (.*)/),
];
//# sourceMappingURL=defaults.js.map