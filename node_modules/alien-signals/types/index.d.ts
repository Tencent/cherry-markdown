import { type ReactiveNode } from './system.js';
export declare function getActiveSub(): ReactiveNode | undefined;
export declare function setActiveSub(sub?: ReactiveNode): ReactiveNode | undefined;
export declare function getBatchDepth(): number;
export declare function startBatch(): void;
export declare function endBatch(): void;
export declare function isSignal(fn: () => void): boolean;
export declare function isComputed(fn: () => void): boolean;
export declare function isEffect(fn: () => void): boolean;
export declare function isEffectScope(fn: () => void): boolean;
export declare function signal<T>(): {
    (): T | undefined;
    (value: T | undefined): void;
};
export declare function signal<T>(initialValue: T): {
    (): T;
    (value: T): void;
};
export declare function computed<T>(getter: (previousValue?: T) => T): () => T;
export declare function effect(fn: () => void): () => void;
export declare function effectScope(fn: () => void): () => void;
export declare function trigger(fn: () => void): void;
