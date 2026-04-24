/**
 * 16进制转RGB
 */
export function hexToRgb(hex: any): {
    r: number;
    g: number;
    b: number;
};
/**
 * RGB转16进制
 */
export function rgbToHex(r: any, g: any, b: any): string;
/**
 * RGB转HSV
 */
export function rgbToHsv(red: any, green: any, blue: any): {
    h: number;
    s: number;
    v: number;
};
/**
 * HSV转RGB
 */
export function hsvToRgb(h: any, s: any, v: any): {
    r: number;
    g: number;
    b: number;
};
