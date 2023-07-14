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
import cloneDeep from 'lodash/cloneDeep';

const callbacks = {
  /**
   * 全局的URL处理器
   * @param {string} url 来源url
   * @param {'image'|'audio'|'video'|'autolink'|'link'} srcType 来源类型
   * @returns
   */
  urlProcessor: (url, srcType) => url,
  fileUpload(file, callback) {
    if (/video/i.test(file.type)) {
      callback('images/demo-dog.png', {
        name: `${file.name.replace(/\.[^.]+$/, '')}`,
        poster: 'images/demo-dog.png?poster=true',
        isBorder: true,
        isShadow: true,
        isRadius: true,
      });
    } else {
      callback('images/demo-dog.png', { name: `${file.name.replace(/\.[^.]+$/, '')}`, isShadow: true });
    }
  },
  afterChange: (text, html) => {},
  afterInit: (text, html) => {},
  beforeImageMounted: (srcProp, src) => ({ srcProp, src }),
  onClickPreview: (event) => {},
  onCopyCode: (event, code) => {
    // 阻止默认的粘贴事件
    // return false;
    // 对复制内容进行额外处理
    return code;
  },
  // 获取中文的拼音
  changeString2Pinyin: (string) => {
    /**
     * 推荐使用这个组件：https://github.com/liu11hao11/pinyin_js
     *
     * 可以在 ../scripts/pinyin/pinyin_dist.js 里直接引用
     */
    return string;
  },
};

/** @type {Partial<import('~types/cherry').CherryOptions>} */
const defaultConfig = {
  // 第三方包
  externals: {
    // externals
  },
  // 解析引擎配置
  engine: {
    // 全局配置
    global: {
      // 是否启用经典换行逻辑
      // true：一个换行会被忽略，两个以上连续换行会分割成段落，
      // false： 一个换行会转成<br>，两个连续换行会分割成段落，三个以上连续换行会转成<br>并分割段落
      classicBr: false,
      /**
       * 全局的URL处理器
       * @param {string} url 来源url
       * @param {'image'|'audio'|'video'|'autolink'|'link'} srcType 来源类型
       * @returns
       */
      urlProcessor: callbacks.urlProcessor,
      /**
       * 额外允许渲染的html标签
       * 标签以英文竖线分隔，如：htmlWhiteList: 'iframe|script|style'
       * 默认为空，默认允许渲染的html见src/utils/sanitize.js whiteList 属性
       * 需要注意：
       *    - 启用iframe、script等标签后，会产生xss注入，请根据实际场景判断是否需要启用
       *    - 一般编辑权限可控的场景（如api文档系统）可以允许iframe、script等标签
       */
      htmlWhiteList: '',
    },
    // 内置语法配置
    syntax: {
      // 语法开关
      // 'hookName': false,
      // 语法配置
      // 'hookName': {
      //
      // }
      autoLink: {
        /** 是否开启短链接 */
        enableShortLink: true,
        /** 短链接长度 */
        shortLinkLength: 20,
      },
      list: {
        listNested: false, // 同级列表类型转换后变为子级
        indentSpace: 2, // 默认2个空格缩进
      },
      table: {
        enableChart: false,
        // chartRenderEngine: EChartsTableEngine,
        // externals: ['echarts'],
      },
      inlineCode: {
        theme: 'red',
      },
      codeBlock: {
        theme: 'dark', // 默认为深色主题
        wrap: true, // 超出长度是否换行，false则显示滚动条
        lineNumber: true, // 默认显示行号
        copyCode: true, // 是否显示“复制”按钮
        customRenderer: {
          // 自定义语法渲染器
        },
        mermaid: {
          svg2img: false, // 是否将mermaid生成的画图变成img格式
        },
        /**
         * indentedCodeBlock是缩进代码块是否启用的开关
         *
         *    在6.X之前的版本中默认不支持该语法。
         *    因为cherry的开发团队认为该语法太丑了（容易误触）
         *    开发团队希望用```代码块语法来彻底取代该语法
         *    但在后续的沟通中，开发团队发现在某些场景下该语法有更好的显示效果
         *    因此开发团队在6.X版本中才引入了该语法
         *    已经引用6.x以下版本的业务如果想做到用户无感知升级，可以去掉该语法：
         *        indentedCodeBlock：false
         */
        indentedCodeBlock: true,
      },
      emoji: {
        useUnicode: true, // 是否使用unicode进行渲染
      },
      fontEmphasis: {
        /**
         * 是否允许首尾空格
         * 首尾、前后的定义： 语法前**语法首+内容+语法尾**语法后
         * 例：
         *    true:
         *           __ hello __  ====>   <strong> hello </strong>
         *           __hello__    ====>   <strong>hello</strong>
         *    false:
         *           __ hello __  ====>   <em>_ hello _</em>
         *           __hello__    ====>   <strong>hello</strong>
         */
        allowWhitespace: false,
      },
      strikethrough: {
        /**
         * 是否必须有前后空格
         * 首尾、前后的定义： 语法前**语法首+内容+语法尾**语法后
         * 例：
         *    true:
         *            hello wor~~l~~d     ====>   hello wor~~l~~d
         *            hello wor ~~l~~ d   ====>   hello wor <del>l</del> d
         *    false:
         *            hello wor~~l~~d     ====>   hello wor<del>l</del>d
         *            hello wor ~~l~~ d     ====>   hello wor <del>l</del> d
         */
        needWhitespace: false,
      },
      mathBlock: {
        engine: 'MathJax', // katex或MathJax
        src: '',
        plugins: true, // 默认加载插件
      },
      inlineMath: {
        engine: 'MathJax', // katex或MathJax
        src: '',
      },
      toc: {
        /** 默认只渲染一个目录 */
        allowMultiToc: false,
      },
      header: {
        /**
         * 标题的样式：
         *  - default       默认样式，标题前面有锚点
         *  - autonumber    标题前面有自增序号锚点
         *  - none          标题没有锚点
         */
        anchorStyle: 'default',
      },
    },
  },
  editor: {
    id: 'code', // textarea 的id属性值
    name: 'code', // textarea 的name属性值
    autoSave2Textarea: false, // 是否自动将编辑区的内容回写到textarea里
    theme: 'default', // depend on codemirror theme name: https://codemirror.net/demo/theme.htm
    // 编辑器的高度，默认100%，如果挂载点存在内联设置的height则以内联样式为主
    height: '100%',
    // defaultModel 编辑器初始化后的默认模式，一共有三种模式：1、双栏编辑预览模式；2、纯编辑模式；3、预览模式
    // edit&preview: 双栏编辑预览模式
    // editOnly: 纯编辑模式（没有预览，可通过toolbar切换成双栏或预览模式）
    // previewOnly: 预览模式（没有编辑框，toolbar只显示“返回编辑”按钮，可通过toolbar切换成编辑模式）
    defaultModel: 'edit&preview',
    // 粘贴时是否自动将html转成markdown
    convertWhenPaste: true,
    codemirror: {
      // 是否自动focus 默认为true
      autofocus: true,
    },
    writingStyle: 'normal', // 书写风格，normal 普通 | typewriter 打字机 | focus 专注，默认normal
  },
  toolbars: {
    theme: 'dark', // light or dark
    showToolbar: true, // false：不展示顶部工具栏； true：展示工具栏; toolbars.showToolbar=false 与 toolbars.toolbar=false 等效
    toolbar: [
      'bold',
      'italic',
      'strikethrough',
      '|',
      'color',
      'header',
      'ruby',
      '|',
      'list',
      'panel',
      // 'justify', // 对齐方式，默认不推荐这么“复杂”的样式要求
      'detail',
      {
        insert: [
          'image',
          'audio',
          'video',
          'link',
          'hr',
          'br',
          'code',
          'formula',
          'toc',
          'table',
          'line-table',
          'bar-table',
          'pdf',
          'word',
        ],
      },
      'graph',
      'settings',
    ],
    toolbarRight: [],
    sidebar: [],
    bubble: ['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', 'quote', '|', 'size', 'color'], // array or false
    float: ['h1', 'h2', 'h3', '|', 'checklist', 'quote', 'table', 'code'], // array or false
  },
  // 打开draw.io编辑页的url，如果为空则drawio按钮失效
  drawioIframeUrl: '',
  // 上传文件的回调
  fileUpload: callbacks.fileUpload,
  /**
   * 上传文件的时候用来指定文件类型
   */
  fileTypeLimitMap: {
    video: 'video/*',
    audio: 'audio/*',
    image: 'image/*',
    word: '.doc,.docx',
    pdf: '.pdf',
    file: '*',
  },
  callback: {
    afterChange: callbacks.afterChange,
    afterInit: callbacks.afterInit,
    beforeImageMounted: callbacks.beforeImageMounted,
    // 预览区域点击事件，previewer.enablePreviewerBubble = true 时生效
    onClickPreview: callbacks.onClickPreview,
    // 复制代码块代码时的回调
    onCopyCode: callbacks.onCopyCode,
    // 把中文变成拼音的回调，当然也可以把中文变成英文、英文变成中文
    changeString2Pinyin: callbacks.changeString2Pinyin,
  },
  previewer: {
    dom: false,
    className: 'cherry-markdown',
    // 是否启用预览区域编辑能力（目前支持编辑图片尺寸、编辑表格内容）
    enablePreviewerBubble: true,
    /**
     * 配置图片懒加载的逻辑
     * - 如果不希望图片懒加载，可配置成 lazyLoadImg = {noLoadImgNum: -1}
     * - 如果希望所有图片都无脑懒加载，可配置成 lazyLoadImg = {noLoadImgNum: 0, autoLoadImgNum: -1}
     * - 如果一共有15张图片，希望：
     *    1、前5张图片（1~5）直接加载；
     *    2、后5张图片（6~10）不论在不在视区内，都无脑懒加载；
     *    3、其他图片（11~15）在视区内时，进行懒加载；
     *    则配置应该为：lazyLoadImg = {noLoadImgNum: 5, autoLoadImgNum: 5}
     */
    lazyLoadImg: {
      // 加载图片时如果需要展示loading图，则配置loading图的地址
      loadingImgPath: '',
      // 同一时间最多有几个图片请求，最大同时加载6张图片
      maxNumPerTime: 2,
      // 不进行懒加载处理的图片数量，如果为0，即所有图片都进行懒加载处理， 如果设置为-1，则所有图片都不进行懒加载处理
      noLoadImgNum: 5,
      // 首次自动加载几张图片（不论图片是否滚动到视野内），autoLoadImgNum = -1 表示会自动加载完所有图片
      autoLoadImgNum: 5,
      // 针对加载失败的图片 或 beforeLoadOneImgCallback 返回false 的图片，最多尝试加载几次，为了防止死循环，最多5次。以图片的src为纬度统计重试次数
      maxTryTimesPerSrc: 2,
      // 加载一张图片之前的回调函数，函数return false 会终止加载操作
      beforeLoadOneImgCallback: (img) => {
        return true;
      },
      // 加载一张图片失败之后的回调函数
      failLoadOneImgCallback: (img) => {},
      // 加载一张图片之后的回调函数，如果图片加载失败，则不会回调该函数
      afterLoadOneImgCallback: (img) => {},
      // 加载完所有图片后调用的回调函数
      afterLoadAllImgCallback: () => {},
    },
  },
  /**
   * 配置主题，第三方可以自行扩展主题
   */
  theme: [
    { className: 'default', label: '默认' },
    { className: 'dark', label: '暗黑' },
    { className: 'light', label: '明亮' },
    { className: 'green', label: '清新' },
    { className: 'red', label: '热情' },
    { className: 'violet', label: '淡雅' },
  ],
  // 预览页面不需要绑定事件
  isPreviewOnly: false,
  // 预览区域跟随编辑器光标自动滚动
  autoScrollByCursor: true,
  // 外层容器不存在时，是否强制输出到body上
  forceAppend: true,
  // The locale Cherry is going to use. Locales live in /src/locales/
  locale: 'zh_CN',
};

export default cloneDeep(defaultConfig);
