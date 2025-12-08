import Cherry from 'cherry-markdown';
import { CherryOptions } from 'cherry-markdown/types/cherry';
import { previewOnlySidebar } from '../utils';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import '../utils/pinyin/pinyin_dist.js';

/**
 * ECharts优化导入 - 使用命名空间导入替代默认导入
 * 优点：
 * 1. 更好的TypeScript类型支持
 * 2. 避免版本兼容性问题
 * 3. 支持按需导入echarts功能
 */
import * as echarts from 'echarts';

/**
 * ECharts类型兼容性处理
 * 由于cherry-markdown可能期望特定版本的echarts类型，
 * 这里定义兼容性接口确保类型安全
 */
interface EChartsInstance {
  init: (dom: HTMLElement, theme?: string, opts?: any) => any;
  [key: string]: any;
}

// 确保echarts实例的类型兼容性
const echartsInstance: EChartsInstance = echarts as any;

type CustomConfig = {
  CustomToolbar: {
    CustomMenuType: {
      customMenu_fileUpload: any;
      customMenuChangeModule: any;
    };
  };
};

const cherryConfig: CherryOptions<CustomConfig> = {
  // 第三方包
  externals: {
    // externals
    katex,
    echarts: echartsInstance,
  },
  // chatGpt的openai配置
  openai: {
    apiKey: '', // apiKey
    // proxy: {
    //   host: '127.0.0.1',
    //   port: '7890',
    // }, // http & https代理配置
    ignoreError: false, // 是否忽略请求失败，默认忽略
  },
  // 解析引擎配置
  engine: {
    // 全局配置
    global: {
      // 是否启用经典换行逻辑
      // true：一个换行会被忽略，两个以上连续换行会分割成段落，
      // false： 一个换行会转成<br>，两个连续换行会分割成段落，三个以上连续换行会转成<br>并分割段落
      classicBr: false,
    },
    // 内置语法配置
    syntax: {
      link: {
        /** 生成的<a>标签追加target属性的默认值 空：在<a>标签里不会追加target属性， _blank：在<a>标签里追加target="_blank"属性 */
        target: '_blank',
        /** 生成的<a>标签追加rel属性的默认值 空：在<a>标签里不会追加rel属性， nofollow：在<a>标签里追加rel="nofollow：在"属性*/
        rel: '',
      },
      autoLink: {
        /** 生成的<a>标签追加target属性的默认值 空：在<a>标签里不会追加target属性， _blank：在<a>标签里追加target="_blank"属性 */
        target: '_blank',
        /** 生成的<a>标签追加rel属性的默认值 空：在<a>标签里不会追加rel属性， nofollow：在<a>标签里追加rel="nofollow：在"属性*/
        rel: '',
        /** 是否开启短链接 */
        enableShortLink: true,
        /** 短链接长度 */
        shortLinkLength: 20,
      },
      table: {
        enableChart: true,
        selfClosing: true, // 自动闭合，为true时，当输入第一行table内容时，cherry会自动按表格进行解析
      },
      codeBlock: {
        wrap: true, // 超出长度是否换行，false则显示滚动条
        lineNumber: true, // 默认显示行号
        copyCode: true, // 是否显示“复制”按钮
        editCode: true, // 是否显示“编辑”按钮
        changeLang: true, // 是否显示“切换语言”按钮
        expandCode: true, // 是否展开/收起代码块，当代码块行数大于10行时，会自动收起代码块
        selfClosing: true, // 自动闭合，为true时，当md中有奇数个```时，会自动在md末尾追加一个```
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
        indentedCodeBlock: false,
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
        selfClosing: false, // 自动闭合，为true时，当输入**XXX时，会自动在末尾追加**
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
        engine: 'katex', // katex或MathJax
        src: '',
      },
      inlineMath: {
        engine: 'katex', // katex或MathJax
        src: '',
      },
      toc: {
        /** 默认只渲染一个目录 */
        allowMultiToc: false,
        /** 是否显示自增序号 */
        showAutoNumber: false,
      },
      header: {
        /**
         * 标题的样式：
         *  - default       默认样式，标题前面有锚点
         *  - autonumber    标题前面有自增序号锚点
         *  - none          标题没有锚点
         */
        anchorStyle: 'none',
      },
    },
  },
  editor: {
    id: 'code', // textarea 的id属性值
    name: 'code', // textarea 的name属性值
    autoSave2Textarea: false, // 是否自动将编辑区的内容回写到textarea里
    // 编辑器的高度，默认100%，如果挂载点存在内联设置的height则以内联样式为主
    height: '100%',
    // defaultModel 编辑器初始化后的默认模式，一共有三种模式：1、双栏编辑预览模式；2、纯编辑模式；3、预览模式
    // edit&preview: 双栏编辑预览模式
    // editOnly: 纯编辑模式（没有预览，可通过toolbar切换成双栏或预览模式）
    // previewOnly: 预览模式（没有编辑框，toolbar只显示“返回编辑”按钮，可通过toolbar切换成编辑模式）
    defaultModel: 'edit&preview',
    // 粘贴时是否自动将html转成markdown
    convertWhenPaste: true,
    // 快捷键风格，目前仅支持 sublime 和 vim
    keyMap: 'sublime',
    codemirror: {
      // 是否自动focus 默认为true
      autofocus: true,
      placeholder: '输入文本或「/」开始编辑',
    },
    writingStyle: 'normal', // 书写风格，normal 普通 | typewriter 打字机 | focus 专注，默认normal
    keepDocumentScrollAfterInit: false, // 在初始化后是否保持网页的滚动，true：保持滚动；false：网页自动滚动到cherry初始化的位置
    showFullWidthMark: true, // 是否高亮全角符号 ·|￥|、|：|“|”|【|】|（|）|《|》
    showSuggestList: true, // 是否显示联想框
    maxUrlLength: 200, // url最大长度，超过则自动截断
  },
  toolbars: {
    toolbar: [
      'bold',
      'italic',
      {
        strikethrough: ['strikethrough', 'underline', 'sub', 'sup', 'ruby'],
      },
      'size',
      '|',
      'color',
      'header',
      // '|',
      // 'drawIo',
      '|',
      'ol',
      'ul',
      'checklist',
      'panel',
      'align',
      'detail',
      '|',
      {
        insert: [
          // 'image',
          // 'audio',
          // 'video',
          // 'link',
          'hr',
          'br',
          'code',
          'inlineCode',
          // 'formula',
          'toc',
          'table',
          // 'pdf',
          // 'word',
          // 'file',
        ],
      },
      'formula',
      'image',
      'graph',
      'proTable',
      '|',
      'search',
      'shortcutKey',
      'togglePreview',
    ],
    toolbarRight: ['export', 'changeLocale', '|', 'wordCount'],
    bubble: ['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', 'quote', 'ruby', '|', 'size', 'color'], // array or false
    sidebar: ['mobilePreview', 'copy', 'theme', 'codeTheme'],
    toc: {
      updateLocationHash: false, // 要不要更新URL的hash
      defaultModel: 'full', // pure: 精简模式/缩略模式，只有一排小点； full: 完整模式，会展示所有标题
    },
    customMenu: {},
    config: {
      // 地图表格配置 - 支持自定义地图数据源URL
      mapTable: {
        sourceUrl: [
          // 在线高质量地图数据源（优先，已验证可用）
          'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
          // 本地备用地图数据
          '../utils/data/china.json',
        ],
      },
    },
  },
  // 打开draw.io编辑页的url，如果为空则drawio按钮失效
  drawioIframeUrl: '../utils/drawio/drawio_demo.html',
  // drawio iframe的样式
  drawioIframeStyle: 'border: none;',
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
  /**
   * 上传文件的时候是否开启多选
   */
  multipleFileSelection: {
    video: false,
    audio: false,
    image: false,
    word: false,
    pdf: false,
    file: false,
  },
  previewer: {
    dom: false,
    className: 'cherry-markdown',
    // 是否启用预览区域编辑能力（目前支持编辑图片尺寸、编辑表格内容）
    enablePreviewerBubble: true,
    floatWhenClosePreviewer: false,
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
      // beforeLoadOneImgCallback: (img) => {
      //   return true;
      // },
      // // 加载一张图片失败之后的回调函数
      // failLoadOneImgCallback: (img) => { },
      // // 加载一张图片之后的回调函数，如果图片加载失败，则不会回调该函数
      // afterLoadOneImgCallback: (img) => { },
      // // 加载完所有图片后调用的回调函数
      // afterLoadAllImgCallback: () => { },
    },
  },
  callback: {
    // 把中文变成拼音的回调，当然也可以把中文变成英文、英文变成中文
    changeString2Pinyin: pinyin,
  },
  /** 定义cherry缓存的作用范围，相同nameSpace的实例共享localStorage缓存 */
  nameSpace: 'cherry',
  themeSettings: {
    // 主题列表，用于切换主题
    themeList: [
      { className: 'default', label: '默认' }, // 曾用名：light 明亮
      { className: 'dark', label: '暗黑' },
      { className: 'gray', label: '沉稳' },
      { className: 'abyss', label: '深海' },
      { className: 'green', label: '清新' },
      { className: 'red', label: '热情' },
      { className: 'violet', label: '淡雅' },
      { className: 'blue', label: '清幽' },
    ],
    mainTheme: 'default',
    codeBlockTheme: 'default',
    inlineCodeTheme: 'red', // red or black
  },
  // 预览页面不需要绑定事件
  isPreviewOnly: false,
  // 预览区域跟随编辑器光标自动滚动
  autoScrollByCursor: true,
  // 外层容器不存在时，是否强制输出到body上
  forceAppend: true,
  // The locale Cherry is going to use. Locales live in /src/locales/
  locale: 'zh_CN',
  // Supplementary locales
  locales: {},
  // cherry初始化后是否检查 location.hash 尝试滚动到对应位置
  autoScrollByHashAfterInit: false,
};

/**
 * @description cherryInstance
 */
export const cherryInstance = (() => {
  let _cherryInstance: Cherry | null = null;

  return () => {
    if (!_cherryInstance) {
      _cherryInstance = new Cherry(cherryConfig);
    }
    return _cherryInstance;
  };
})();
