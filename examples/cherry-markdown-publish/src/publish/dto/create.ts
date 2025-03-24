import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Article, ContentType, PlatformTarget } from '../sdk';
import { Type } from 'class-transformer';

export class PublishArticleDto implements Article {
  /**
   * 文章标题
   */
  @IsString()
  @IsNotEmpty({ message: '文章标题不能为空' })
  title: string;

  /**
   * 文章摘要，不传则由平台处理
   */
  @IsOptional()
  digest: string;

  /**
   * 文章内容(html)
   */
  @IsString()
  @IsNotEmpty({ message: '文章内容不能为空' })
  content: string;

  /**
   * 文章作者
   */
  @IsOptional()
  @IsString()
  author?: string;
}

export class CreatePublishDto {
  /**
   * 发布目标平台
   */
  // @IsNotEmpty({ message: 'target 字段不能为空' })
  @IsEnum(PlatformTarget)
  target: PlatformTarget;

  /**
   * 文章内容类型
   */
  @IsEnum(ContentType)
  contentType: ContentType;

  /**
   * 是否需要内联样式
   */
  @IsBoolean({ message: 'needInlineStyle 只能是boolean类型的值' })
  needInlineStyle?: boolean;

  /**
   * 文章列表
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublishArticleDto)
  articles: PublishArticleDto[];
}
