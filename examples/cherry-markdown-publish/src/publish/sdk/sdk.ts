import { Article, PlatformBasicConfig, PlatformTarget } from './types';

export abstract class PublishSdk<
  PlatformConfig extends PlatformBasicConfig,
  PlatformPayload,
> {
  /**
   * 平台唯一标识
   */
  abstract name: PlatformTarget;

  protected abstract platformConfig: PlatformConfig;

  constructor() {}

  /**
   * 检查配置是否正确
   */
  abstract checkConfig(): Promise<boolean>;

  /**
   * 执行发布
   * @param payload 平台数据
   * @param articles 待发布的文章列表
   * @returns 发布结果 会原封不动的返回给前端
   * @description 此方法要么成功，要么抛出HttpException异常，不能返回失败的结果，抛出异常会被全局异常过滤器捕获并返回给前端，你可以在抛出异常中自定义状态码和错误信息
   */
  abstract publish(payload: PlatformPayload, articles: Article[]): Promise<any>;
}

export class PublishSdkContainer {
  private sdksMap: Map<PlatformTarget, PublishSdk<any, any>> = new Map();

  register<TConfig extends PlatformBasicConfig, TPayload>(
    name: PlatformTarget,
    sdk: PublishSdk<TConfig, TPayload>,
  ) {
    if (this.sdksMap.has(name)) {
      throw new Error(`SDK ${name} already exists`);
    }
    if (sdk.checkConfig()) {
      this.sdksMap.set(name, sdk);
    } else {
      throw new Error(`Invalid config for ${name} SDK`);
    }
  }

  getSDK<TConfig extends PlatformBasicConfig, TPayload>(
    name: PlatformTarget,
  ): PublishSdk<TConfig, TPayload> | undefined {
    return this.sdksMap.get(name) as PublishSdk<TConfig, TPayload>;
  }
}
