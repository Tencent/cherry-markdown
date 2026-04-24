
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
import { needFixJitter, fixJitter } from '../../util/jitter.js';
export default function jitterLayout(ecModel) {
  ecModel.eachSeriesByType('scatter', function (seriesModel) {
    var coordSys = seriesModel.coordinateSystem;
    if (coordSys && (coordSys.type === 'cartesian2d' || coordSys.type === 'single')) {
      var baseAxis_1 = coordSys.getBaseAxis ? coordSys.getBaseAxis() : null;
      var hasJitter = baseAxis_1 && needFixJitter(seriesModel, baseAxis_1);
      if (hasJitter) {
        var data_1 = seriesModel.getData();
        data_1.each(function (idx) {
          var dim = baseAxis_1.dim;
          var orient = baseAxis_1.orient;
          var isSingleY = orient === 'horizontal' && baseAxis_1.type !== 'category' || orient === 'vertical' && baseAxis_1.type === 'category';
          var layout = data_1.getItemLayout(idx);
          var rawSize = data_1.getItemVisual(idx, 'symbolSize');
          var size = rawSize instanceof Array ? (rawSize[1] + rawSize[0]) / 2 : rawSize;
          if (dim === 'y' || dim === 'single' && isSingleY) {
            // x is fixed, and y is floating
            var jittered = fixJitter(baseAxis_1, layout[0], layout[1], size / 2);
            data_1.setItemLayout(idx, [layout[0], jittered]);
          } else if (dim === 'x' || dim === 'single' && !isSingleY) {
            // y is fixed, and x is floating
            var jittered = fixJitter(baseAxis_1, layout[1], layout[0], size / 2);
            data_1.setItemLayout(idx, [jittered, layout[1]]);
          }
        });
      }
    }
  });
}