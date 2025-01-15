/**
 * 将图片转成base64，防止出现由于图片防盗链功能导致图裂的情况
 * @param {string} url 图片的地址
 * @param {Function} [callback] 回调函数，本函数不处理该参数
 * @param {string} [outputFormat]
 * @returns {Promise<string>} img node
 */
function convertImgToBase64(url, callback, outputFormat) {
  return new Promise((resolve) => {
    let canvas = /** @type {HTMLCanvasElement}*/ (document.createElement('CANVAS'));
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
      canvas.height = img.height;
      canvas.width = img.width;
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL(outputFormat || 'image/png');
      resolve(dataURL);
      canvas = null;
    };
    img.src = url;
  });
}

/**
 * 将cherry-markdown渲染的html转换为微信公众号支持的格式
 * @param {string} rawHtml 原始html
 * @returns {Promise<string>} 转换完成的html
 */
export const transformWechat = async (rawHtml) => {
  // 防止echarts标签被转成p时丢失样式
  const figureRegex = /(<figure data-lines=.+?<)div(.+?<\/)div(>.*?<\/figure>)/g;
  let html = rawHtml.replace(figureRegex, (match, prefix, content, suffix) => {
    return `${prefix}p${content}p${suffix}`;
  });
  // 图片转base64，防止无法自动上传
  const imgRegex = /(<img.+?src=")(.+?)(".*?>)/g;
  /** @type {(Promise<string>)[]} */
  const promises = [];
  html.replace(imgRegex, (match, prefix, src) => {
    promises.push(convertImgToBase64(src));
    // 这一步并不需要替换
    return match;
  });
  const urls = await Promise.all(promises);
  // 去掉a标签的href属性，微信公众号不支持
  html = html.replace(/(<a[^>]+)href="[^"]*"/g, '$1');
  // 将预览区域宽度设置为100%
  html = html.replace(/(<div[^>]+style="[^">]*width:\s*)[^";]+(;[^>]*>)/g, '$1100%$2');
  return html.replace(imgRegex, (match, prefix, src, suffix) => prefix + urls.shift() + suffix);
};

/**
 * 将 cherry-markdown 渲染的 html 转换为对应平台支持的格式
 * @param {string} htmlStr html 字符串
 * @param {import('../../types/cherry').SupportPlatform} platform 平台
 */
export const platformTransform = async (htmlStr, platform) => {
  if (typeof htmlStr !== 'string' || !htmlStr) {
    return '';
  }
  switch (platform) {
    case 'wechat':
      return transformWechat(htmlStr);
    default:
      throw new Error('platform not support');
  }
};

export default platformTransform;
