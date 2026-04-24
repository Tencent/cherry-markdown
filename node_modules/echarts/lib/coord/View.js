
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
/**
 * Simple view coordinate system
 * Mapping given x, y to transformd view x, y
 */
import * as vector from 'zrender/lib/core/vector.js';
import * as matrix from 'zrender/lib/core/matrix.js';
import BoundingRect from 'zrender/lib/core/BoundingRect.js';
import Transformable from 'zrender/lib/core/Transformable.js';
import { parsePercent } from '../util/number.js';
import { clone } from 'zrender/lib/core/util.js';
import { clampByZoomLimit } from '../component/helper/roamHelper.js';
var v2ApplyTransform = vector.applyTransform;
var View = /** @class */function (_super) {
  __extends(View, _super);
  function View(name, opt) {
    var _this = _super.call(this) || this;
    _this.type = 'view';
    _this.dimensions = ['x', 'y'];
    /**
     * Represents the transform brought by roam/zoom.
     * If `View['_viewRect']` applies roam transform,
     * we can get the final displayed rect.
     */
    _this._roamTransformable = new Transformable();
    /**
     * Represents the transform from `View['_rect']` to `View['_viewRect']`.
     */
    _this._rawTransformable = new Transformable();
    _this.name = name;
    _this._opt = opt;
    return _this;
  }
  View.prototype.setBoundingRect = function (x, y, width, height) {
    this._rect = new BoundingRect(x, y, width, height);
    this._updateCenterAndZoom();
    return this._rect;
  };
  View.prototype.getBoundingRect = function () {
    return this._rect;
  };
  /**
   * If no need to transform `View['_rect']` to `View['_viewRect']`, the calling of
   * `setViewRect` can be omitted.
   */
  View.prototype.setViewRect = function (x, y, width, height) {
    this._transformTo(x, y, width, height);
    this._viewRect = new BoundingRect(x, y, width, height);
  };
  /**
   * Transformed to particular position and size
   */
  View.prototype._transformTo = function (x, y, width, height) {
    var rect = this.getBoundingRect();
    var rawTransform = this._rawTransformable;
    rawTransform.transform = rect.calculateTransform(new BoundingRect(x, y, width, height));
    var rawParent = rawTransform.parent;
    rawTransform.parent = null;
    rawTransform.decomposeTransform();
    rawTransform.parent = rawParent;
    this._updateTransform();
  };
  /**
   * [NOTICE]
   *  The definition of this center has always been irrelevant to some other series center like
   *  'series-pie.center' - this center is a point on the same coord sys as `View['_rect'].x/y`,
   *  rather than canvas viewport, and the unit is not necessarily pixel (e.g., in geo case).
   *  @see {View['_center']} for details.
   */
  View.prototype.setCenter = function (centerCoord) {
    // #16904 introcuded percentage string here, such as '33%'. But it was based on canvas
    // width/height, which is not reasonable - the unit may incorrect, and it is unpredictable if
    // the `View['_rect']` is not calculated based on the current canvas rect. Therefore the percentage
    // value is changed to based on `View['_rect'].width/height` since v6. Under this definition, users
    // can use '0%' to map the top-left of `View['_rect']` to the center of `View['_viewRect']`.
    var opt = this._opt;
    if (opt && opt.api && opt.ecModel && opt.ecModel.getShallow('legacyViewCoordSysCenterBase') && centerCoord) {
      centerCoord = [parsePercent(centerCoord[0], opt.api.getWidth()), parsePercent(centerCoord[1], opt.api.getWidth())];
    }
    this._centerOption = clone(centerCoord);
    this._updateCenterAndZoom();
  };
  View.prototype.setZoom = function (zoom) {
    this._zoom = clampByZoomLimit(zoom || 1, this.zoomLimit);
    this._updateCenterAndZoom();
  };
  /**
   * Get default center without roam
   */
  View.prototype.getDefaultCenter = function () {
    // Rect before any transform
    var rawRect = this.getBoundingRect();
    var cx = rawRect.x + rawRect.width / 2;
    var cy = rawRect.y + rawRect.height / 2;
    return [cx, cy];
  };
  View.prototype.getCenter = function () {
    return this._center || this.getDefaultCenter();
  };
  View.prototype.getZoom = function () {
    return this._zoom || 1;
  };
  View.prototype.getRoamTransform = function () {
    return this._roamTransformable.getLocalTransform();
  };
  /**
   * Ensure this method is idempotent, since it should be called when
   * every relevant prop (e.g. _centerOption/_zoom/_rect/_viewRect) changed.
   */
  View.prototype._updateCenterAndZoom = function () {
    var centerOption = this._centerOption;
    var rect = this._rect;
    if (centerOption && rect) {
      this._center = [parsePercent(centerOption[0], rect.width, rect.x), parsePercent(centerOption[1], rect.height, rect.y)];
    }
    // Must update after view transform updated
    var rawTransformMatrix = this._rawTransformable.getLocalTransform();
    var roamTransform = this._roamTransformable;
    var defaultCenter = this.getDefaultCenter();
    var center = this.getCenter();
    var zoom = this.getZoom();
    center = vector.applyTransform([], center, rawTransformMatrix);
    defaultCenter = vector.applyTransform([], defaultCenter, rawTransformMatrix);
    roamTransform.originX = center[0];
    roamTransform.originY = center[1];
    roamTransform.x = defaultCenter[0] - center[0];
    roamTransform.y = defaultCenter[1] - center[1];
    roamTransform.scaleX = roamTransform.scaleY = zoom;
    this._updateTransform();
  };
  /**
   * Update transform props on `this` based on the current
   * `this._roamTransformable` and `this._rawTransformable`.
   */
  View.prototype._updateTransform = function () {
    var roamTransformable = this._roamTransformable;
    var rawTransformable = this._rawTransformable;
    rawTransformable.parent = roamTransformable;
    roamTransformable.updateTransform();
    rawTransformable.updateTransform();
    matrix.copy(this.transform || (this.transform = []), rawTransformable.transform || matrix.create());
    this._rawTransform = rawTransformable.getLocalTransform();
    this.invTransform = this.invTransform || [];
    matrix.invert(this.invTransform, this.transform);
    this.decomposeTransform();
  };
  View.prototype.getTransformInfo = function () {
    var rawTransformable = this._rawTransformable;
    var roamTransformable = this._roamTransformable;
    // Because roamTransformabel has `originX/originY` modified,
    // but the caller of `getTransformInfo` can not handle `originX/originY`,
    // so need to recalculate them.
    var dummyTransformable = new Transformable();
    dummyTransformable.transform = roamTransformable.transform;
    dummyTransformable.decomposeTransform();
    return {
      roam: {
        x: dummyTransformable.x,
        y: dummyTransformable.y,
        scaleX: dummyTransformable.scaleX,
        scaleY: dummyTransformable.scaleY
      },
      raw: {
        x: rawTransformable.x,
        y: rawTransformable.y,
        scaleX: rawTransformable.scaleX,
        scaleY: rawTransformable.scaleY
      }
    };
  };
  View.prototype.getViewRect = function () {
    return this._viewRect;
  };
  /**
   * Get view rect after roam transform
   */
  View.prototype.getViewRectAfterRoam = function () {
    var rect = this.getBoundingRect().clone();
    rect.applyTransform(this.transform);
    return rect;
  };
  /**
   * Convert a single (lon, lat) data item to (x, y) point.
   */
  View.prototype.dataToPoint = function (data, noRoam, out) {
    var transform = noRoam ? this._rawTransform : this.transform;
    out = out || [];
    return transform ? v2ApplyTransform(out, data, transform) : vector.copy(out, data);
  };
  /**
   * Convert a (x, y) point to (lon, lat) data
   */
  View.prototype.pointToData = function (point, reserved, out) {
    out = out || [];
    var invTransform = this.invTransform;
    return invTransform ? v2ApplyTransform(out, point, invTransform) : (out[0] = point[0], out[1] = point[1], out);
  };
  View.prototype.convertToPixel = function (ecModel, finder, value) {
    var coordSys = getCoordSys(finder);
    return coordSys === this ? coordSys.dataToPoint(value) : null;
  };
  View.prototype.convertFromPixel = function (ecModel, finder, pixel) {
    var coordSys = getCoordSys(finder);
    return coordSys === this ? coordSys.pointToData(pixel) : null;
  };
  /**
   * @implements
   */
  View.prototype.containPoint = function (point) {
    return this.getViewRectAfterRoam().contain(point[0], point[1]);
  };
  View.dimensions = ['x', 'y'];
  return View;
}(Transformable);
function getCoordSys(finder) {
  var seriesModel = finder.seriesModel;
  return seriesModel ? seriesModel.coordinateSystem : null; // e.g., graph.
}
export default View;