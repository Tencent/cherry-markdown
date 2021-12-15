"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var mergeWith_1 = __importDefault(require("lodash/mergeWith"));
var DEFAULT_OPTIONS = {
    // TODO: themes
    theme: 'default',
    altFontFamily: 'sans-serif',
    fontFamily: 'sans-serif',
    themeCSS: '.label foreignObject { font-size: 90%; overflow: visible; } .label { font-family: sans-serif; }',
    flowchart: {
        useMaxWidth: false,
    },
    sequence: {
        useMaxWidth: false,
    },
    startOnLoad: false,
    logLevel: 5,
    // fontFamily: 'Arial, monospace'
};
var MermaidCodeEngine = /** @class */ (function () {
    function MermaidCodeEngine(mermaidOptions) {
        if (mermaidOptions === void 0) { mermaidOptions = {}; }
        this.mermaidAPIRefs = null;
        this.options = DEFAULT_OPTIONS;
        this.dom = null;
        this.mermaidCanvas = null;
        var mermaid = mermaidOptions.mermaid, mermaidAPI = mermaidOptions.mermaidAPI;
        if (!mermaidAPI &&
            !window.mermaidAPI &&
            (!mermaid || !mermaid.mermaidAPI) &&
            (!window.mermaid || !window.mermaid.mermaidAPI)) {
            throw new Error('code-block-mermaid-plugin[init]: Package mermaid or mermaidAPI not found.');
        }
        this.options = __assign(__assign({}, DEFAULT_OPTIONS), (mermaidOptions || {}));
        this.mermaidAPIRefs = mermaidAPI || window.mermaidAPI || mermaid.mermaidAPI || window.mermaid.mermaidAPI;
        delete this.options.mermaid;
        delete this.options.mermaidAPI;
        this.mermaidAPIRefs.initialize(this.options);
    }
    MermaidCodeEngine.install = function (cherryOptions) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        mergeWith_1.default(cherryOptions, {
            engine: {
                syntax: {
                    codeBlock: {
                        customRenderer: {
                            mermaid: new (MermaidCodeEngine.bind.apply(MermaidCodeEngine, __spreadArray([void 0], args)))(),
                        },
                    },
                },
            },
        });
    };
    MermaidCodeEngine.prototype.mountMermaidCanvas = function ($engine) {
        if (this.mermaidCanvas && document.body.contains(this.mermaidCanvas)) {
            return;
        }
        this.mermaidCanvas = document.createElement('div');
        this.mermaidCanvas.style = 'width:1024px;opacity:0;position:fixed;top:100%;';
        var container = $engine.$cherry.wrapperDom || document.body;
        container.appendChild(this.mermaidCanvas);
    };
    /**
     * 转换svg为img，如果出错则直出svg
     * @param {string} svgCode
     * @param {string} graphId
     * @returns {string}
     */
    MermaidCodeEngine.prototype.convertMermaidSvgToImg = function (svgCode, graphId) {
        var domParser = new DOMParser();
        var svgHtml;
        var injectSvgFallback = function (svg) {
            return svg.replace('<svg ', '<svg style="max-width:100%;height:auto;font-family:sans-serif;" ');
        };
        try {
            var svgDoc = /** @type {XMLDocument} */ (domParser.parseFromString(svgCode, 'image/svg+xml'));
            var svgDom = /** @type {SVGSVGElement} */ ( /** @type {any} */(svgDoc.documentElement));
            // tagName不是svg时，说明存在parse error
            if (svgDom.tagName.toLowerCase() === 'svg') {
                svgDom.style.maxWidth = '100%';
                svgDom.style.height = 'auto';
                svgDom.style.fontFamily = 'sans-serif';
                var shadowSvg = /** @type {SVGSVGElement} */ ( /** @type {any} */(document.getElementById(graphId)));
                var svgBox = shadowSvg.getBBox();
                if (!svgDom.hasAttribute('viewBox')) {
                    svgDom.setAttribute('viewBox', "0 0 " + svgBox.width + " " + svgBox.height);
                }
                else {
                    svgBox = svgDom.viewBox.baseVal;
                }
                svgDom.getAttribute('width') === '100%' && svgDom.setAttribute('width', "" + svgBox.width);
                svgDom.getAttribute('height') === '100%' && svgDom.setAttribute('height', "" + svgBox.height);
                // fix end
                svgHtml = svgDoc.documentElement.outerHTML;
                // 屏蔽转img标签功能，如需要转换为img解除屏蔽即可
                // const dataUrl = `data:image/svg+xml,${encodeURIComponent(svgDoc.documentElement.outerHTML)}`;
                // svgHtml = `<img class="svg-img" src="${dataUrl}" alt="${graphId}" />`;
            }
            else {
                svgHtml = injectSvgFallback(svgCode);
            }
        }
        catch (e) {
            svgHtml = injectSvgFallback(svgCode);
        }
        return svgHtml;
    };
    MermaidCodeEngine.prototype.render = function (src, sign, $engine) {
        var _this = this;
        var $sign = sign;
        if (!$sign) {
            $sign = Math.round(Math.random() * 100000000);
        }
        this.mountMermaidCanvas($engine);
        var html;
        // 多实例的情况下相同的内容ID相同会导致mermaid渲染异常
        // 需要通过添加时间戳使得多次渲染相同内容的图像ID唯一
        // 图像渲染节流在CodeBlock Hook内部控制
        var graphId = "mermaid-" + $sign + "-" + new Date().getTime();
        try {
            this.mermaidAPIRefs.render(graphId, src, function (svgCode) {
                var fixedSvg = svgCode
                    .replace(/\s*markerUnits="0"/g, '')
                    .replace(/\s*x="NaN"/g, '')
                    .replace(/<br>/g, '<br/>');
                html = _this.convertMermaidSvgToImg(fixedSvg, graphId);
            }, this.mermaidCanvas);
        }
        catch (e) {
            return false;
        }
        return html;
    };
    MermaidCodeEngine.TYPE = 'figure';
    return MermaidCodeEngine;
}());
exports.default = MermaidCodeEngine;
