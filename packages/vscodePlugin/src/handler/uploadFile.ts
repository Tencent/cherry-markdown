import * as vscode from 'vscode';
import { UploadType, CustomUploader, BackfillImageProps, BackfillImage } from '../types';
import axios, { AxiosResponse } from 'axios';
export interface FileInfo {
  name: string;
  type: string;
  path: string;
  size: number;
}
export interface UploadFileHandlerRes extends BackfillImage {
  name: string;
  url: string;
  poster?: string;
}
export const uploadFileHandler = async (fileInfo: FileInfo): Promise<UploadFileHandlerRes> => {
  const { name = '', type = '', path = '' } = fileInfo;
  const uploadType = vscode.workspace.getConfiguration('cherryMarkdown').get<UploadType>('UploadType');
  const res: UploadFileHandlerRes = { name, url: '' };
  const backfillImageProps = vscode.workspace
    .getConfiguration('cherryMarkdown')
    .get<BackfillImageProps>('BackfillImageProps', []);

  if (Array.isArray(backfillImageProps)) {
    backfillImageProps.forEach((prop) => {
      (res as any)[prop] = true;
    });
  }

  switch (uploadType) {
    case 'CustomUploader': {
      const customUploader = vscode.workspace.getConfiguration('cherryMarkdown').get<CustomUploader>('CustomUploader');
      if (!customUploader || customUploader.enable !== true) {
        vscode.window.showInformationMessage('请完善自定义上传配置');
        throw new Error('请完善自定义上传配置');
      }
      if (!/^(http|https):\/\//.test(customUploader.url)) {
        vscode.window.showInformationMessage('自定义上传地址格式不正确');
        throw new Error('自定义上传地址格式不正确');
      }
      const file = await vscode.workspace.fs.readFile(vscode.Uri.file(path));
      const userHeaders =
        customUploader.headers && typeof customUploader.headers === 'object' ? customUploader.headers : {};
      const headers: Record<string, string> = { ...userHeaders };
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/octet-stream';
      }
      if (!headers['X-File-Name'] && !headers['x-file-name']) {
        headers['X-File-Name'] = name;
      }
      try {
        const customUpload = await axios.post(customUploader.url, file, { headers, responseType: 'json' });
        const { data } = customUpload;
        if (!data) {
          throw new Error('Empty response from uploader');
        }
        if (typeof data === 'string') {
          res.url = data;
        } else if (data.url) {
          res.url = data.url;
        } else if (data.result && Array.isArray(data.result) && data.result[0]) {
          const [firstResult] = data.result;
          res.url = firstResult;
        } else if (data.data && typeof data.data === 'string') {
          res.url = data.data;
        } else if (data.data && data.data.url) {
          res.url = data.data.url;
        } else {
          const firstUrl = Object.values(data).find((v) => typeof v === 'string' && /^(http|data:image)/.test(v));
          if (typeof firstUrl === 'string') {
            res.url = firstUrl;
          }
        }
        if (!res.url) {
          throw new Error('无法从上传响应中解析出 URL');
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`自定义上传失败：${err?.message || err}`);
        throw err;
      }
      break;
    }
    case 'PicGoServer': {
      const picGoServer = vscode.workspace
        .getConfiguration('cherryMarkdown')
        .get<string>('PicGoServer', 'http://127.0.0.1:36677/upload');
      const upload = await axios.post<any, AxiosResponse<{ success: boolean; result: string[] }>>(
        picGoServer,
        { list: [path] },
        { headers: { 'Content-Type': 'application/json' } },
      );
      if (upload.data?.success !== true) {
        throw new Error('上传失败');
      }
      res.url = upload.data?.result?.[0] ?? '';
      break;
    }
    default: {
      if (type.startsWith('image')) {
        const file = await vscode.workspace.fs.readFile(vscode.Uri.file(path));
        const base64 = Buffer.from(file).toString('base64');
        res.url = `data:${type};base64,${base64}`;
      } else {
        vscode.window.showInformationMessage('未指定上传服务时暂时只支持图片');
        throw new Error('未指定上传服务时暂时只支持图片');
      }
      break;
    }
  }
  return res;
};
