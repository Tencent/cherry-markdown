import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WeChatConfig } from '@common/config/types';
import { CreatePublishDto } from './dto/create';
import { PlatformTarget, PublishSdkContainer, WechatPublishSdk } from './sdk';
import { ResultDto } from '@common/dto/result.dto';

@Injectable()
export class PublishService {
  constructor(
    private publishSdkContainer: PublishSdkContainer,
    private configService: ConfigService,
  ) {
    this.publishSdkContainer.register(
      PlatformTarget.WeChat,
      new WechatPublishSdk(
        this.configService.get<WeChatConfig>('publishConfig.wechat'),
      ),
    );
  }

  async publish(payload: CreatePublishDto) {
    const targetPlatform = this.publishSdkContainer.getSDK(payload.target);
    const publishRes = await targetPlatform.publish(null, payload.articles);
    return ResultDto.ok(publishRes);
  }

  async getAllWechatImageMaterial(offset = 0, count = 20) {
    const wechatPlatform = this.publishSdkContainer.getSDK(
      PlatformTarget.WeChat,
    ) as WechatPublishSdk;
    const materialList = await wechatPlatform.getAllWechatImageMaterial(
      offset,
      count,
    );
    return ResultDto.ok(materialList);
  }
}
