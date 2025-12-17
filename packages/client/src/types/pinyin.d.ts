declare module 'pinyin' {
  export interface PinyinOptions {
    style?: number;
    heteronym?: boolean;
    segment?: boolean;
    group?: boolean;
  }

  export interface PinyinFunction {
    (text: string, options?: PinyinOptions): string[][];
    STYLE_NORMAL: number;
    STYLE_TONE: number;
    STYLE_TONE2: number;
    STYLE_TO3NE: number;
    STYLE_INITIALS: number;
    STYLE_FIRST_LETTER: number;
  }

  export const pinyin: PinyinFunction;
  export default pinyin;
}
