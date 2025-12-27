// 上传方式
export type UploadType = 'None' | 'CustomUploader' | 'PicGoServer';

// 自定义上传配置
export interface CustomUploader {
  enable: boolean;
  url: string;
  headers?: Record<string, string>;
}

// 回填图片附加参数（增加 isNotBorder 支持“无边框”选项）
export type BackfillImageProps = Array<'isBorder' | 'isNotBorder' | 'isShadow' | 'isRadius'>;

// 返回类型
// export type BackfillImage = Partial<Record<BackfillImageProps[number], boolean>>;
export type BackfillImage = {
  [_key in BackfillImageProps[number]]?: boolean;
};
