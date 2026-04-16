/**
 * Copyright (C) 2021 Tencent.
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
 * Myers' Diff 算法
 * 用来对两个数列/字符串做diff,得到增/删元素的最简形式
 * 参考文献: http://www.xmailserver.org/diff2.pdf
 */
export default class MyersDiff {
    constructor(newObj: any, oldObj: any, getElement: any);
    options: {
        newObj: any;
        oldObj: any;
        getElement: any;
    };
    /**
     * 执行diff操作
     */
    doDiff(): any[];
    /**
     * 用于判断列表/字符串元素是否相等的判据函数
     */
    getElement(obj: any, index: any): any;
    /**
     * 寻找从起点到终点的折线
     */
    findSnakes(newObj: any, oldObj: any): {
        xStart: any;
        xMid: any;
        xEnd: any;
    }[];
    /**
     * 回溯,找出关键路径对应的折线
     */
    $backtraceSnakes(allSnakes: any, newLen: any, oldLen: any, d: any): {
        xStart: any;
        xMid: any;
        xEnd: any;
    }[];
    /**
     * 组装出返回值
     */
    assembleResult(snakes: any, newObj: any, oldObj: any): any[];
}
