import * as vscode from 'vscode';
import {
  UploadType,
  // eslint-disable-next-line no-unused-vars
  // CustomUploader,
  BackfillImageProps,
  BackfillImage,
} from '../types';
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

  const UploadType = vscode.workspace
    .getConfiguration('cherryMarkdown')
    .get<UploadType>('UploadType');

  const res: UploadFileHandlerRes = { name, url: '' };

  const BackfillImageProps = vscode.workspace
    .getConfiguration('cherryMarkdown')
    .get<BackfillImageProps>('BackfillImageProps', []);

  // eslint-disable-next-line no-param-reassign
  BackfillImageProps.reduce((prev, curr) => ((prev[curr] = true), prev), res);

  switch (UploadType) {
    case 'CustomUploader':
      // const CustomUploader = vscode.workspace
      //   .getConfiguration('cherryMarkdown')
      //   .get<CustomUploader>('CustomUploader');

      // if (CustomUploader?.enable !== true) {
      //   vscode.window.showInformationMessage('请完善自定义上传配置');
      //   throw new Error('请完善自定义上传配置');
      // }
      // if (/^(http|https):\/\//.test(CustomUploader.url) == false) {
      //   vscode.window.showInformationMessage('自定义上传地址格式不正确');
      //   throw new Error('自定义上传地址格式不正确');
      // }
      // const file = await vscode.workspace.fs.readFile(vscode.Uri.file(path));
      // // 将file上传到自定义的地址
      // // 这里涉及到一些上传服务需要签名校验，并且响应体格式不一致，这里要再讨论
      // const customUpload = await axios.post(CustomUploader.url, file);
      vscode.window.showInformationMessage('自定义上传暂未开发');
      throw new Error('自定义上传暂未开发');
      break;
    case 'PicGoServer':
      // eslint-disable-next-line no-case-declarations
      const PicGoServer = vscode.workspace.getConfiguration('cherryMarkdown').get<string>('PicGoServer', 'http://127.0.0.1:36677/upload');
      // 请求PicGo服务
      // eslint-disable-next-line no-case-declarations
      const upload = await axios.post<any, AxiosResponse<{ success: boolean; result: string[] }>, { list: string[] } >(PicGoServer, { list: [path] }, { headers: { 'Content-Type': 'application/json' } },);
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
