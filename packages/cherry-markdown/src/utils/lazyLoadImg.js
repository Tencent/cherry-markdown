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

/**
 * 懒加载图片
 *
 * - 只缓存图片的src的原因
 *    - 1、因为浏览器的图片缓存机制，相同的src第二次请求时，会浏览器会直接返回缓存的图片
 *    - 2、编辑状态时预览区域dom结构不稳定，并不能准确的缓存到img dom对象
 *
 * - 当浏览器**禁用**了图片缓存时，本机制效果有限
 *    - 依然还是可以实现懒加载的效果
 *    - 但是会把图片请求次数翻倍
 */
export default class LazyLoadImg {
  options = {
    // 加载图片时如果需要展示loading图，则配置loading图的地址
    loadingImgPath: '',
    // 同一时间最多有几个图片请求，最大同时加载6张图片
    maxNumPerTime: 2,
    // 不进行懒加载处理的图片数量，如果为0，即所有图片都进行懒加载处理， 如果设置为-1，则所有图片都不进行懒加载处理
    noLoadImgNum: 5,
    // 首次自动加载几张图片（不论图片是否滚动到视野内），autoLoadImgNum = -1 表示会自动加载完所有图片
    autoLoadImgNum: 5,
    // 针对加载失败的图片 或 beforeLoadOneImgCallback 返回false 的图片，最多尝试加载几次，为了防止死循环，最多5次。以图片的src为纬度统计重试次数
    maxTryTimesPerSrc: 2,
    // 加载一张图片之前的回调函数，函数return false 会终止加载操作
    beforeLoadOneImgCallback: (img) => {},
    // 加载一张图片失败之后的回调函数
    failLoadOneImgCallback: (img) => {},
    // 加载一张图片之后的回调函数，如果图片加载失败，则不会回调该函数
    afterLoadOneImgCallback: (img) => {},
    // 加载完所有图片后调用的回调函数，只表示某一个时刻所有图片都加在完时的回调，如果预览区域又有了新图片，当新图片加载完后还会产生这个回调
    afterLoadAllImgCallback: () => {},
  };

  constructor(options, previewer) {
    Object.assign(this.options, options);
    this.previewer = previewer;
    // 记录已经加载过的图片src
    this.srcLoadedList = [];
    // 记录加载失败的图片src，key是src，value是失败次数
    this.srcFailLoadedList = {};
    // 记录正在加载的图片src
    this.srcLoadingList = [];
    // 记录所有懒加载的图片src
    this.srcList = [];
    // 记录当前时刻有多少图片正在加载
    this.loadingImgNum = 0;
    // 记录上次加载完所有图片的个数
    this.lastLoadAllNum = 0;
    this.previewerDom = this.previewer.getDomContainer();
  }

  /**
   * 判断图片的src是否加载过
   * @param {String} src
   * @return {Boolean}
   */
  isLoaded(src) {
    return this.srcLoadedList.includes(src);
  }

  /**
   * 判断图片是否正在加载
   * @param {String} src
   * @return {Boolean}
   */
  isLoading(src) {
    return this.srcLoadingList.includes(src);
  }

  /**
   * 加载失败时，把src加入到失败队列中，并记录失败次数
   * @param {*} src
   */
  loadFailed(src) {
    this.srcFailLoadedList[src] = this.srcFailLoadedList[src] ? this.srcFailLoadedList[src] + 1 : 1;
  }

  /**
   * 判断图片失败次数是否超过最大次数
   * @param {*} src
   * @return {Boolean}
   */
  isFailLoadedMax(src) {
    return this.srcFailLoadedList[src] && this.srcFailLoadedList[src] > this.options.maxTryTimesPerSrc;
  }

  /**
   * 判断当前时刻所有图片是否都完成过加载
   * 当出现新图片后，完成加载后，当前函数还是会再次触发加载完的回调函数（afterLoadAllImgCallback）
   * 该函数并不是实时返回的，最大有1s的延时
   */
  isLoadedAllDone() {
    const imgs = this.previewerDom.querySelectorAll('img[data-src]');
    const allLoadedNum = this.srcLoadedList.length;
    // const dataSrcRemain = allLoadNum - this.srcLoadedList.length;
    if (imgs.length <= 0 && this.lastLoadAllNum < allLoadedNum) {
      this.lastLoadAllNum = allLoadedNum;
      this.options.afterLoadAllImgCallback();
      return true;
    }
    return false;
  }

  /**
   * 当向下滚动时，提前100px加载图片
   * 当向上滚动时，不提前加载图片，一定要图片完全进入可视区域（top > 0）再加载图片，否则当锚点定位时，会由于上面的图片加载出现定位不准的情况
   *
   */
  loadOneImg() {
    const imgs = this.previewerDom.querySelectorAll('img[data-src]');
    const { height, top } = this.previewerDom.getBoundingClientRect();
    const previewerHeight = height + top + 100; // 冗余一定高度用于提前加载
    const windowsHeight = window?.innerHeight ?? 0 + 100; // 浏览器的视口高度
    const maxHeight = Math.min(previewerHeight, windowsHeight); // 目标视区高度一定是小于浏览器视口高度的，也一定是小于预览区高度的
    const minHeight = top - 30; // 计算顶部高度时，需要预加载一行高
    const { autoLoadImgNum } = this.options;
    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];
      const position = img.getBoundingClientRect();
      // 判断是否在视区内
      const testPosition = position.top >= minHeight && position.top <= maxHeight;
      // 判断是否需要自动加载
      const testAutoLoad = this.srcList.length < autoLoadImgNum;
      if (!testPosition && !testAutoLoad) {
        continue;
      }
      let originSrc = img.getAttribute('data-src');
      if (!originSrc) {
        continue;
      }
      if (this.isLoaded(originSrc) || this.isFailLoadedMax(originSrc)) {
        // 如果已经加载过相同的图片，或者已经超过失败最大重试次数，则直接加载
        img.setAttribute('src', originSrc);
        img.removeAttribute('data-src');
      }
      // 如果当前src正在加载，则忽略这个src，继续找下个符合条件的src
      if (this.isLoading(originSrc)) {
        continue;
      }
      // 超过最大并发量时停止加载
      if (this.loadingImgNum >= this.options.maxNumPerTime) {
        return false;
      }
      const test = this.options.beforeLoadOneImgCallback(img);
      if (typeof test === 'undefined' || test) {
        originSrc = img.getAttribute('data-src') ?? originSrc;
      } else {
        this.loadFailed(originSrc);
        continue;
      }
      this.loadingImgNum += 1;
      this.srcList.push(originSrc);
      this.srcLoadingList.push(originSrc);
      this.tryLoadOneImg(
        originSrc,
        () => {
          img.setAttribute('src', originSrc);
          img.removeAttribute('data-src');
          this.srcLoadedList.push(originSrc);
          this.loadingImgNum -= 1;
          this.srcLoadingList.splice(this.srcLoadingList.indexOf(originSrc), 1);
          this.options.afterLoadOneImgCallback(img);
          this.loadOneImg();
        },
        () => {
          this.loadFailed(originSrc);
          this.loadingImgNum -= 1;
          this.srcLoadingList.splice(this.srcLoadingList.indexOf(originSrc), 1);
          this.options.failLoadOneImgCallback(img);
          this.loadOneImg();
        },
      );
    }
    return false;
  }

  /**
   * 尝试加载src
   * @param {String} src
   */
  tryLoadOneImg(src, successCallback, failCallback) {
    const img = document.createElement('img');
    img.onload = () => {
      successCallback();
      img.remove();
    };
    img.onerror = () => {
      failCallback();
      img.remove();
    };
    img.setAttribute('src', src);
  }

  /**
   * 开始进行懒加载
   *
   * **关于实现方式的思考**
   * 实现图片懒加载一般有三种方式：
   *  1、监听滚动事件，滚动到视野内的图片开始加载
   *  2、定时检测当前视窗内是否有图片需要加载
   *  3、当前一张图片加载完成后，自动加载下一张图片
   *
   * 方式1监听滚动事件的弊端：
   *  1、需要限频率
   *  2、不能实现自动加载所有图片的功能（autoLoadImgNum = -1）
   *  3、如果业务方对预览区域做了个性化加工，有可能导致监听不到滚动事件
   *  4、在自动滚动到锚点的场景，会在页面滚动时加载图片，图片的加载会导致锚点上方的元素高度发生变化，最终导致锚点定位失败
   *      （所以在这个场景下，需要特殊处理图片加载的时机，但并不好判断是否锚点引发的滚动）
   *  5、浏览器尺寸发生变化或者浏览器缩放比例发生变化的场景（当然还有横屏竖屏切换、系统分辨率改变等）不好监听和响应
   *
   * 方式2轮询的弊端：
   *  1、需要额外的逻辑来控制并发
   *  2、消耗计算资源，所以需要尽量优化单次计算量，并尽量避免在轮询里进行大范围dom操作
   *  3、两次图片加载中间可能有最大轮询间隔的空闲时间浪费
   *
   * 方式3依次加载的弊端：
   *  1、没办法实现滚动到视野内再加载图片
   *
   * 综合考虑决定用方式2（轮询）+方式3（依次加载）的组合方式，并且每次只做一次dom写操作
   * 轮询带来的性能开销就让受摩尔定律加持的硬件和每月都会更新版本的浏览器们愁去吧
   */
  doLazyLoad() {
    // 防止重复调用
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    const { maxNumPerTime } = this.options;
    const polling = () => {
      // 保证至少有一次自动加载
      this.loadOneImg();
      for (let i = 1; i < maxNumPerTime; i++) {
        this.loadOneImg();
      }
      setTimeout(polling, 200);
    };
    polling();
    // setTimeout(polling, 200);
    setInterval(() => {
      this.isLoadedAllDone();
    }, 1000);
  }

  /**
   * 把图片里的data-src替换为src
   * @param {*} content
   * @returns {String}
   */
  changeDataSrc2Src(content) {
    return content.replace(/<img ([^>]*?)data-src="([^"]+)"([^>]*?)>/g, (match, m1, src, m3) => {
      return `<img ${this.$removeSrc(m1)} src="${src}" ${this.$removeSrc(m3)}>`.replace(/ {2,}/g, ' ');
    });
  }

  /**
   * 把已经加载的图片里的data-src替换为src
   * @param {*} content
   * @returns {String}
   */
  changeLoadedDataSrc2Src(content) {
    return content.replace(/<img ([^>]*?)data-src="([^"]+)"([^>]*?)>/g, (match, m1, src, m3) => {
      if (!this.isLoaded(src)) {
        return match;
      }
      return `<img ${this.$removeSrc(m1)} src="${src}" ${this.$removeSrc(m3)}>`.replace(/ {2,}/g, ' ');
    });
  }

  /**
   * 移除图片的src属性
   * @param {String} img
   * @returns {String}
   */
  $removeSrc(img) {
    return ` ${img}`.replace(/^(.*?) src=".*?"(.*?$)/, '$1$2');
  }

  /**
   * 把图片里的src替换为data-src，如果src已经加载过，则不替换
   * @param {String} content
   * @param {Boolean} focus 强制替换
   * @returns {String}
   */
  changeSrc2DataSrc(content, focus = false) {
    const { loadingImgPath } = this.options;
    const { noLoadImgNum } = this.options;
    let currentNoLoadImgNum = 0;
    return content.replace(/<img ([^>]*?)src="([^"]+)"([^>]*?)>/g, (match, m1, src, m3) => {
      // 如果已经替换过data-src了，或者没有src属性，或者关闭了懒加载功能，则不替换
      if (/data-src="/.test(match) || !/ src="/.test(match) || noLoadImgNum < 0) {
        return match;
      }
      if (focus === false) {
        // 前noLoadImgNum张图片不替换
        if (currentNoLoadImgNum < noLoadImgNum) {
          currentNoLoadImgNum += 1;
          return match;
        }
        // 如果src已经加载过，则不替换
        if (this.isLoaded(src)) {
          return match;
        }
      }
      // 如果配置了loadingImgPath，则替换src为loadingImgPath
      if (loadingImgPath) {
        return `<img ${m1}src="${loadingImgPath}" data-src="${src}"${m3}>`;
      }
      return `<img ${m1}data-src="${src}"${m3}>`;
    });
  }
}
