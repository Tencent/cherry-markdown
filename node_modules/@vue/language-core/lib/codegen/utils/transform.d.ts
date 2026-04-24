import type { Code } from '../../types';
export interface CodeTransform {
    range: [start: number, end: number];
    generate(): Iterable<Code>;
}
export declare function replace(start: number, end: number, replacement: () => Iterable<Code>): CodeTransform;
export declare function insert(position: number, insertion: () => Iterable<Code>): CodeTransform;
export declare function generateCodeWithTransforms(start: number, end: number, transforms: CodeTransform[], section: (start: number, end: number) => Iterable<Code>): Generator<Code>;
