export enum ContentType {
  HTML = 'html',
  MarkDown = 'markdown',
}

export enum PlatformTarget {
  WeChat = 'wechat',
}

export interface PlatformBasicConfig {
  /**
   * 发布内容类型
   */
  ContentType: ContentType;
}

export interface Article {
  /**
   * 文章标题
   */
  title: string;

  /**
   * 文章作者
   */
  author?: string;

  /**
   * 文章摘要，不传则由平台处理
   */
  digest: string;

  /**
   * 文章内容
   */
  content: string;
}
