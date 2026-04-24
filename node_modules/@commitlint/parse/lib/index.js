import { sync } from 'conventional-commits-parser';
// @ts-expect-error -- no typings
import defaultChangelogOpts from 'conventional-changelog-angular';
export async function parse(message, parser = sync, parserOpts) {
    const preset = await defaultChangelogOpts();
    const defaultOpts = preset.parserOpts;
    const opts = {
        ...defaultOpts,
        fieldPattern: null,
        ...(parserOpts || {}),
    };
    const parsed = parser(message, opts);
    parsed.raw = message;
    return parsed;
}
export default parse;
//# sourceMappingURL=index.js.map