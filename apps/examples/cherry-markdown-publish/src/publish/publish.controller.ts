import {
  Body,
  Controller,
  HttpException,
  Post,
  UseFilters,
} from '@nestjs/common';
import { PublishService } from './publish.service';
import { CreatePublishDto } from './dto/create';
import { inlineStyle } from './utils/InlineStyle';
import { PublishSdkExceptionFilter } from '@common/filters/publish-sdk-exception.filter';
import { GetWechatImageMaterialDto } from './dto/WechatImageMaterial.dto';
import { PlatformTarget } from './sdk';
import { ResultDto } from '@common/dto/result.dto';

@Controller('publish')
@UseFilters(PublishSdkExceptionFilter)
export class PublishController {
  constructor(private readonly publishService: PublishService) {}

  @Post()
  publish(@Body() payload: CreatePublishDto) {
    const { needInlineStyle } = payload;
    if (needInlineStyle) {
      payload.articles.forEach((article) => {
        try {
          article.content = inlineStyle(article.content);
        } catch (error) {
          throw new HttpException('非法的HTML内容', 400);
        }
      });
    }
    return this.publishService.publish(payload);
  }

  @Post('getWechatImageMaterial')
  getAllWechatmageMaterial(@Body() payload: GetWechatImageMaterialDto) {
    if (payload?.target !== PlatformTarget.WeChat) {
      return ResultDto.fail(200, '目前只支持获取微信公众号的图片素材');
    }
    return this.publishService.getAllWechatImageMaterial(
      payload.offset,
      payload.count,
    );
  }
}
