
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
import * as zrUtil from 'zrender/lib/core/util.js';
import Scale from './Scale.js';
import * as numberUtil from '../util/number.js';
// Use some method of IntervalScale
import IntervalScale from './Interval.js';
import { getIntervalPrecision, logTransform } from './helper.js';
import { getScaleBreakHelper } from './break.js';
var fixRound = numberUtil.round;
var mathFloor = Math.floor;
var mathCeil = Math.ceil;
var mathPow = Math.pow;
var mathLog = Math.log;
var LogScale = /** @class */function (_super) {
  __extends(LogScale, _super);
  function LogScale() {
    var _this = _super !== null && _super.apply(this, arguments) || this;
    _this.type = 'log';
    _this.base = 10;
    _this._originalScale = new IntervalScale();
    return _this;
  }
  /**
   * @param Whether expand the ticks to niced extent.
   */
  LogScale.prototype.getTicks = function (opt) {
    opt = opt || {};
    var extent = this._extent.slice();
    var originalExtent = this._originalScale.getExtent();
    var ticks = _super.prototype.getTicks.call(this, opt);
    var base = this.base;
    var originalBreaks = this._originalScale._innerGetBreaks();
    var scaleBreakHelper = getScaleBreakHelper();
    return zrUtil.map(ticks, function (tick) {
      var val = tick.value;
      var roundingCriterion = null;
      var powVal = mathPow(base, val);
      // Fix #4158
      if (val === extent[0] && this._fixMin) {
        roundingCriterion = originalExtent[0];
      } else if (val === extent[1] && this._fixMax) {
        roundingCriterion = originalExtent[1];
      }
      var vBreak;
      if (scaleBreakHelper) {
        var transformed = scaleBreakHelper.getTicksLogTransformBreak(tick, base, originalBreaks, fixRoundingError);
        vBreak = transformed.vBreak;
        if (roundingCriterion == null) {
          roundingCriterion = transformed.brkRoundingCriterion;
        }
      }
      if (roundingCriterion != null) {
        powVal = fixRoundingError(powVal, roundingCriterion);
      }
      return {
        value: powVal,
        "break": vBreak
      };
    }, this);
  };
  LogScale.prototype._getNonTransBreaks = function () {
    return this._originalScale._innerGetBreaks();
  };
  LogScale.prototype.setExtent = function (start, end) {
    this._originalScale.setExtent(start, end);
    var loggedExtent = logTransform(this.base, [start, end]);
    _super.prototype.setExtent.call(this, loggedExtent[0], loggedExtent[1]);
  };
  /**
   * @return {number} end
   */
  LogScale.prototype.getExtent = function () {
    var base = this.base;
    var extent = _super.prototype.getExtent.call(this);
    extent[0] = mathPow(base, extent[0]);
    extent[1] = mathPow(base, extent[1]);
    // Fix #4158
    var originalExtent = this._originalScale.getExtent();
    this._fixMin && (extent[0] = fixRoundingError(extent[0], originalExtent[0]));
    this._fixMax && (extent[1] = fixRoundingError(extent[1], originalExtent[1]));
    return extent;
  };
  LogScale.prototype.unionExtentFromData = function (data, dim) {
    this._originalScale.unionExtentFromData(data, dim);
    var loggedOther = logTransform(this.base, data.getApproximateExtent(dim), true);
    this._innerUnionExtent(loggedOther);
  };
  /**
   * Update interval and extent of intervals for nice ticks
   * @param approxTickNum default 10 Given approx tick number
   */
  LogScale.prototype.calcNiceTicks = function (approxTickNum) {
    approxTickNum = approxTickNum || 10;
    var extent = this._extent.slice();
    var span = this._getExtentSpanWithBreaks();
    if (!isFinite(span) || span <= 0) {
      return;
    }
    var interval = numberUtil.quantity(span);
    var err = approxTickNum / span * interval;
    // Filter ticks to get closer to the desired count.
    if (err <= 0.5) {
      interval *= 10;
    }
    // Interval should be integer
    while (!isNaN(interval) && Math.abs(interval) < 1 && Math.abs(interval) > 0) {
      interval *= 10;
    }
    var niceExtent = [fixRound(mathCeil(extent[0] / interval) * interval), fixRound(mathFloor(extent[1] / interval) * interval)];
    this._interval = interval;
    this._intervalPrecision = getIntervalPrecision(interval);
    this._niceExtent = niceExtent;
  };
  LogScale.prototype.calcNiceExtent = function (opt) {
    _super.prototype.calcNiceExtent.call(this, opt);
    this._fixMin = opt.fixMin;
    this._fixMax = opt.fixMax;
  };
  LogScale.prototype.contain = function (val) {
    val = mathLog(val) / mathLog(this.base);
    return _super.prototype.contain.call(this, val);
  };
  LogScale.prototype.normalize = function (val) {
    val = mathLog(val) / mathLog(this.base);
    return _super.prototype.normalize.call(this, val);
  };
  LogScale.prototype.scale = function (val) {
    val = _super.prototype.scale.call(this, val);
    return mathPow(this.base, val);
  };
  LogScale.prototype.setBreaksFromOption = function (breakOptionList) {
    var scaleBreakHelper = getScaleBreakHelper();
    if (!scaleBreakHelper) {
      return;
    }
    var _a = scaleBreakHelper.logarithmicParseBreaksFromOption(breakOptionList, this.base, zrUtil.bind(this.parse, this)),
      parsedOriginal = _a.parsedOriginal,
      parsedLogged = _a.parsedLogged;
    this._originalScale._innerSetBreak(parsedOriginal);
    this._innerSetBreak(parsedLogged);
  };
  LogScale.type = 'log';
  return LogScale;
}(IntervalScale);
function fixRoundingError(val, originalVal) {
  return fixRound(val, numberUtil.getPrecision(originalVal));
}
Scale.registerClass(LogScale);
export default LogScale;