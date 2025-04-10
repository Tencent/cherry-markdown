export function transformWechat(rawHtml: string): Promise<string>;
export function platformTransform(htmlStr: string, platform: import('../../types/cherry').SupportPlatform): Promise<string>;
export default platformTransform;
