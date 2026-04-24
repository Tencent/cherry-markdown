/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/config/browserslistTargetHandler.js
 *
 * MIT Licensed
 * Author Sergey Melyukov @smelukov
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { ApiTargetProperties, EcmaTargetProperties, PlatformTargetProperties } from "./target";
/**
 * @param browsers supported browsers list
 * @returns target properties
 */
export declare const resolve: (browsers: string[]) => EcmaTargetProperties & PlatformTargetProperties & ApiTargetProperties;
