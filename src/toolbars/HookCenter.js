/**
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * 工具栏各个实例的注册中心
 */
import Bold from './hooks/Bold';
import Italic from './hooks/Italic';
import Split from './hooks/Split';
import Strikethrough from './hooks/Strikethrough';
import Sub from './hooks/Sub';
import Sup from './hooks/Sup';
import Color from './hooks/Color';
import Header from './hooks/Header';
import Insert from './hooks/Insert';
import List from './hooks/List';
import Graph from './hooks/Graph';
import Size from './hooks/Size';
import CheckList from './hooks/CheckList';
import H1 from './hooks/H1';
import H2 from './hooks/H2';
import H3 from './hooks/H3';
import Quote from './hooks/Quote';
import QuickTable from './hooks/QuickTable';
import TogglePreview from './hooks/TogglePreview';
import FullScreen from './hooks/FullScreen';
import Undo from './hooks/Undo';
import Redo from './hooks/Redo';
import Code from './hooks/Code';
import CodeTheme from './hooks/CodeTheme';
import Export from './hooks/Export';
import Settings from './hooks/Settings';
import Underline from './hooks/Underline';
import SwitchModel from './hooks/SwitchModel';
import Image from './hooks/Image';
import Audio from './hooks/Audio';
import Video from './hooks/Video';
import Br from './hooks/Br';
import Hr from './hooks/Hr';
import Formula from './hooks/Formula';
import Link from './hooks/Link';
import Table from './hooks/Table';
import Toc from './hooks/Toc';
import LineTable from './hooks/LineTable';
import BarTable from './hooks/BarTable';
import Pdf from './hooks/Pdf';
import Word from './hooks/Word';
import Ruby from './hooks/Ruby';
// Sidebar
import MobilePreview from './hooks/MobilePreview';
import Copy from './hooks/Copy';

// 定义默认支持的工具栏
// 目前不支持按需动态加载
// 如果对CherryMarkdown构建后的文件大小有比较严格的要求，可以根据实际情况删减hook
const HookList = {
  bold: Bold,
  italic: Italic,
  '|': Split,
  strikethrough: Strikethrough,
  sub: Sub,
  sup: Sup,
  header: Header,
  insert: Insert,
  list: List,
  graph: Graph,
  size: Size,
  checklist: CheckList,
  h1: H1,
  h2: H2,
  h3: H3,
  color: Color,
  quote: Quote,
  quickTable: QuickTable,
  togglePreview: TogglePreview,
  code: Code,
  codeTheme: CodeTheme,
  export: Export,
  settings: Settings,
  fullScreen: FullScreen,
  mobilePreview: MobilePreview,
  copy: Copy,
  undo: Undo,
  redo: Redo,
  underline: Underline,
  switchModel: SwitchModel,
  image: Image,
  audio: Audio,
  video: Video,
  br: Br,
  hr: Hr,
  formula: Formula,
  link: Link,
  table: Table,
  toc: Toc,
  lineTable: LineTable,
  barTable: BarTable,
  pdf: Pdf,
  word: Word,
  ruby: Ruby,
};

export default class HookCenter {
  constructor(toolbar) {
    return this.init(toolbar);
  }

  /**
   * 根据配置动态渲染、绑定工具栏
   * @param {any} toolbar 工具栏配置对象
   * @returns
   */
  init(toolbar) {
    const { buttonConfig, editor, customMenu, engine } = toolbar.options;
    // TODO: 去除重复代码
    return buttonConfig.reduce((hookList, item) => {
      if (typeof item === 'string') {
        // 字符串
        if (HookList[item]) {
          hookList.push(new HookList[item](editor, engine, toolbar));
        } else if (customMenu[item]) {
          // TODO: 校验合法性，重名处理
          hookList.push(new customMenu[item](editor, engine, toolbar));
        }
      } else if (typeof item === 'object') {
        const keys = Object.keys(item);
        if (keys.length !== 1) {
          return hookList;
        }
        // 只接受形如{ name: [ subMenu ] }的参数
        const [name] = keys;
        if (HookList[name]) {
          hookList.push(new HookList[name](editor, item[name], engine, toolbar));
        } else if (customMenu[name]) {
          // TODO: 校验合法性，重名处理
          hookList.push(new customMenu[name](editor, item[name], engine, toolbar));
        }
      }
      return hookList;
    }, []);
  }
}
