import type { TransformOutput } from "@rspack/binding";
import type { JsMinifyOptions, Options as TransformOptions } from "../compiled/@swc/types";
export type { TransformOutput, TransformOptions, JsMinifyOptions };
export declare function minify(source: string, options?: JsMinifyOptions): Promise<TransformOutput>;
export declare function minifySync(source: string, options?: JsMinifyOptions): TransformOutput;
export declare function transform(source: string, options?: TransformOptions): Promise<TransformOutput>;
export declare function transformSync(source: string, options?: TransformOptions): TransformOutput;
