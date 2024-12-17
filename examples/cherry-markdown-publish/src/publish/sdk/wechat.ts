import { Article, PlatformBasicConfig, PlatformTarget } from './types';
import { PublishSdk } from './sdk';
import { isSupportContentType } from './utils';
import { HttpException } from '@nestjs/common';

interface WechatPublishData {
  media_id: string;
}

export interface WeChatPlatformConfig extends PlatformBasicConfig {
  APPID: string;
  APPSECRET: string;
  /** 暂时的权宜之计 */
  ThumbMediaId: string;
}

interface WeChatAddDraftArticle {
  /** 标题 */
  title: string;
  /** 作者 */
  author?: string;
  /** 图文消息的摘要，仅有单图文消息才有摘要，多图文此处为空。如果本字段为没有填写，则默认抓取正文前54个字  */
  digest?: string;
  /** 图文消息的具体内容，支持HTML标签，必须少于2万字符，小于1M，且此处会去除JS,涉及图片url必须来源 "上传图文消息内的图片获取URL"接口获取。外部图片url将被过滤。 */
  content: string;
  /** 图文消息的原文地址，即点击“阅读原文”后的URL  */
  content_source_url?: string;
  /** 图文消息的封面图片素材id（必须是永久MediaID） */
  thumb_media_id: string;
  /** Uint32 是否打开评论，0不打开(默认)，1打开 */
  need_open_comment?: 0 | 1;
  /** Uint32 是否粉丝才可评论，0所有人可评论(默认)，1粉丝才可评论 */
  only_fans_can_comment?: 0 | 1;
}

interface WeChatAddDraftPayload {
  articles: WeChatAddDraftArticle[];
}

interface WechatArticle extends Article {
  content_source_url?: string;
  thumb_media_id: string;
  need_open_comment: 0 | 1;
  only_fans_can_comment: 0 | 1;
}

interface WechatApiErrorRes {
  errcode?: number;
  errmsg?: string;
}

interface GetAccessTokenRes extends WechatApiErrorRes {
  access_token?: string;
  expires_in?: number;
}

interface Freepublish extends WechatApiErrorRes {
  publish_id?: string;
  msg_data_id?: string;
}

export interface WechatImageMaterial extends WechatApiErrorRes {
  total_count?: number;
  item_count?: number;
  item?: {
    media_id: string;
    name: string;
    update_time: number;
    url: string;
  }[];
}

export class WechatPublishSdk extends PublishSdk<
  WeChatPlatformConfig,
  WechatPublishData
> {
  name = PlatformTarget.WeChat;

  constructor(protected platformConfig: WeChatPlatformConfig) {
    super();
  }

  /**
   * 获取AccessToken
   * @returns
   */
  async getAccessToken(): Promise<string | undefined> {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.platformConfig.APPID}&secret=${this.platformConfig.APPSECRET}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new HttpException('can not fetch wechat api', -1);
    }
    const resJson = (await res.json()) as GetAccessTokenRes;
    if (!resJson?.access_token) {
      throw new HttpException(resJson?.errmsg, resJson?.errcode);
    }
    return resJson?.access_token;
  }

  /**
   * 新建草稿
   * @param accessToken 访问token
   * @param newPostPayload 草稿内容
   * @returns 草稿id
   */
  async addDraft(
    accessToken: string,
    newPostPayload: WeChatAddDraftPayload,
  ): Promise<string | undefined> {
    const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`;
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(newPostPayload),
    });
    if (!res.ok) {
      throw new HttpException('can not fetch wechat api', -1);
    }
    const resJson = (await res.json()) as {
      errcode: number;
      media_id: string;
      errmsg;
    };
    if (!resJson?.media_id) {
      throw new HttpException(resJson?.errmsg, resJson?.errcode);
    }
    return resJson?.media_id;
  }

  async publish(
    payload: WechatPublishData,
    articles: WechatArticle[],
  ): Promise<any> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('Cannot get wechat access token');
    }
    const newPostPayload = {
      articles: articles.map(
        ({
          title,
          digest,
          content,
          thumb_media_id,
          content_source_url = '',
          need_open_comment = 0,
          only_fans_can_comment = 0,
        }) => ({
          title,
          digest,
          content,
          author: 'cherry-markdown',
          content_source_url,
          need_open_comment,
          only_fans_can_comment,
          thumb_media_id: thumb_media_id ?? this.platformConfig.ThumbMediaId,
        }),
      ),
    };
    const draftId = await this.addDraft(accessToken, newPostPayload);
    const publishUrl = `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`;
    const res = await fetch(publishUrl, {
      method: 'POST',
      body: JSON.stringify({
        media_id: draftId,
      }),
    });
    if (!res.ok) {
      throw new HttpException('can not fetch wechat api', -1);
    }
    const resJson = (await res.json()) as Freepublish;
    if (resJson.errmsg) {
      throw new HttpException(resJson?.errmsg, resJson?.errcode);
    }
    return {
      publishId: resJson?.publish_id,
      msgDataId: resJson?.msg_data_id,
    };
  }

  async checkConfig(): Promise<boolean> {
    if (!this.platformConfig?.APPID) {
      throw new Error('The WeChat Platform Config must have APPID');
    }
    if (!this.platformConfig?.APPSECRET) {
      throw new Error('The WeChat Platform Config must have APPSECRET');
    }
    if (!this.platformConfig.ContentType) {
      throw new Error('Any platform must have ContentType');
    }
    if (!this.platformConfig.ThumbMediaId) {
      console.warn('WARN: The WeChat Platform Config must have ThumbMediaId');
    }
    if (!isSupportContentType(this.platformConfig.ContentType)) {
      throw new Error(
        `The WeChat Platform does not support this ContentType: ${this.platformConfig.ContentType}`,
      );
    }
    return true;
  }

  /**
   * 获取微信公众号的图片素材
   * @param offset Offset
   * @param count Count
   * @returns 图片素材列表
   */
  async getAllWechatImageMaterial(offset = 0, count = 20) {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${accessToken}`;
    console.log('2222');
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        type: 'image',
        offset,
        count,
      }),
    });
    if (!res.ok) {
      throw new HttpException('can not fetch wechat api', -1);
    }
    const resJson = (await res.json()) as WechatImageMaterial;
    if (resJson.errmsg) {
      throw new HttpException(resJson?.errmsg, resJson?.errcode);
    }
    return resJson;
  }
}
