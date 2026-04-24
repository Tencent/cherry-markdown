export interface CompareAtom {
    operator: string;
    version: string;
    major: string;
    minor: string;
    patch: string;
    preRelease?: string[];
}
export declare function compare(rangeAtom: CompareAtom, versionAtom: CompareAtom): boolean;
