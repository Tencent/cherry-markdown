
/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/


/**
 * AUTO-GENERATED FILE. DO NOT MODIFY.
 */

/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/
import { assert, clone, each, find, isString, map, trim } from 'zrender/lib/core/util.js';
import { error } from '../util/log.js';
import { registerScaleBreakHelperImpl } from './break.js';
import { round as fixRound } from '../util/number.js';
/**
 * @caution
 *  Must not export anything except `installScaleBreakHelper`
 */
var ScaleBreakContextImpl = /** @class */function () {
  function ScaleBreakContextImpl() {
    // [CAVEAT]: Should set only by `ScaleBreakContext#setBreaks`!
    this.breaks = [];
    // [CAVEAT]: Should update only by `ScaleBreakContext#update`!
    // They are the values that scaleExtent[0] and scaleExtent[1] are mapped to a numeric axis
    // that breaks are applied, primarily for optimization of `Scale#normalize`.
    this._elapsedExtent = [Infinity, -Infinity];
  }
  ScaleBreakContextImpl.prototype.setBreaks = function (parsed) {
    // @ts-ignore
    this.breaks = parsed.breaks;
  };
  /**
   * [CAVEAT]: Must be called immediately each time scale extent and breaks are updated!
   */
  ScaleBreakContextImpl.prototype.update = function (scaleExtent) {
    updateAxisBreakGapReal(this, scaleExtent);
    var elapsedExtent = this._elapsedExtent;
    elapsedExtent[0] = this.elapse(scaleExtent[0]);
    elapsedExtent[1] = this.elapse(scaleExtent[1]);
  };
  ScaleBreakContextImpl.prototype.hasBreaks = function () {
    return !!this.breaks.length;
  };
  /**
   * When iteratively generating ticks by nice interval, currently the `interval`, which is
   * calculated by break-elapsed extent span, is probably very small comparing to the original
   * extent, leading to a large number of iteration and tick generation, even over `safeLimit`.
   * Thus stepping over breaks is necessary in that loop.
   *
   * "Nice" should be ensured on ticks when step over the breaks. Thus this method returns
   * a integer multiple of the "nice tick interval".
   *
   * This method does little work; it is just for unifying and restricting the behavior.
   */
  ScaleBreakContextImpl.prototype.calcNiceTickMultiple = function (tickVal, estimateNiceMultiple) {
    for (var idx = 0; idx < this.breaks.length; idx++) {
      var brk = this.breaks[idx];
      if (brk.vmin < tickVal && tickVal < brk.vmax) {
        var multiple = estimateNiceMultiple(tickVal, brk.vmax);
        if (process.env.NODE_ENV !== 'production') {
          // If not, it may cause dead loop or not nice tick.
          assert(multiple >= 0 && Math.round(multiple) === multiple);
        }
        return multiple;
      }
    }
    return 0;
  };
  ScaleBreakContextImpl.prototype.getExtentSpan = function () {
    return this._elapsedExtent[1] - this._elapsedExtent[0];
  };
  ScaleBreakContextImpl.prototype.normalize = function (val) {
    var elapsedSpan = this._elapsedExtent[1] - this._elapsedExtent[0];
    // The same logic as `Scale#normalize`.
    if (elapsedSpan === 0) {
      return 0.5;
    }
    return (this.elapse(val) - this._elapsedExtent[0]) / elapsedSpan;
  };
  ScaleBreakContextImpl.prototype.scale = function (val) {
    return this.unelapse(val * (this._elapsedExtent[1] - this._elapsedExtent[0]) + this._elapsedExtent[0]);
  };
  /**
   * Suppose:
   *    AXIS_BREAK_LAST_BREAK_END_BASE: 0
   *    AXIS_BREAK_ELAPSED_BASE: 0
   *    breaks: [
   *        {start: -400, end: -300, gap: 27},
   *        {start: -100, end: 100, gap: 10},
   *        {start: 200, end: 400, gap: 300},
   *    ]
   * The mapping will be:
   *        |        |
   *    400 +   ->   +  237
   *     |  |        |   |  (gap: 300)
   *    200 +   ->   + -63
   *        |        |
   *    100 +   ->   + -163
   *     |  |        |   |  (gap: 10)
   *   -100 +   ->   + -173
   *        |        |
   *   -300 +   ->   + -373
   *     |  |        |   |  (gap: 27)
   *   -400 +   ->   + -400
   *        |        |
   *   origianl     elapsed
   *
   * Note:
   *   The mapping has nothing to do with "scale extent".
   */
  ScaleBreakContextImpl.prototype.elapse = function (val) {
    // If the value is in the break, return the normalized value in the break
    var elapsedVal = AXIS_BREAK_ELAPSED_BASE;
    var lastBreakEnd = AXIS_BREAK_LAST_BREAK_END_BASE;
    var stillOver = true;
    for (var i = 0; i < this.breaks.length; i++) {
      var brk = this.breaks[i];
      if (val <= brk.vmax) {
        if (val > brk.vmin) {
          elapsedVal += brk.vmin - lastBreakEnd + (val - brk.vmin) / (brk.vmax - brk.vmin) * brk.gapReal;
        } else {
          elapsedVal += val - lastBreakEnd;
        }
        lastBreakEnd = brk.vmax;
        stillOver = false;
        break;
      }
      elapsedVal += brk.vmin - lastBreakEnd + brk.gapReal;
      lastBreakEnd = brk.vmax;
    }
    if (stillOver) {
      elapsedVal += val - lastBreakEnd;
    }
    return elapsedVal;
  };
  ScaleBreakContextImpl.prototype.unelapse = function (elapsedVal) {
    var lastElapsedEnd = AXIS_BREAK_ELAPSED_BASE;
    var lastBreakEnd = AXIS_BREAK_LAST_BREAK_END_BASE;
    var stillOver = true;
    var unelapsedVal = 0;
    for (var i = 0; i < this.breaks.length; i++) {
      var brk = this.breaks[i];
      var elapsedStart = lastElapsedEnd + brk.vmin - lastBreakEnd;
      var elapsedEnd = elapsedStart + brk.gapReal;
      if (elapsedVal <= elapsedEnd) {
        if (elapsedVal > elapsedStart) {
          unelapsedVal = brk.vmin + (elapsedVal - elapsedStart) / (elapsedEnd - elapsedStart) * (brk.vmax - brk.vmin);
        } else {
          unelapsedVal = lastBreakEnd + elapsedVal - lastElapsedEnd;
        }
        lastBreakEnd = brk.vmax;
        stillOver = false;
        break;
      }
      lastElapsedEnd = elapsedEnd;
      lastBreakEnd = brk.vmax;
    }
    if (stillOver) {
      unelapsedVal = lastBreakEnd + elapsedVal - lastElapsedEnd;
    }
    return unelapsedVal;
  };
  return ScaleBreakContextImpl;
}();
;
function createScaleBreakContext() {
  return new ScaleBreakContextImpl();
}
// Both can start with any finite value, and are not necessaryily equal. But they need to
// be the same in `axisBreakElapse` and `axisBreakUnelapse` respectively.
var AXIS_BREAK_ELAPSED_BASE = 0;
var AXIS_BREAK_LAST_BREAK_END_BASE = 0;
/**
 * `gapReal` in brkCtx.breaks will be calculated.
 */
function updateAxisBreakGapReal(brkCtx, scaleExtent) {
  // Considered the effect:
  //  - Use dataZoom to move some of the breaks outside the extent.
  //  - Some scenarios that `series.clip: false`.
  //
  // How to calculate `prctBrksGapRealSum`:
  //  Based on the formula:
  //      xxx.span = brk.vmax - brk.vmin
  //      xxx.tpPrct.val / xxx.tpAbs.val means ParsedAxisBreak['gapParsed']['val']
  //      .S/.E means a break that is semi in scaleExtent[0] or scaleExtent[1]
  //      valP = (
  //          + (fullyInExtBrksSum.tpAbs.gapReal - fullyInExtBrksSum.tpAbs.span)
  //          + (semiInExtBrk.S.tpAbs.gapReal - semiInExtBrk.S.tpAbs.span) * semiInExtBrk.S.tpAbs.inExtFrac
  //          + (semiInExtBrk.E.tpAbs.gapReal - semiInExtBrk.E.tpAbs.span) * semiInExtBrk.E.tpAbs.inExtFrac
  //      )
  //      valQ = (
  //          - fullyInExtBrksSum.tpPrct.span
  //          - semiInExtBrk.S.tpPrct.span * semiInExtBrk.S.tpPrct.inExtFrac
  //          - semiInExtBrk.E.tpPrct.span * semiInExtBrk.E.tpPrct.inExtFrac
  //      )
  //      gapPrctSum = sum(xxx.tpPrct.val)
  //      gapPrctSum = prctBrksGapRealSum / (
  //          + (scaleExtent[1] - scaleExtent[0]) + valP + valQ
  //          + fullyInExtBrksSum.tpPrct.gapReal
  //          + semiInExtBrk.S.tpPrct.gapReal * semiInExtBrk.S.tpPrct.inExtFrac
  //          + semiInExtBrk.E.tpPrct.gapReal * semiInExtBrk.E.tpPrct.inExtFrac
  //      )
  //  Assume:
  //      xxx.tpPrct.gapReal = xxx.tpPrct.val / gapPrctSum * prctBrksGapRealSum
  //         (NOTE: This is not accurate when semi-in-extent break exist because its
  //         proportion is not linear, but this assumption approximately works.)
  //  Derived as follows:
  //      prctBrksGapRealSum = gapPrctSum * ( (scaleExtent[1] - scaleExtent[0]) + valP + valQ )
  //          / (1
  //              - fullyInExtBrksSum.tpPrct.val
  //              - semiInExtBrk.S.tpPrct.val * semiInExtBrk.S.tpPrct.inExtFrac
  //              - semiInExtBrk.E.tpPrct.val * semiInExtBrk.E.tpPrct.inExtFrac
  //          )
  var gapPrctSum = 0;
  var fullyInExtBrksSum = {
    tpAbs: {
      span: 0,
      val: 0
    },
    tpPrct: {
      span: 0,
      val: 0
    }
  };
  var init = function () {
    return {
      has: false,
      span: NaN,
      inExtFrac: NaN,
      val: NaN
    };
  };
  var semiInExtBrk = {
    S: {
      tpAbs: init(),
      tpPrct: init()
    },
    E: {
      tpAbs: init(),
      tpPrct: init()
    }
  };
  each(brkCtx.breaks, function (brk) {
    var gapParsed = brk.gapParsed;
    if (gapParsed.type === 'tpPrct') {
      gapPrctSum += gapParsed.val;
    }
    var clampedBrk = clampBreakByExtent(brk, scaleExtent);
    if (clampedBrk) {
      var vminClamped = clampedBrk.vmin !== brk.vmin;
      var vmaxClamped = clampedBrk.vmax !== brk.vmax;
      var clampedSpan = clampedBrk.vmax - clampedBrk.vmin;
      if (vminClamped && vmaxClamped) {
        // Do nothing, which simply makes the result `gapReal` cover the entire scaleExtent.
        // This transform is not consistent with the other cases but practically works.
      } else if (vminClamped || vmaxClamped) {
        var sOrE = vminClamped ? 'S' : 'E';
        semiInExtBrk[sOrE][gapParsed.type].has = true;
        semiInExtBrk[sOrE][gapParsed.type].span = clampedSpan;
        semiInExtBrk[sOrE][gapParsed.type].inExtFrac = clampedSpan / (brk.vmax - brk.vmin);
        semiInExtBrk[sOrE][gapParsed.type].val = gapParsed.val;
      } else {
        fullyInExtBrksSum[gapParsed.type].span += clampedSpan;
        fullyInExtBrksSum[gapParsed.type].val += gapParsed.val;
      }
    }
  });
  var prctBrksGapRealSum = gapPrctSum * (0 + (scaleExtent[1] - scaleExtent[0]) + (fullyInExtBrksSum.tpAbs.val - fullyInExtBrksSum.tpAbs.span) + (semiInExtBrk.S.tpAbs.has ? (semiInExtBrk.S.tpAbs.val - semiInExtBrk.S.tpAbs.span) * semiInExtBrk.S.tpAbs.inExtFrac : 0) + (semiInExtBrk.E.tpAbs.has ? (semiInExtBrk.E.tpAbs.val - semiInExtBrk.E.tpAbs.span) * semiInExtBrk.E.tpAbs.inExtFrac : 0) - fullyInExtBrksSum.tpPrct.span - (semiInExtBrk.S.tpPrct.has ? semiInExtBrk.S.tpPrct.span * semiInExtBrk.S.tpPrct.inExtFrac : 0) - (semiInExtBrk.E.tpPrct.has ? semiInExtBrk.E.tpPrct.span * semiInExtBrk.E.tpPrct.inExtFrac : 0)) / (1 - fullyInExtBrksSum.tpPrct.val - (semiInExtBrk.S.tpPrct.has ? semiInExtBrk.S.tpPrct.val * semiInExtBrk.S.tpPrct.inExtFrac : 0) - (semiInExtBrk.E.tpPrct.has ? semiInExtBrk.E.tpPrct.val * semiInExtBrk.E.tpPrct.inExtFrac : 0));
  each(brkCtx.breaks, function (brk) {
    var gapParsed = brk.gapParsed;
    if (gapParsed.type === 'tpPrct') {
      brk.gapReal = gapPrctSum !== 0
      // prctBrksGapRealSum is supposed to be non-negative but add a safe guard
      ? Math.max(prctBrksGapRealSum, 0) * gapParsed.val / gapPrctSum : 0;
    }
    if (gapParsed.type === 'tpAbs') {
      brk.gapReal = gapParsed.val;
    }
    if (brk.gapReal == null) {
      brk.gapReal = 0;
    }
  });
}
function pruneTicksByBreak(pruneByBreak, ticks, breaks, getValue, interval, scaleExtent) {
  if (pruneByBreak === 'no') {
    return;
  }
  each(breaks, function (brk) {
    // break.vmin/vmax that out of extent must not impact the visible of
    // normal ticks and labels.
    var clampedBrk = clampBreakByExtent(brk, scaleExtent);
    if (!clampedBrk) {
      return;
    }
    // Remove some normal ticks to avoid zigzag shapes overlapping with split lines
    // and to avoid break labels overlapping with normal tick labels (thouth it can
    // also be avoided by `axisLabel.hideOverlap`).
    // It's OK to O(n^2) since the number of `ticks` are small.
    for (var j = ticks.length - 1; j >= 0; j--) {
      var tick = ticks[j];
      var val = getValue(tick);
      // 1. Ensure there is no ticks inside `break.vmin` and `break.vmax`.
      // 2. Use an empirically gap value here. Theoritically `zigzagAmplitude` is
      //  supposed to be involved to provide better precision but it will brings
      //  more complexity. The empirically gap value is conservative because break
      //  labels and normal tick lables are prone to overlapping.
      var gap = interval * 3 / 4;
      if (val > clampedBrk.vmin - gap && val < clampedBrk.vmax + gap && (pruneByBreak !== 'preserve_extent_bound' || val !== scaleExtent[0] && val !== scaleExtent[1])) {
        ticks.splice(j, 1);
      }
    }
  });
}
function addBreaksToTicks(
// The input ticks should be in accending order.
ticks, breaks, scaleExtent,
// Keep the break ends at the same level to avoid an awkward appearance.
getTimeProps) {
  each(breaks, function (brk) {
    var clampedBrk = clampBreakByExtent(brk, scaleExtent);
    if (!clampedBrk) {
      return;
    }
    // - When neight `break.vmin` nor `break.vmax` is in scale extent,
    //  break label should not be displayed and we do not add them to the result.
    // - When only one of `break.vmin` and `break.vmax` is inside the extent and the
    //  other is outsite, we comply with the extent and display only part of the breaks area,
    //  because the extent might be determined by user settings (such as `axis.min/max`)
    ticks.push({
      value: clampedBrk.vmin,
      "break": {
        type: 'vmin',
        parsedBreak: clampedBrk
      },
      time: getTimeProps ? getTimeProps(clampedBrk) : undefined
    });
    // When gap is 0, start tick overlap with end tick, but we still count both of them. Break
    // area shape can address that overlapping. `axisLabel` need draw both start and end separately,
    // otherwise it brings complexity to the logic of label overlapping resolving (e.g., when label
    // rotated), and introduces inconsistency to users in `axisLabel.formatter` between gap is 0 or not.
    ticks.push({
      value: clampedBrk.vmax,
      "break": {
        type: 'vmax',
        parsedBreak: clampedBrk
      },
      time: getTimeProps ? getTimeProps(clampedBrk) : undefined
    });
  });
  if (breaks.length) {
    ticks.sort(function (a, b) {
      return a.value - b.value;
    });
  }
}
/**
 * If break and extent does not intersect, return null/undefined.
 * If the intersection is only a point at scaleExtent[0] or scaleExtent[1], return null/undefined.
 */
function clampBreakByExtent(brk, scaleExtent) {
  var vmin = Math.max(brk.vmin, scaleExtent[0]);
  var vmax = Math.min(brk.vmax, scaleExtent[1]);
  return vmin < vmax || vmin === vmax && vmin > scaleExtent[0] && vmin < scaleExtent[1] ? {
    vmin: vmin,
    vmax: vmax,
    breakOption: brk.breakOption,
    gapParsed: brk.gapParsed,
    gapReal: brk.gapReal
  } : null;
}
function parseAxisBreakOption(
// raw user input breaks, retrieved from axis model.
breakOptionList, parse, opt) {
  var parsedBreaks = [];
  if (!breakOptionList) {
    return {
      breaks: parsedBreaks
    };
  }
  function validatePercent(normalizedPercent, msg) {
    if (normalizedPercent >= 0 && normalizedPercent < 1 - 1e-5) {
      // Avoid division error.
      return true;
    }
    if (process.env.NODE_ENV !== 'production') {
      error(msg + " must be >= 0 and < 1, rather than " + normalizedPercent + " .");
    }
    return false;
  }
  each(breakOptionList, function (brkOption) {
    if (!brkOption || brkOption.start == null || brkOption.end == null) {
      if (process.env.NODE_ENV !== 'production') {
        error('The input axis breaks start/end should not be empty.');
      }
      return;
    }
    if (brkOption.isExpanded) {
      return;
    }
    var parsedBrk = {
      breakOption: clone(brkOption),
      vmin: parse(brkOption.start),
      vmax: parse(brkOption.end),
      gapParsed: {
        type: 'tpAbs',
        val: 0
      },
      gapReal: null
    };
    if (brkOption.gap != null) {
      var isPrct = false;
      if (isString(brkOption.gap)) {
        var trimmedGap = trim(brkOption.gap);
        if (trimmedGap.match(/%$/)) {
          var normalizedPercent = parseFloat(trimmedGap) / 100;
          if (!validatePercent(normalizedPercent, 'Percent gap')) {
            normalizedPercent = 0;
          }
          parsedBrk.gapParsed.type = 'tpPrct';
          parsedBrk.gapParsed.val = normalizedPercent;
          isPrct = true;
        }
      }
      if (!isPrct) {
        var absolute = parse(brkOption.gap);
        if (!isFinite(absolute) || absolute < 0) {
          if (process.env.NODE_ENV !== 'production') {
            error("Axis breaks gap must positive finite rather than (" + brkOption.gap + ").");
          }
          absolute = 0;
        }
        parsedBrk.gapParsed.type = 'tpAbs';
        parsedBrk.gapParsed.val = absolute;
      }
    }
    if (parsedBrk.vmin === parsedBrk.vmax) {
      parsedBrk.gapParsed.type = 'tpAbs';
      parsedBrk.gapParsed.val = 0;
    }
    if (opt && opt.noNegative) {
      each(['vmin', 'vmax'], function (se) {
        if (parsedBrk[se] < 0) {
          if (process.env.NODE_ENV !== 'production') {
            error("Axis break." + se + " must not be negative.");
          }
          parsedBrk[se] = 0;
        }
      });
    }
    // Ascending numerical order is the prerequisite of the calculation in Scale#normalize.
    // User are allowed to input desending vmin/vmax for simplifying the usage.
    if (parsedBrk.vmin > parsedBrk.vmax) {
      var tmp = parsedBrk.vmax;
      parsedBrk.vmax = parsedBrk.vmin;
      parsedBrk.vmin = tmp;
    }
    parsedBreaks.push(parsedBrk);
  });
  // Ascending numerical order is the prerequisite of the calculation in Scale#normalize.
  parsedBreaks.sort(function (item1, item2) {
    return item1.vmin - item2.vmin;
  });
  // Make sure that the intervals in breaks are not overlap.
  var lastEnd = -Infinity;
  each(parsedBreaks, function (brk, idx) {
    if (lastEnd > brk.vmin) {
      if (process.env.NODE_ENV !== 'production') {
        error('Axis breaks must not overlap.');
      }
      parsedBreaks[idx] = null;
    }
    lastEnd = brk.vmax;
  });
  return {
    breaks: parsedBreaks.filter(function (brk) {
      return !!brk;
    })
  };
}
function identifyAxisBreak(brk, identifier) {
  return serializeAxisBreakIdentifier(identifier) === serializeAxisBreakIdentifier(brk);
}
function serializeAxisBreakIdentifier(identifier) {
  // We use user input start/end to identify break. Considered cases like `start: new Date(xxx)`,
  // Theoretically `Scale#parse` should be used here, but not used currently to reduce dependencies,
  // since simply converting to string happens to be correct.
  return identifier.start + '_\0_' + identifier.end;
}
/**
 * - A break pair represents `[vmin, vmax]`,
 * - Only both vmin and vmax item exist, they are counted as a pair.
 */
function retrieveAxisBreakPairs(itemList, getVisualAxisBreak, returnIdx) {
  var idxPairList = [];
  each(itemList, function (el, idx) {
    var vBreak = getVisualAxisBreak(el);
    if (vBreak && vBreak.type === 'vmin') {
      idxPairList.push([idx]);
    }
  });
  each(itemList, function (el, idx) {
    var vBreak = getVisualAxisBreak(el);
    if (vBreak && vBreak.type === 'vmax') {
      var idxPair = find(idxPairList,
      // parsedBreak may be changed, can only use breakOption to match them.
      function (pr) {
        return identifyAxisBreak(getVisualAxisBreak(itemList[pr[0]]).parsedBreak.breakOption, vBreak.parsedBreak.breakOption);
      });
      idxPair && idxPair.push(idx);
    }
  });
  var result = [];
  each(idxPairList, function (idxPair) {
    if (idxPair.length === 2) {
      result.push(returnIdx ? idxPair : [itemList[idxPair[0]], itemList[idxPair[1]]]);
    }
  });
  return result;
}
function getTicksLogTransformBreak(tick, logBase, logOriginalBreaks, fixRoundingError) {
  var vBreak;
  var brkRoundingCriterion;
  if (tick["break"]) {
    var brk = tick["break"].parsedBreak;
    var originalBreak = find(logOriginalBreaks, function (brk) {
      return identifyAxisBreak(brk.breakOption, tick["break"].parsedBreak.breakOption);
    });
    var vmin = fixRoundingError(Math.pow(logBase, brk.vmin), originalBreak.vmin);
    var vmax = fixRoundingError(Math.pow(logBase, brk.vmax), originalBreak.vmax);
    var gapParsed = {
      type: brk.gapParsed.type,
      val: brk.gapParsed.type === 'tpAbs' ? fixRound(Math.pow(logBase, brk.vmin + brk.gapParsed.val)) - vmin : brk.gapParsed.val
    };
    vBreak = {
      type: tick["break"].type,
      parsedBreak: {
        breakOption: brk.breakOption,
        vmin: vmin,
        vmax: vmax,
        gapParsed: gapParsed,
        gapReal: brk.gapReal
      }
    };
    brkRoundingCriterion = originalBreak[tick["break"].type];
  }
  return {
    brkRoundingCriterion: brkRoundingCriterion,
    vBreak: vBreak
  };
}
function logarithmicParseBreaksFromOption(breakOptionList, logBase, parse) {
  var opt = {
    noNegative: true
  };
  var parsedOriginal = parseAxisBreakOption(breakOptionList, parse, opt);
  var parsedLogged = parseAxisBreakOption(breakOptionList, parse, opt);
  var loggedBase = Math.log(logBase);
  parsedLogged.breaks = map(parsedLogged.breaks, function (brk) {
    var vmin = Math.log(brk.vmin) / loggedBase;
    var vmax = Math.log(brk.vmax) / loggedBase;
    var gapParsed = {
      type: brk.gapParsed.type,
      val: brk.gapParsed.type === 'tpAbs' ? Math.log(brk.vmin + brk.gapParsed.val) / loggedBase - vmin : brk.gapParsed.val
    };
    return {
      vmin: vmin,
      vmax: vmax,
      gapParsed: gapParsed,
      gapReal: brk.gapReal,
      breakOption: brk.breakOption
    };
  });
  return {
    parsedOriginal: parsedOriginal,
    parsedLogged: parsedLogged
  };
}
var BREAK_MIN_MAX_TO_PARAM = {
  vmin: 'start',
  vmax: 'end'
};
function makeAxisLabelFormatterParamBreak(extraParam, vBreak) {
  if (vBreak) {
    extraParam = extraParam || {};
    extraParam["break"] = {
      type: BREAK_MIN_MAX_TO_PARAM[vBreak.type],
      start: vBreak.parsedBreak.vmin,
      end: vBreak.parsedBreak.vmax
    };
  }
  return extraParam;
}
export function installScaleBreakHelper() {
  registerScaleBreakHelperImpl({
    createScaleBreakContext: createScaleBreakContext,
    pruneTicksByBreak: pruneTicksByBreak,
    addBreaksToTicks: addBreaksToTicks,
    parseAxisBreakOption: parseAxisBreakOption,
    identifyAxisBreak: identifyAxisBreak,
    serializeAxisBreakIdentifier: serializeAxisBreakIdentifier,
    retrieveAxisBreakPairs: retrieveAxisBreakPairs,
    getTicksLogTransformBreak: getTicksLogTransformBreak,
    logarithmicParseBreaksFromOption: logarithmicParseBreaksFromOption,
    makeAxisLabelFormatterParamBreak: makeAxisLabelFormatterParamBreak
  });
}