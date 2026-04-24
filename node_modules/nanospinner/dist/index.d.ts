import type { Colors } from 'picocolors/types';
type Color = keyof Omit<Colors, 'isColorSupported'>;
interface Options {
    stream?: NodeJS.WriteStream;
    frames?: string[];
    interval?: number;
    text?: string;
    color?: Color;
}
export interface Spinner {
    success(opts?: {
        text?: string;
        mark?: string;
        update?: boolean;
    } | string): Spinner;
    error(opts?: {
        text?: string;
        mark?: string;
        update?: boolean;
    } | string): Spinner;
    warn(opts?: {
        text?: string;
        mark?: string;
        update?: boolean;
    } | string): Spinner;
    info(opts?: {
        text?: string;
        mark?: string;
        update?: boolean;
    } | string): Spinner;
    stop(opts?: {
        text?: string;
        mark?: string;
        color?: Color;
        update?: boolean;
    } | string): Spinner;
    start(opts?: {
        text?: string;
        color?: Color;
    } | string): Spinner;
    update(opts: Options | string): Spinner;
    reset(): Spinner;
    clear(): Spinner;
    spin(): Spinner;
    write(str: string, clear?: boolean): Spinner;
    render(): Spinner;
    loop(): Spinner;
    isSpinning(): boolean;
}
export declare function createSpinner(text?: string, opts?: Options): Spinner;
export {};
