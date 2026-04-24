/**
 * 更新内容时保持光标不变
 * @param {Number} pos 光标相对文档开头的偏移量
 * @param {String} oldContent 变更前的内容
 * @param {String} newContent 变更后的内容
 * @returns {Number} newPos 新的光标偏移量
 */
export default function getPosBydiffs(pos: number, oldContent: string, newContent: string): number;
