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
export function addEvent(elm, evType, fn, useCapture) {
  if (elm.addEventListener) {
    elm.addEventListener(evType, fn, useCapture); // DOM2.0
    return true;
  }

  if (elm.attachEvent) {
    const r = elm.attachEvent(`on${evType}`, fn); // IE5+
    return r;
  }
  elm[`on${evType}`] = fn; // DOM 0
}

export function removeEvent(elm, evType, fn, useCapture) {
  if (elm.removeEventListener) {
    elm.removeEventListener(evType, fn, useCapture); // DOM2.0
  } else if (elm.detachEvent) {
    const r = elm.detachEvent(`on${evType}`, fn); // IE5+
    return r;
  } else {
    elm[`on${evType}`] = null; // DOM 0
  }
}
