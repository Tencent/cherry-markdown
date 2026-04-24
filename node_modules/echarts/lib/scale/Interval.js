
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
import { __extends } from "tslib";
import * as numberUtil from '../util/number.js';
import * as formatUtil from '../util/format.js';
import Scale from './Scale.js';
import * as helper from './helper.js';
import { getScaleBreakHelper } from './break.js';
var roundNumber = numberUtil.round;
var IntervalScale = /** @class */function (_super) {
  __extends(IntervalScale, _super);
  function IntervalScale() {
    var _this = _super !== null && _super.apply(this, arguments) || this;
    _this.type = 'interval';
    // Step is calculated in adjustExtent.
    _this._interval = 0;
    _this._intervalPrecision = 2;
    return _this;
  }
  IntervalScale.prototype.parse = function (val) {
    // `Scale#parse` (and its overrids) are typically applied at the axis values input
    // in echarts option. e.g., `axis.min/max`, `dataZoom.min/max`, etc.
    // but `series.data` is not included, which uses `dataValueHelper.ts`#`parseDataValue`.
    // `Scale#parse` originally introduced in fb8c813215098b9d2458966229bb95c510883d5e
    // at 2016 for dataZoom start/end settings (See `parseAxisModelMinMax`).
    //
    // Historically `scale/Interval.ts` returns the input value directly. But numeric
    // values (such as a number-like string '123') effectively passed through here and
    // were involved in calculations, which was error-prone and inconsistent with the
    // declared TS return type. Previously such issues are fixed separately in different
    // places case by case (such as #2475).
    //
    // Now, we perform actual parse to ensure its `number` type here. The parsing rule
    // follows the series data parsing rule (`dataValueHelper.ts`#`parseDataValue`)
    // and maintains compatibility as much as possible (thus a more strict parsing
    // `number.ts`#`numericToNumber` is not used here.)
    //
    // FIXME: `ScaleDataValue` also need to be modified to include numeric string type,
    //  since it effectively does.
    return val == null || val === '' ? NaN
    // If string (like '-'), using '+' parse to NaN
    // If object, also parse to NaN
    : Number(val);
  };
  IntervalScale.prototype.contain = function (val) {
    return helper.contain(val, this._extent);
  };
  IntervalScale.prototype.normalize = function (val) {
    return this._calculator.normalize(val, this._extent);
  };
  IntervalScale.prototype.scale = function (val) {
    return this._calculator.scale(val, this._extent);
  };
  IntervalScale.prototype.getInterval = function () {
    return this._interval;
  };
  IntervalScale.prototype.setInterval = function (interval) {
    this._interval = interval;
    // Dropped auto calculated niceExtent and use user-set extent.
    // We assume user wants to set both interval, min, max to get a better result.
    this._niceExtent = this._extent.slice();
    this._intervalPrecision = helper.getIntervalPrecision(interval);
  };
  /**
   * @override
   */
  IntervalScale.prototype.getTicks = function (opt) {
    opt = opt || {};
    var interval = this._interval;
    var extent = this._extent;
    var niceTickExtent = this._niceExtent;
    var intervalPrecision = this._intervalPrecision;
    var scaleBreakHelper = getScaleBreakHelper();
    var ticks = [];
    // If interval is 0, return [];
    if (!interval) {
      return ticks;
    }
    if (opt.breakTicks === 'only_break' && scaleBreakHelper) {
      scaleBreakHelper.addBreaksToTicks(ticks, this._brkCtx.breaks, this._extent);
      return ticks;
    }
    // Consider this case: using dataZoom toolbox, zoom and zoom.
    var safeLimit = 10000;
    if (extent[0] < niceTickExtent[0]) {
      if (opt.expandToNicedExtent) {
        ticks.push({
          value: roundNumber(niceTickExtent[0] - interval, intervalPrecision)
        });
      } else {
        ticks.push({
          value: extent[0]
        });
      }
    }
    var estimateNiceMultiple = function (tickVal, targetTick) {
      return Math.round((targetTick - tickVal) / interval);
    };
    var tick = niceTickExtent[0];
    while (tick <= niceTickExtent[1]) {
      ticks.push({
        value: tick
      });
      // Avoid rounding error
      tick = roundNumber(tick + interval, intervalPrecision);
      if (this._brkCtx) {
        var moreMultiple = this._brkCtx.calcNiceTickMultiple(tick, estimateNiceMultiple);
        if (moreMultiple >= 0) {
          tick = roundNumber(tick + moreMultiple * interval, intervalPrecision);
        }
      }
      if (ticks.length > 0 && tick === ticks[ticks.length - 1].value) {
        // Consider out of safe float point, e.g.,
        // -3711126.9907707 + 2e-10 === -3711126.9907707
        break;
      }
      if (ticks.length > safeLimit) {
        return [];
      }
    }
    // Consider this case: the last item of ticks is smaller
    // than niceTickExtent[1] and niceTickExtent[1] === extent[1].
    var lastNiceTick = ticks.length ? ticks[ticks.length - 1].value : niceTickExtent[1];
    if (extent[1] > lastNiceTick) {
      if (opt.expandToNicedExtent) {
        ticks.push({
          value: roundNumber(lastNiceTick + interval, intervalPrecision)
        });
      } else {
        ticks.push({
          value: extent[1]
        });
      }
    }
    if (scaleBreakHelper) {
      scaleBreakHelper.pruneTicksByBreak(opt.pruneByBreak, ticks, this._brkCtx.breaks, function (item) {
        return item.value;
      }, this._interval, this._extent);
    }
    if (opt.breakTicks !== 'none' && scaleBreakHelper) {
      scaleBreakHelper.addBreaksToTicks(ticks, this._brkCtx.breaks, this._extent);
    }
    return ticks;
  };
  IntervalScale.prototype.getMinorTicks = function (splitNumber) {
    var ticks = this.getTicks({
      expandToNicedExtent: true
    });
    // NOTE: In log-scale, do not support minor ticks when breaks exist.
    //  because currently log-scale minor ticks is calculated based on raw values
    //  rather than log-transformed value, due to an odd effect when breaks exist.
    var minorTicks = [];
    var extent = this.getExtent();
    for (var i = 1; i < ticks.length; i++) {
      var nextTick = ticks[i];
      var prevTick = ticks[i - 1];
      if (prevTick["break"] || nextTick["break"]) {
        // Do not build minor ticks to the adjacent ticks to breaks ticks,
        // since the interval might be irregular.
        continue;
      }
      var count = 0;
      var minorTicksGroup = [];
      var interval = nextTick.value - prevTick.value;
      var minorInterval = interval / splitNumber;
      var minorIntervalPrecision = helper.getIntervalPrecision(minorInterval);
      while (count < splitNumber - 1) {
        var minorTick = roundNumber(prevTick.value + (count + 1) * minorInterval, minorIntervalPrecision);
        // For the first and last interval. The count may be less than splitNumber.
        if (minorTick > extent[0] && minorTick < extent[1]) {
          minorTicksGroup.push(minorTick);
        }
        count++;
      }
      var scaleBreakHelper = getScaleBreakHelper();
      scaleBreakHelper && scaleBreakHelper.pruneTicksByBreak('auto', minorTicksGroup, this._getNonTransBreaks(), function (value) {
        return value;
      }, this._interval, extent);
      minorTicks.push(minorTicksGroup);
    }
    return minorTicks;
  };
  IntervalScale.prototype._getNonTransBreaks = function () {
    return this._brkCtx ? this._brkCtx.breaks : [];
  };
  /**
   * @param opt.precision If 'auto', use nice presision.
   * @param opt.pad returns 1.50 but not 1.5 if precision is 2.
   */
  IntervalScale.prototype.getLabel = function (data, opt) {
    if (data == null) {
      return '';
    }
    var precision = opt && opt.precision;
    if (precision == null) {
      precision = numberUtil.getPrecision(data.value) || 0;
    } else if (precision === 'auto') {
      // Should be more precise then tick.
      precision = this._intervalPrecision;
    }
    // (1) If `precision` is set, 12.005 should be display as '12.00500'.
    // (2) Use roundNumber (toFixed) to avoid scientific notation like '3.5e-7'.
    var dataNum = roundNumber(data.value, precision, true);
    return formatUtil.addCommas(dataNum);
  };
  /**
   * FIXME: refactor - disallow override, use composition instead.
   *
   * The override of `calcNiceTicks` should ensure these members are provided:
   *  this._intervalPrecision
   *  this._interval
   *
   * @param splitNumber By default `5`.
   */
  IntervalScale.prototype.calcNiceTicks = function (splitNumber, minInterval, maxInterval) {
    splitNumber = splitNumber || 5;
    var extent = this._extent.slice();
    var span = this._getExtentSpanWithBreaks();
    if (!isFinite(span)) {
      return;
    }
    // User may set axis min 0 and data are all negative
    // FIXME If it needs to reverse ?
    if (span < 0) {
      span = -span;
      extent.reverse();
      this._innerSetExtent(extent[0], extent[1]);
      extent = this._extent.slice();
    }
    var result = helper.intervalScaleNiceTicks(extent, span, splitNumber, minInterval, maxInterval);
    this._intervalPrecision = result.intervalPrecision;
    this._interval = result.interval;
    this._niceExtent = result.niceTickExtent;
  };
  IntervalScale.prototype.calcNiceExtent = function (opt) {
    var extent = this._extent.slice();
    // If extent start and end are same, expand them
    if (extent[0] === extent[1]) {
      if (extent[0] !== 0) {
        // Expand extent
        // Note that extents can be both negative. See #13154
        var expandSize = Math.abs(extent[0]);
        // In the fowllowing case
        //      Axis has been fixed max 100
        //      Plus data are all 100 and axis extent are [100, 100].
        // Extend to the both side will cause expanded max is larger than fixed max.
        // So only expand to the smaller side.
        if (!opt.fixMax) {
          extent[1] += expandSize / 2;
          extent[0] -= expandSize / 2;
        } else {
          extent[0] -= expandSize / 2;
        }
      } else {
        extent[1] = 1;
      }
    }
    var span = extent[1] - extent[0];
    // If there are no data and extent are [Infinity, -Infinity]
    if (!isFinite(span)) {
      extent[0] = 0;
      extent[1] = 1;
    }
    this._innerSetExtent(extent[0], extent[1]);
    extent = this._extent.slice();
    this.calcNiceTicks(opt.splitNumber, opt.minInterval, opt.maxInterval);
    var interval = this._interval;
    var intervalPrecition = this._intervalPrecision;
    if (!opt.fixMin) {
      extent[0] = roundNumber(Math.floor(extent[0] / interval) * interval, intervalPrecition);
    }
    if (!opt.fixMax) {
      extent[1] = roundNumber(Math.ceil(extent[1] / interval) * interval, intervalPrecition);
    }
    this._innerSetExtent(extent[0], extent[1]);
  };
  IntervalScale.prototype.setNiceExtent = function (min, max) {
    this._niceExtent = [min, max];
  };
  IntervalScale.type = 'interval';
  return IntervalScale;
}(Scale);
Scale.registerClass(IntervalScale);
export default IntervalScale;