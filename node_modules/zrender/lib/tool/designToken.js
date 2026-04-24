import { extend, map } from '../core/util.js';
var DesignTokenManager = (function () {
    function DesignTokenManager() {
        this._designTokens = {};
        this._resolvedTokens = {};
    }
    DesignTokenManager.prototype.registerTokens = function (tokens) {
        this._designTokens = extend({}, tokens);
        this._resolveTokens();
    };
    DesignTokenManager.prototype.getTokenValue = function (token) {
        var _a;
        if (typeof token !== 'string' || !token.startsWith('@')) {
            return token;
        }
        var key = token.slice(1);
        return (_a = this._resolvedTokens[key]) !== null && _a !== void 0 ? _a : token;
    };
    DesignTokenManager.prototype.resolveColor = function (color) {
        var _this = this;
        if (!color) {
            return color;
        }
        if (typeof color === 'string') {
            return this.getTokenValue(color);
        }
        else if (color.colorStops) {
            var gradient = extend({}, color);
            gradient.colorStops = map(gradient.colorStops, function (stop) {
                var newStop = extend({}, stop);
                newStop.color = _this.getTokenValue(stop.color);
                return newStop;
            });
            return gradient;
        }
        return color;
    };
    DesignTokenManager.prototype.getPaintStyle = function (style) {
        if (!style) {
            return style;
        }
        var paintStyle = extend({}, style);
        if (style.fill != undefined) {
            paintStyle.fill = this.resolveColor(style.fill);
        }
        if (style.stroke != undefined) {
            paintStyle.stroke = this.resolveColor(style.stroke);
        }
        return paintStyle;
    };
    DesignTokenManager.prototype.resolveStyle = function (style) {
        var resolvedStyle = extend({}, style);
        if (style.fill) {
            resolvedStyle.fill = this.resolveColor(style.fill);
        }
        if (style.stroke) {
            resolvedStyle.stroke = this.resolveColor(style.stroke);
        }
        return resolvedStyle;
    };
    DesignTokenManager.prototype._resolveTokens = function () {
        var _this = this;
        this._resolvedTokens = {};
        Object.keys(this._designTokens).forEach(function (category) {
            var tokens = _this._designTokens[category];
            Object.keys(tokens).forEach(function (key) {
                var value = tokens[key];
                _this._resolvedTokens[key] = _this._resolveTokenValue(value);
            });
        });
    };
    DesignTokenManager.prototype._resolveTokenValue = function (value) {
        if (typeof value !== 'string' || !value.startsWith('@')) {
            return value;
        }
        var tokenKey = value.slice(1);
        for (var _i = 0, _a = Object.values(this._designTokens); _i < _a.length; _i++) {
            var category = _a[_i];
            if (tokenKey in category) {
                var referencedValue = category[tokenKey];
                return this._resolveTokenValue(referencedValue);
            }
        }
        return value;
    };
    return DesignTokenManager;
}());
export { DesignTokenManager };
