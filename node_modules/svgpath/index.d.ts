declare module "svgpath" {
  type MoveToAbs = ["M", number, number];
  type LineToAbs = ["L", number, number];
  type HorizontalLineToAbs = ["H", number];
  type VerticalLineToAbs = ["V", number];
  type CurveToAbs = ["C", number, number, number, number, number, number];
  type SmoothCurveToAbs = ["S", number, number, number, number];
  type QuadraticBézierCurveToAbs = ["Q", number, number, number, number];
  type SmoothQuadraticBézierCurveToAbs = ["T", number, number];
  type EllipticalArcAbs = ["A", number, number, number, number, number, number, number];

  type MoveToRel = ["m", number, number];
  type LineToRel = ["l", number, number];
  type HorizontalLineToRel = ["h", number];
  type VerticalLineToRel = ["v", number];
  type CurveToRel = ["c", number, number, number, number, number, number];
  type SmoothCurveToRel = ["s", number, number, number, number];
  type QuadraticBézierCurveToRel = ["q", number, number, number, number];
  type SmoothQuadraticBézierCurveToRel = ["t", number, number];
  type EllipticalArcRel = ["a", number, number, number, number, number, number, number];

  type ClosePath = ["Z" | "z"];

  type Segment = MoveToAbs | MoveToRel | LineToAbs | LineToRel | HorizontalLineToAbs | HorizontalLineToRel | VerticalLineToAbs | VerticalLineToRel | CurveToAbs | CurveToRel | SmoothCurveToAbs | SmoothCurveToRel | QuadraticBézierCurveToAbs | QuadraticBézierCurveToRel | SmoothQuadraticBézierCurveToAbs | SmoothQuadraticBézierCurveToRel | EllipticalArcAbs | EllipticalArcRel | ClosePath;

  interface SvgPath {
    (path: string): SvgPath;
    new (path: string): SvgPath;
    from(path: string | SvgPath): SvgPath;
    abs(): SvgPath;
    rel(): SvgPath;
    scale(sx: number, sy?: number): SvgPath;
    translate(x: number, y?: number): SvgPath;
    rotate(angle: number, rx?: number, ry?: number): SvgPath;
    skewX(degrees: number): SvgPath;
    skewY(degrees: number): SvgPath;
    matrix(m: number[]): SvgPath;
    transform(str: string): SvgPath;
    unshort(): SvgPath;
    unarc(): SvgPath;
    toString(): string;
    round(precision: number): SvgPath;
    iterate(iterator: (segment: Segment, index: number, x: number, y: number) => void, keepLazyStack?: boolean): SvgPath;
  }

  const svgPath: SvgPath;
  export = svgPath;
}
