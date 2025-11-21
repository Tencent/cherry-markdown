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
 * hover 到脚注标号时用来展示悬浮弹窗
 */
export default class FootnoteHoverHandler {
    constructor(trigger: any, target: any, container: any, cherry: any, bubbleConfig: any);
    /**
     * 用来存放所有的数据
     */
    bubbleCard: {
        refNum: number;
        refTitle: string;
        content: string;
    };
    trigger: any;
    target: any;
    aElement: any;
    previewerDom: any;
    container: any;
    $cherry: any;
    bubbleConfig: any;
    emit(type: any, event?: {}, callback?: () => void): void;
    /**
     * 刷新定位
     */
    $refreshPosition(): void;
    showBubble(): void;
    isShowBubble: boolean;
    $render(): string;
    $tryRemoveMe(event: any, callback: any): void;
    /**
     * 获取目标dom的位置信息
     */
    $getPosition(): {
        top: number;
        left: number;
        width: any;
        height: any;
        maxLeft: any;
    };
    setStyle(element: any, property: any, value: any): void;
    $remove(): void;
}
