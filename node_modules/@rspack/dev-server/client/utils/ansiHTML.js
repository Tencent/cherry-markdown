// Reference to https://github.com/sindresorhus/ansi-regex
var _regANSI = /(?:(?:\u001b\[)|\u009b)(?:(?:[0-9]{1,3})?(?:(?:;[0-9]{0,3})*)?[A-M|f-m])|\u001b[A-M]/;
var _defColors = {
    reset: ["fff", "000"],
    black: "000",
    red: "ff0000",
    green: "209805",
    yellow: "e8bf03",
    blue: "0000ff",
    magenta: "ff00ff",
    cyan: "00ffee",
    lightgrey: "f0f0f0",
    darkgrey: "888",
};
var _styles = {
    30: "black",
    31: "red",
    32: "green",
    33: "yellow",
    34: "blue",
    35: "magenta",
    36: "cyan",
    37: "lightgrey",
};
var _colorMode = {
    2: "rgb",
};
var _openTags = {
    1: "font-weight:bold",
    2: "opacity:0.5",
    3: "<i>",
    4: "<u>",
    8: "display:none",
    9: "<del>",
    38: function (match) {
        // color
        var mode = _colorMode[match[0]];
        if (mode === "rgb") {
            var r = match[1];
            var g = match[2];
            var b = match[3];
            match.advance(4);
            return "color: rgb(".concat(r, ",").concat(g, ",").concat(b, ")");
        }
    },
    48: function (match) {
        // background color
        var mode = _colorMode[match[0]];
        if (mode === "rgb") {
            var r = match[1];
            var g = match[2];
            var b = match[3];
            match.advance(4);
            return "background-color: rgb(".concat(r, ",").concat(g, ",").concat(b, ")");
        }
    },
};
var _openTagToCloseTag = {
    3: "23",
    4: "24",
    9: "29",
};
var _closeTags = {
    0: function (ansiCodes) {
        if (!ansiCodes)
            return "</span>";
        if (!ansiCodes.length)
            return "";
        var code;
        var ret = "";
        while ((code = ansiCodes.pop())) {
            var closeTag = _openTagToCloseTag[code];
            if (closeTag) {
                ret += _closeTags[closeTag];
                continue;
            }
            ret += "</span>";
        }
        return ret;
    },
    23: "</i>",
    24: "</u>",
    29: "</del>", // reset delete
};
for (var _i = 0, _a = [21, 22, 27, 28, 39, 49]; _i < _a.length; _i++) {
    var n = _a[_i];
    _closeTags[n] = "</span>";
}
/**
 * Normalize ';<seq>' | '<seq>' -> '<seq>'
 */
function normalizeSeq(seq) {
    if (seq === null || seq === undefined)
        return null;
    if (seq.startsWith(";")) {
        return seq.slice(1);
    }
    return seq;
}
/**
 * Converts text with ANSI color codes to HTML markup.
 */
export default function ansiHTML(text) {
    // Returns the text if the string has no ANSI escape code.
    if (!_regANSI.test(text)) {
        return text;
    }
    // Cache opened sequence.
    var ansiCodes = [];
    // Replace with markup.
    //@ts-ignore TS1487 error
    var ret = text.replace(/\033\[(?:[0-9]{1,3})?(?:(?:;[0-9]{0,3})*)?m/g, function (m) {
        var _a;
        var match = (_a = m.match(/(;?\d+)/g)) === null || _a === void 0 ? void 0 : _a.map(normalizeSeq);
        Object.defineProperty(match, "advance", {
            value: function (count) {
                this.splice(0, count);
            },
        });
        var rep = "";
        var seq;
        while ((seq = match[0])) {
            match.advance(1);
            rep += applySeq(seq);
        }
        return rep;
        function applySeq(seq) {
            var other = _openTags[seq];
            if (other &&
                (other =
                    typeof other === "function" ? other(match) : other)) {
                // If reset signal is encountered, we have to reset everything.
                var ret_1 = "";
                if (seq === "0") {
                    ret_1 += _closeTags[seq](ansiCodes);
                }
                // If current sequence has been opened, close it.
                if (ansiCodes.indexOf(seq) !== -1) {
                    ansiCodes.pop();
                    return "</span>";
                }
                // Open tag.
                ansiCodes.push(seq);
                return ret_1 + (other[0] === "<" ? other : "<span style=\"".concat(other, ";\">"));
            }
            var ct = _closeTags[seq];
            if (typeof ct === "function") {
                return ct(ansiCodes);
            }
            if (ct) {
                // Pop sequence
                ansiCodes.pop();
                return ct;
            }
            return "";
        }
    });
    // Make sure tags are closed.
    var l = ansiCodes.length;
    l > 0 && (ret += Array(l + 1).join("</span>"));
    return ret;
}
/**
 * Customize colors.
 * @param {Object} colors reference to _defColors
 */
ansiHTML.setColors = function (colors) {
    if (typeof colors !== "object") {
        throw new Error("`colors` parameter must be an Object.");
    }
    var _finalColors = {};
    for (var key in _defColors) {
        var hex = colors.hasOwnProperty(key) ? colors[key] : null;
        if (!hex) {
            _finalColors[key] = _defColors[key];
            continue;
        }
        if ("reset" === key) {
            if (typeof hex === "string") {
                hex = [hex];
            }
            if (!Array.isArray(hex) ||
                hex.length === 0 ||
                hex.some(function (h) { return typeof h !== "string"; })) {
                throw new Error("The value of `".concat(key, "` property must be an Array and each item could only be a hex string, e.g.: FF0000"));
            }
            var defHexColor = _defColors[key];
            if (!hex[0]) {
                hex[0] = defHexColor[0];
            }
            if (hex.length === 1 || !hex[1]) {
                hex = [hex[0]];
                hex.push(defHexColor[1]);
            }
            hex = hex.slice(0, 2);
        }
        else if (typeof hex !== "string") {
            throw new Error("The value of `".concat(key, "` property must be a hex string, e.g.: FF0000"));
        }
        _finalColors[key] = hex;
    }
    _setTags(_finalColors);
};
/**
 * Reset colors.
 */
ansiHTML.reset = function () {
    _setTags(_defColors);
};
/**
 * Expose tags, including open and close.
 * @type {Object}
 */
ansiHTML.tags = {};
if (Object.defineProperty) {
    Object.defineProperty(ansiHTML.tags, "open", {
        get: function () { return _openTags; },
    });
    Object.defineProperty(ansiHTML.tags, "close", {
        get: function () { return _closeTags; },
    });
}
else {
    ansiHTML.tags.open = _openTags;
    ansiHTML.tags.close = _closeTags;
}
function _setTags(colors) {
    // reset all
    _openTags["0"] =
        "font-weight:normal;opacity:1;color:#".concat(colors.reset[0], ";background:#").concat(colors.reset[1]);
    // inverse
    _openTags["7"] = "color:#".concat(colors.reset[1], ";background:#").concat(colors.reset[0]);
    // dark grey
    _openTags["90"] = "color:#".concat(colors.darkgrey);
    for (var code in _styles) {
        var color = _styles[code];
        var oriColor = colors[color] || "000";
        _openTags[code] = "color:#".concat(oriColor);
        var codeInt = Number.parseInt(code);
        _openTags[(codeInt + 10).toString()] = "background:#".concat(oriColor);
    }
}
ansiHTML.reset();
