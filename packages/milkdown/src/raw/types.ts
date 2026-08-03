export type CherryRawKind = 'block' | 'inline';

export interface CherryRawPattern {
  name: string;
  kind: CherryRawKind;
  pattern: RegExp;
}

export interface CherryRawRange {
  from: number;
  to: number;
  kind: CherryRawKind;
  syntax: string;
  source: string;
}

export interface CherryRawEditRequest {
  kind: CherryRawKind;
  syntax: string;
  source: string;
  save: (source: string) => void;
}

export interface CherryRawConfig {
  patterns: CherryRawPattern[];
  editSource?: (request: CherryRawEditRequest) => void;
}
