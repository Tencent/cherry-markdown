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
function isInViewport(el) {
  const bound = el.getBoundingClientRect();
  const clientHeight = window.innerHeight;
  return bound.top <= clientHeight;
}

function isScrollEl(el) {
  return el.scrollHeight > el.clientHeight;
}

function loadImg(container) {
  const imgs = container.querySelectorAll('img');
  Array.from(imgs).forEach((el) => {
    if (!el.src && isInViewport(el)) {
      const dataSrc = el.getAttribute('data-src');
      if (dataSrc) {
        el.src = dataSrc;
      }
    }
  });
}

const containerNodes = [];
function addScrollListener(el) {
  let $el = el;
  if (containerNodes.indexOf($el) > -1) {
    return;
  }
  containerNodes.push($el);
  const containerEl = $el;
  while ($el && !isScrollEl($el)) {
    $el = $el.parentNode;
  }
  if ($el) {
    $el.addEventListener('scroll', () => {
      loadImg(containerEl);
    });
  }
}

export default function lazyLoadImg(container) {
  if (container && container.nodeType === 1) {
    addScrollListener(container);
    loadImg(container);
  }
}
