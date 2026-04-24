
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
import { BoundingRect } from '../../util/graphic.js';
/**
 * [CAVEAT] `updateViewOnPan` and `updateViewOnZoom` modifies the group transform directly,
 *  but the 'center' and 'zoom' in echarts option and 'View' coordinate system are not updated yet,
 *  which must be performed later in 'xxxRoam' action by calling `updateCenterAndZoom`.
 * @see {updateCenterAndZoomInAction}
 */
export function updateViewOnPan(controllerHost, dx, dy) {
  var target = controllerHost.target;
  target.x += dx;
  target.y += dy;
  target.dirty();
}
export function updateViewOnZoom(controllerHost, zoomDelta, zoomX, zoomY) {
  var target = controllerHost.target;
  var zoomLimit = controllerHost.zoomLimit;
  var newZoom = controllerHost.zoom = controllerHost.zoom || 1;
  newZoom *= zoomDelta;
  newZoom = clampByZoomLimit(newZoom, zoomLimit);
  var zoomScale = newZoom / controllerHost.zoom;
  controllerHost.zoom = newZoom;
  zoomTransformableByOrigin(target, zoomX, zoomY, zoomScale);
  target.dirty();
}
/**
 * A abstraction for some similar impl in roaming.
 */
export function updateController(seriesModel, api, pointerCheckerEl, controller, controllerHost, clipRect) {
  var tmpRect = new BoundingRect(0, 0, 0, 0);
  controller.enable(seriesModel.get('roam'), {
    api: api,
    zInfo: {
      component: seriesModel
    },
    triggerInfo: {
      roamTrigger: seriesModel.get('roamTrigger'),
      isInSelf: function (e, x, y) {
        tmpRect.copy(pointerCheckerEl.getBoundingRect());
        tmpRect.applyTransform(pointerCheckerEl.getComputedTransform());
        return tmpRect.contain(x, y);
      },
      isInClip: function (e, x, y) {
        return !clipRect || clipRect.contain(x, y);
      }
    }
  });
  controllerHost.zoomLimit = seriesModel.get('scaleLimit');
  var coordinate = seriesModel.coordinateSystem;
  controllerHost.zoom = coordinate ? coordinate.getZoom() : 1;
  var type = seriesModel.subType + 'Roam';
  controller.off('pan').off('zoom').on('pan', function (e) {
    updateViewOnPan(controllerHost, e.dx, e.dy);
    api.dispatchAction({
      seriesId: seriesModel.id,
      type: type,
      dx: e.dx,
      dy: e.dy
    });
  }).on('zoom', function (e) {
    /**
     * FIXME: should do nothing except `api.dispatchAction` here, the other logic
     *  should be performed in the action handler and `updateTransform`; otherwise,
     *  they are inconsistent if user triggers this action explicitly.
     */
    updateViewOnZoom(controllerHost, e.scale, e.originX, e.originY);
    api.dispatchAction({
      seriesId: seriesModel.id,
      type: type,
      zoom: e.scale,
      originX: e.originX,
      originY: e.originY
    });
    // Only update label layout on zoom
    api.updateLabelLayout();
  });
}
function getCenterCoord(view, point) {
  // Use projected coord as center because it's linear.
  return view.pointToProjected ? view.pointToProjected(point) : view.pointToData(point);
}
/**
 * Should be called only in action handler.
 * @see {updateViewOnPan|updateViewOnZoom}
 */
export function updateCenterAndZoomInAction(view, payload, zoomLimit) {
  var previousZoom = view.getZoom();
  var center = view.getCenter();
  var deltaZoom = payload.zoom;
  var point = view.projectedToPoint ? view.projectedToPoint(center) : view.dataToPoint(center);
  if (payload.dx != null && payload.dy != null) {
    point[0] -= payload.dx;
    point[1] -= payload.dy;
    view.setCenter(getCenterCoord(view, point));
  }
  if (deltaZoom != null) {
    deltaZoom = clampByZoomLimit(previousZoom * deltaZoom, zoomLimit) / previousZoom;
    zoomTransformableByOrigin(view, payload.originX, payload.originY, deltaZoom);
    view.updateTransform();
    // [NOTICE] Tricky: `getCetnerCoord` uses `this.invTransform` modified by the `updateTransform` above.
    view.setCenter(getCenterCoord(view, point));
    view.setZoom(deltaZoom * previousZoom);
  }
  return {
    center: view.getCenter(),
    zoom: view.getZoom()
  };
}
function zoomTransformableByOrigin(target, originX, originY, deltaZoom) {
  // Keep the mouse center when scaling.
  target.x -= (originX - target.x) * (deltaZoom - 1);
  target.y -= (originY - target.y) * (deltaZoom - 1);
  target.scaleX *= deltaZoom;
  target.scaleY *= deltaZoom;
}
export function clampByZoomLimit(zoom, zoomLimit) {
  if (zoomLimit) {
    var zoomMin = zoomLimit.min || 0;
    var zoomMax = zoomLimit.max || Infinity;
    zoom = Math.max(Math.min(zoomMax, zoom), zoomMin);
  }
  return zoom;
}