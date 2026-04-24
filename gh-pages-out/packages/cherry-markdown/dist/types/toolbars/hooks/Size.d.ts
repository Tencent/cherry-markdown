export default class Size extends MenuBase {
    subMenuConfig: {
        name: any;
        noIcon: boolean;
        onclick: any;
    }[];
    shortKeyMap: {
        'Alt-Digit1': string;
        'Alt-Digit2': string;
        'Alt-Digit3': string;
        'Alt-Digit4': string;
    };
    shortcutKeyMap: {
        [x: string]: {
            hookName: string;
            aliasName: string;
        };
    };
    getSubMenuConfig(): {
        name: any;
        noIcon: boolean;
        onclick: any;
    }[];
    _getFlagStr(shortKey: any): string;
    $testIsSize(selection: any): boolean;
    $getSizeByShortKey(shortKey: any): any;
    onClick(selection: any, shortKey?: string): string;
}
import MenuBase from '@/toolbars/MenuBase';
