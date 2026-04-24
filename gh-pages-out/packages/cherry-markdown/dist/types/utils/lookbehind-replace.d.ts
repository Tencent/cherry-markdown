/**
 * @param {string} str 原始字符串
 * @param {RegExp} regex 正则
 * @param {(...args: any[])=>string} replacer 字符串替换函数
 * @param {boolean} [continuousMatch=false] 是否连续匹配，主要用于需要后向断言的连续语法匹配
 * @param {number} [rollbackLength=1] 连续匹配时，每次指针回退的长度，默认为 1
 */
export function replaceLookbehind(str: string, regex: RegExp, replacer: (...args: any[]) => string, continuousMatch?: boolean, rollbackLength?: number): string;
