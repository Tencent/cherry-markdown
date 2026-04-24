/**
MIT License

Copyright (c) 2021-present Devon Govett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
export declare function toFeatures(featureOptions: FeatureOptions): Features;
export declare enum Features {
    Empty = 0,
    Nesting = 1,
    NotSelectorList = 2,
    DirSelector = 4,
    LangSelectorList = 8,
    IsSelector = 16,
    TextDecorationThicknessPercent = 32,
    MediaIntervalSyntax = 64,
    MediaRangeSyntax = 128,
    CustomMediaQueries = 256,
    ClampFunction = 512,
    ColorFunction = 1024,
    OklabColors = 2048,
    LabColors = 4096,
    P3Colors = 8192,
    HexAlphaColors = 16384,
    SpaceSeparatedColorNotation = 32768,
    FontFamilySystemUi = 65536,
    DoublePositionGradients = 131072,
    VendorPrefixes = 262144,
    LogicalProperties = 524288,
    Selectors = 31,
    MediaQueries = 448,
    Color = 64512
}
export interface Targets {
    android?: number;
    chrome?: number;
    edge?: number;
    firefox?: number;
    ie?: number;
    ios_saf?: number;
    opera?: number;
    safari?: number;
    samsung?: number;
}
export interface Drafts {
    /** Whether to enable @custom-media rules. */
    customMedia?: boolean;
}
export interface NonStandard {
    /** Whether to enable the non-standard >>> and /deep/ selector combinators used by Angular and Vue. */
    deepSelectorCombinator?: boolean;
}
export interface PseudoClasses {
    hover?: string;
    active?: string;
    focus?: string;
    focusVisible?: string;
    focusWithin?: string;
}
export type FeatureOptions = {
    nesting?: boolean;
    notSelectorList?: boolean;
    dirSelector?: boolean;
    langSelectorList?: boolean;
    isSelector?: boolean;
    textDecorationThicknessPercent?: boolean;
    mediaIntervalSyntax?: boolean;
    mediaRangeSyntax?: boolean;
    customMediaQueries?: boolean;
    clampFunction?: boolean;
    colorFunction?: boolean;
    oklabColors?: boolean;
    labColors?: boolean;
    p3Colors?: boolean;
    hexAlphaColors?: boolean;
    spaceSeparatedColorNotation?: boolean;
    fontFamilySystemUi?: boolean;
    doublePositionGradients?: boolean;
    vendorPrefixes?: boolean;
    logicalProperties?: boolean;
    selectors?: boolean;
    mediaQueries?: boolean;
    color?: boolean;
};
export type LoaderOptions = {
    minify?: boolean;
    errorRecovery?: boolean;
    targets?: Targets | string[] | string;
    include?: FeatureOptions;
    exclude?: FeatureOptions;
    /**
     * @deprecated Use `drafts` instead.
     * This will be removed in the next major version.
     */
    draft?: Drafts;
    drafts?: Drafts;
    nonStandard?: NonStandard;
    pseudoClasses?: PseudoClasses;
    unusedSymbols?: string[];
};
