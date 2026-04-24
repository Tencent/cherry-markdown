import type { Code, Sfc } from '../../types';
export declare function generateClassProperty(source: string, classNameWithDot: string, offset: number, propertyType: string): Generator<Code>;
export declare function generateStyleImports(style: Sfc['styles'][number]): Generator<Code>;
