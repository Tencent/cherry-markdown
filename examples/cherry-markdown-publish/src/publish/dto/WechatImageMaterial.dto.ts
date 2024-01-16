import { PlatformTarget } from '@publish/sdk';
import { IsEnum } from 'class-validator';

export class GetWechatImageMaterialDto {
  offset?: number;

  count?: number;

  /**
   * 发布目标平台
   */
  @IsEnum(PlatformTarget)
  target: PlatformTarget;
}
