/**
 * 提取alt部分的扩展属性
 * @param {string} alt 图片引用中的alt部分
 * @returns
 */
export function processExtendAttributesInAlt(alt) {
  const attrRegex = /#([0-9]+(px|em|pt|pc|in|mm|cm|ex|%)|auto)/g;
  const info = alt.match(attrRegex);
  if (!info) {
    return '';
  }
  let extendAttrs = '';
  const [width, height] = info;
  if (width) {
    extendAttrs = ` width="${width.replace(/[ #]*/g, '')}"`;
  }
  if (height) {
    extendAttrs += ` height="${height.replace(/[ #]*/g, '')}"`;
  }
  return extendAttrs;
}

/**
 * 提取alt部分的扩展样式
 * @param {string} alt 图片引用中的alt部分
 * @returns
 */
export function processExtendStyleInAlt(alt) {
  const styleRegex = /#(center|right|left|float-right|float-left|border|shadow)/i;
  const info = alt.match(styleRegex);
  if (!info) {
    return '';
  }
  let extendStyles = '';
  const [, alignment] = info;
  switch (alignment) {
    case 'center':
      extendStyles += 'transform:translateX(-50%);margin-left:50%;display:block;';
      break;
    case 'right':
      extendStyles += 'transform:translateX(-100%);margin-left:100%;margin-right:-100%;display:block;';
      break;
    case 'left':
      extendStyles += 'transform:translateX(0);margin-left:0;display:block;';
      break;
    case 'float-right':
      extendStyles += 'float:right;transform:translateX(0);margin-left:0;display:block;';
      break;
    case 'float-left':
      extendStyles += 'float:left;transform:translateX(0);margin-left:0;display:block;';
      break;
    case 'border':
      extendStyles += 'border:1px solid #dfe6ee;';
      break;
    case 'shadow':
      extendStyles += 'box-shadow:0 2px 15px -5px rgb(0 0 0 / 50%);';
      break;
  }
  return extendStyles;
}
