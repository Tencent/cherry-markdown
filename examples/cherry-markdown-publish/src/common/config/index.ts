import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as yaml from 'js-yaml';
import { Config } from './types';

// 配置文件缩写
const configFileTypeMap = {
  development: 'dev',
  production: 'prod',
  test: 'test',
} as const;

type NODE_ENV = keyof typeof configFileTypeMap;
// 构建环境
const env = (process.env.NODE_ENV ?? 'development') as NODE_ENV;

const filePath = join(__dirname, `${configFileTypeMap[env]}.yaml`);

export default () => {
  return yaml.load(readFileSync(filePath, 'utf-8')) as Config;
};
