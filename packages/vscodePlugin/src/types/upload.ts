// 上传方式（配置值不随 VS Code 显示语言改变）
export type ImageUploadMode = 'workspace' | 'data' | 'remote';

// 自定义上传配置
export interface CustomUploader {
  enable: boolean;
  url: string;
  headers?: Record<string, string>;
}

export interface UploadFileRequest {
  requestId: number;
  name: string;
  type: string;
  path: string;
  size: number;
}

export interface UploadFileResult extends BackfillImage {
  requestId: number;
  name: string;
  url: string;
  poster?: string;
}

// 回填图片附加参数（增加 isNotBorder 支持“无边框”选项）
export type BackfillImageProp = 'isBorder' | 'isNotBorder' | 'isShadow' | 'isRadius';

export type BackfillImageProps = BackfillImageProp[];

export type BackfillImage = Partial<Record<BackfillImageProp, boolean>>;
