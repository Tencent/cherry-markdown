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
