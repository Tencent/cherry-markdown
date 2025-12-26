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

export const uploadFileHandler = async (fileInfo: FileInfo) => {
  const { name = '', type = '', path = '' } = fileInfo;

  const UploadType = vscode.workspace.getConfiguration('cherryMarkdown').get<UploadType>('UploadType');

  const res: UploadFileHandlerRes = { name, url: '' };

  const BackfillImageProps = vscode.workspace
    .getConfiguration('cherryMarkdown')
    .get<BackfillImageProps>('BackfillImageProps', []);

  // eslint-disable-next-line no-param-reassign
  BackfillImageProps.reduce((prev, curr) => ((prev[curr] = true), prev), res);

  switch (UploadType) {
    case 'CustomUploader':
      // 读取自定义上传配置并执行上传
      const CustomUploader = vscode.workspace
        .getConfiguration('cherryMarkdown')
        .get<CustomUploader>('CustomUploader');

      if (!CustomUploader || CustomUploader.enable !== true) {
        vscode.window.showInformationMessage('请完善自定义上传配置');
        throw new Error('请完善自定义上传配置');
      }
      if (/^(http|https):\/\//.test(CustomUploader.url) === false) {
        vscode.window.showInformationMessage('自定义上传地址格式不正确');
        throw new Error('自定义上传地址格式不正确');
      }

      // 读取文件内容
      const file = await vscode.workspace.fs.readFile(vscode.Uri.file(path));

      // 准备 headers（允许用户在配置中填写 headers 对象）
      const userHeaders = (CustomUploader.headers && typeof CustomUploader.headers === 'object') ? CustomUploader.headers : {};
      const headers: Record<string, string> = { ...userHeaders } as Record<string, string>;

      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/octet-stream';
      }
      // 为接收方提供文件名信息
      if (!headers['X-File-Name'] && !headers['x-file-name']) {
        headers['X-File-Name'] = name;
      }

      // 发送二进制数据到自定义上传地址
      try {
        const customUpload = await axios.post(CustomUploader.url, file, { headers, responseType: 'json' });
        const data = customUpload.data;
        // 支持多种常见返回结构
        if (!data) {
          throw new Error('Empty response from uploader');
        }
        if (typeof data === 'string') {
          res.url = data;
        } else if (data.url) {
          res.url = data.url;
        } else if (data.result && Array.isArray(data.result) && data.result[0]) {
          res.url = data.result[0];
        } else if (data.data && typeof data.data === 'string') {
          res.url = data.data;
        } else if (data.data && data.data.url) {
          res.url = data.data.url;
        } else {
          // 尝试从第一层对象里抓取第一个看起来像 url 的字段
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
    case 'PicGoServer':
      // eslint-disable-next-line no-case-declarations
      const PicGoServer = vscode.workspace
        .getConfiguration('cherryMarkdown')
        .get<string>('PicGoServer', 'http://127.0.0.1:36677/upload');
      // 请求PicGo服务
      // eslint-disable-next-line no-case-declarations
      const upload = await axios.post<any, AxiosResponse<{ success: boolean; result: string[] }>, { list: string[] }>(
        PicGoServer,
        { list: [path] },
        { headers: { 'Content-Type': 'application/json' } },
      );
      if (upload.data?.success !== true) {
        throw new Error('上传失败');
      } else {
        res.url = upload.data?.result?.[0] ?? '';
      }
      break;
    default:
      if (type.startsWith('image')) {
        // 读取图片转为base64
        const file = await vscode.workspace.fs.readFile(vscode.Uri.file(path));
        const base64 = Buffer.from(file).toString('base64');
        res.url = `data:${type};base64,${base64}`;
      } else {
        vscode.window.showInformationMessage('未指定上传服务时暂时只支持图片');
        throw new Error('未指定上传服务时暂时只支持图片');
      }
      break;
  }
  return res;
};
