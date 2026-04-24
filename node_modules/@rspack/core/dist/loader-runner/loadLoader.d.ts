/**
 * The following code is from
 * https://github.com/webpack/loader-runner
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/loader-runner/blob/main/LICENSE
 */
import type { Compiler } from "../exports";
import type { LoaderObject } from ".";
export default function loadLoader(loader: LoaderObject, compiler: Compiler, callback: (err: unknown) => void): void;
