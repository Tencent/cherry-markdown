
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
import * as clazzUtil from '../util/clazz.js';
import { ScaleCalculator } from './helper.js';
import { bind } from 'zrender/lib/core/util.js';
import { getScaleBreakHelper } from './break.js';
var Scale = /** @class */function () {
  function Scale(setting) {
    this._calculator = new ScaleCalculator();
    this._setting = setting || {};
    this._extent = [Infinity, -Infinity];
    var scaleBreakHelper = getScaleBreakHelper();
    if (scaleBreakHelper) {
      this._brkCtx = scaleBreakHelper.createScaleBreakContext();
      this._brkCtx.update(this._extent);
    }
  }
  Scale.prototype.getSetting = function (name) {
    return this._setting[name];
  };
  /**
   * [CAVEAT]: It should not be overridden!
   */
  Scale.prototype._innerUnionExtent = function (other) {
    var extent = this._extent;
    // Considered that number could be NaN and should not write into the extent.
    this._innerSetExtent(other[0] < extent[0] ? other[0] : extent[0], other[1] > extent[1] ? other[1] : extent[1]);
  };
  /**
   * Set extent from data
   */
  Scale.prototype.unionExtentFromData = function (data, dim) {
    this._innerUnionExtent(data.getApproximateExtent(dim));
  };
  /**
   * Get a new slice of extent.
   * Extent is always in increase order.
   */
  Scale.prototype.getExtent = function () {
    return this._extent.slice();
  };
  Scale.prototype.setExtent = function (start, end) {
    this._innerSetExtent(start, end);
  };
  /**
   * [CAVEAT]: It should not be overridden!
   */
  Scale.prototype._innerSetExtent = function (start, end) {
    var thisExtent = this._extent;
    if (!isNaN(start)) {
      thisExtent[0] = start;
    }
    if (!isNaN(end)) {
      thisExtent[1] = end;
    }
    this._brkCtx && this._brkCtx.update(thisExtent);
  };
  /**
   * Prerequisite: Scale#parse is ready.
   */
  Scale.prototype.setBreaksFromOption = function (breakOptionList) {
    var scaleBreakHelper = getScaleBreakHelper();
    if (scaleBreakHelper) {
      this._innerSetBreak(scaleBreakHelper.parseAxisBreakOption(breakOptionList, bind(this.parse, this)));
    }
  };
  /**
   * [CAVEAT]: It should not be overridden!
   */
  Scale.prototype._innerSetBreak = function (parsed) {
    if (this._brkCtx) {
      this._brkCtx.setBreaks(parsed);
      this._calculator.updateMethods(this._brkCtx);
      this._brkCtx.update(this._extent);
    }
  };
  /**
   * [CAVEAT]: It should not be overridden!
   */
  Scale.prototype._innerGetBreaks = function () {
    return this._brkCtx ? this._brkCtx.breaks : [];
  };
  /**
   * Do not expose the internal `_breaks` unless necessary.
   */
  Scale.prototype.hasBreaks = function () {
    return this._brkCtx ? this._brkCtx.hasBreaks() : false;
  };
  Scale.prototype._getExtentSpanWithBreaks = function () {
    return this._brkCtx && this._brkCtx.hasBreaks() ? this._brkCtx.getExtentSpan() : this._extent[1] - this._extent[0];
  };
  /**
   * If value is in extent range
   */
  Scale.prototype.isInExtentRange = function (value) {
    return this._extent[0] <= value && this._extent[1] >= value;
  };
  /**
   * When axis extent depends on data and no data exists,
   * axis ticks should not be drawn, which is named 'blank'.
   */
  Scale.prototype.isBlank = function () {
    return this._isBlank;
  };
  /**
   * When axis extent depends on data and no data exists,
   * axis ticks should not be drawn, which is named 'blank'.
   */
  Scale.prototype.setBlank = function (isBlank) {
    this._isBlank = isBlank;
  };
  return Scale;
}();
clazzUtil.enableClassManagement(Scale);
export default Scale;