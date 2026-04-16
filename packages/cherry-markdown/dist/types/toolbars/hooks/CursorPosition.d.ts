/**
 * 光标位置回显
 */
export default class CursorPosition extends MenuBase {
    constructor($cherry: any);
    countEvent: Event;
    $updateCursorPosition(): void;
    btnDom: any;
}
import MenuBase from '@/toolbars/MenuBase';
