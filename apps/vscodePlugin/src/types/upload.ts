// 上传方式
export type UploadType = 'None' | 'CustomUploader' | 'PicGoServer';

// // 自定义请求
// export interface CustomUploader {
//   enable: boolean;
//   url: string;
//   headers: HeadersInit;
// }

// 回填图片附加参数
export type BackfillImageProps = Array<'isBorder' | 'isShadow' | 'isRadius'>;

// 返回类型
// export type BackfillImage = Partial<Record<BackfillImageProps[number], boolean>>;
export type BackfillImage = {
  [_key in BackfillImageProps[number]]?: boolean;
};
