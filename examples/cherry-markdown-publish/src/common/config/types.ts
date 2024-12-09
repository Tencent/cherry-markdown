import { type WeChatPlatformConfig } from '../../publish/sdk/wechat';

export enum ContentType {
  HTML = 'html',
  MarkDown = 'markdown',
}

export interface WeChatConfig extends WeChatPlatformConfig {}

export interface PublishConfig {
  wechat: WeChatConfig;
}

export interface App {
  prefix: string;
  port: number;
}

export interface Config {
  publishConfig: PublishConfig;
  app: App;
}
