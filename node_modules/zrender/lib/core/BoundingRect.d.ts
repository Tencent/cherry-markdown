import * as matrix from './matrix';
import Point, { PointLike } from './Point';
import { NullUndefined } from './types';
declare class BoundingRect {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x: number, y: number, width: number, height: number);
    static set<TTarget extends RectLike>(target: TTarget, x: number, y: number, width: number, height: number): TTarget;
    union(other: BoundingRect): void;
    applyTransform(m: matrix.MatrixArray): void;
    calculateTransform(b: RectLike): matrix.MatrixArray;
    intersect(b: RectLike, mtv?: PointLike, opt?: BoundingRectIntersectOpt): boolean;
    static intersect(a: RectLike, b: RectLike, mtv?: PointLike, opt?: BoundingRectIntersectOpt): boolean;
    static contain(rect: RectLike, x: number, y: number): boolean;
    contain(x: number, y: number): boolean;
    clone(): BoundingRect;
    copy(other: RectLike): void;
    plain(): RectLike;
    isFinite(): boolean;
    isZero(): boolean;
    static create(rect: RectLike): BoundingRect;
    static copy<TTarget extends RectLike>(target: TTarget, source: RectLike): TTarget;
    static applyTransform(target: RectLike, source: RectLike, m: matrix.MatrixArray): void;
}
export declare type RectLike = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export interface BoundingRectIntersectOpt {
    direction?: number;
    bidirectional?: boolean;
    touchThreshold?: number;
    outIntersectRect?: RectLike;
    clamp?: boolean;
}
export declare function createIntersectContext(): {
    minTv: Point;
    maxTv: Point;
    useDir: boolean;
    dirMinTv: Point;
    touchThreshold: number;
    bidirectional: boolean;
    negativeSize: boolean;
    reset(opt: BoundingRectIntersectOpt | NullUndefined, useMTV: boolean): void;
    calcDirMTV(): void;
};
export default BoundingRect;
