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
    constructor(options: any, previewer: any);
    options: {
        loadingImgPath: string;
        maxNumPerTime: number;
        noLoadImgNum: number;
        autoLoadImgNum: number;
        maxTryTimesPerSrc: number;
        beforeLoadOneImgCallback: (img: any) => void;
        failLoadOneImgCallback: (img: any) => void;
        afterLoadOneImgCallback: (img: any) => void;
        afterLoadAllImgCallback: () => void;
    };
    previewer: any;
    srcLoadedList: any[];
    srcFailLoadedList: {};
    srcLoadingList: any[];
    srcList: any[];
    loadingImgNum: number;
    lastLoadAllNum: number;
    previewerDom: any;
    /**
     * 判断图片的src是否加载过
     * @param {String} src
     * @return {Boolean}
     */
    isLoaded(src: string): boolean;
    /**
     * 判断图片是否正在加载
     * @param {String} src
     * @return {Boolean}
     */
    isLoading(src: string): boolean;
    /**
     * 加载失败时，把src加入到失败队列中，并记录失败次数
     * @param {*} src
     */
    loadFailed(src: any): void;
    /**
     * 判断图片失败次数是否超过最大次数
     * @param {*} src
     * @return {Boolean}
     */
    isFailLoadedMax(src: any): boolean;
    /**
     * 判断当前时刻所有图片是否都完成过加载
     * 当出现新图片后，完成加载后，当前函数还是会再次触发加载完的回调函数（afterLoadAllImgCallback）
     * 该函数并不是实时返回的，最大有1s的延时
     */
    isLoadedAllDone(): boolean;
    /**
     * 当向下滚动时，提前100px加载图片
     * 当向上滚动时，不提前加载图片，一定要图片完全进入可视区域（top > 0）再加载图片，否则当锚点定位时，会由于上面的图片加载出现定位不准的情况
     *
     */
    loadOneImg(): boolean;
    /**
     * 尝试加载src
     * @param {String} src
     */
    tryLoadOneImg(src: string, successCallback: any, failCallback: any): void;
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
    doLazyLoad(): void;
    isRunning: boolean;
    /**
     * 把图片里的data-src替换为src
     * @param {*} content
     * @returns {String}
     */
    changeDataSrc2Src(content: any): string;
    /**
     * 把已经加载的图片里的data-src替换为src
     * @param {*} content
     * @returns {String}
     */
    changeLoadedDataSrc2Src(content: any): string;
    /**
     * 移除图片的src属性
     * @param {String} img
     * @returns {String}
     */
    $removeSrc(img: string): string;
    /**
     * 把图片里的src替换为data-src，如果src已经加载过，则不替换
     * @param {String} content
     * @param {Boolean} focus 强制替换
     * @returns {String}
     */
    changeSrc2DataSrc(content: string, focus?: boolean): string;
}
