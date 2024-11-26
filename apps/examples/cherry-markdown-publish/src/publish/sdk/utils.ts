import { ContentType } from './types';

/**
 * 判断是否支持的内容类型
 * @param contentType 内容类型
 * @returns 是否支持
 */
export function isSupportContentType(
  contentType: string,
): contentType is keyof typeof ContentType {
  return contentType in ContentType;
}
