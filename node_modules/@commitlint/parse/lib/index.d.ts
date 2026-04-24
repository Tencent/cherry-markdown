import type { Parser } from '@commitlint/types';
import { type Commit, type Options } from 'conventional-commits-parser';
export declare function parse(message: string, parser?: Parser, parserOpts?: Options): Promise<Commit>;
export default parse;
//# sourceMappingURL=index.d.ts.map