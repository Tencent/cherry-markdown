/**
 * [TAPD](https://tapd.cn)的检查项语法
 * 通用的检查项语法为：
 *  -[ ] 检查项1
 *  -[x] 检查项2
 *  -[ ] 检查项3
 * TAPD的检查项语法为：
 *  [x][ ][ ] 只要有中括号就会成为检查项
 *  [ ][x][ ]
 *  [ ][ ][x]
 */
export default class TapdCheckListPlugin {
    static HOOK_NAME: string;
    makeHtml(html: any): any;
    afterMakeHtml(html: any): any;
    rule(): {};
}
