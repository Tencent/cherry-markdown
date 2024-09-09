import { useStoreCherry } from "@/store/storeCherry";
import Cherry from "cherry-markdown";
import { CherryOptions } from "cherry-markdown/types/cherry";
import { ipcRenderer } from "electron";
import { onMounted, shallowReactive } from "vue";

/**
 *@description  初始化 CherryMarkdown
 */
const initCherryMarkdown = () => {
  const storeCherry = useStoreCherry();

  const customMenu_fileUpload = Cherry.createMenuHook('文件上传', {
    iconName: '',
  });

  const callbacks = {
    /**
     * 全局的URL处理器
     * @param {string} url 来源url
     * @param {'image'|'audio'|'video'|'autolink'|'link'} srcType 来源类型
     * @returns
     */
    urlProcessor: (url: string, srcType: 'image' | 'audio' | 'video' | 'autolink' | 'link') => url,
    /**
     * 上传文件回调
     */
    fileUpload(file: File, callback: (path: string, arg: { [key: string]: any }) => void) {
      console.log(file)
      const fileUrl = URL.createObjectURL(file)
      console.log('url', fileUrl)
      if (/video/i.test(file.type)) {
        callback(fileUrl, {
          name: `${file.name.replace(/\.[^.]+$/, '')}`,
          poster: '/favicon.ico',
          isBorder: true,
          isShadow: true,
          isRadius: true,
          width: '300px',
          height: 'auto',
        });
      } else {
        callback(fileUrl, { name: `${file.name.replace(/\.[^.]+$/, '')}`, isShadow: true });
      }
    },
    afterChange: (text: string, html: string) => {
      // 是否改变
      ipcRenderer.send('is-text-change')
      storeCherry.cherryMarkdown = text;
      storeCherry.cherryMarkdownHtml = html;
    },
    afterInit: (text: string, html: string) => { },
    beforeImageMounted: (srcProp: string, src: string) => ({ srcProp, src }),
    // 预览区域点击事件，previewer.enablePreviewerBubble = true 时生效
    onClickPreview: (event: Event) => { },
    // 复制代码块代码时的回调
    onCopyCode: (event: Event, code: string) => {
      // 阻止默认的粘贴事件
      // return false;
      // 对复制内容进行额外处理
      return code;
    },
    onExpandCode: (event, code) => {
      // 阻止默认的粘贴事件
      // return false;
      // 对复制内容进行额外处理
      // console.log(event, code);
      return code;
    },
    onUnExpandCode: (event, code) => {
      // 阻止默认的粘贴事件
      // return false;
      // 对复制内容进行额外处理
      // console.log(event, code);
      return code;
    },
    // 获取中文的拼音
    changeString2Pinyin: (string: string) => {
      /**
       * 推荐使用这个组件：https://github.com/liu11hao11/pinyin_js
       *
       * 可以在 ../scripts/pinyin/pinyin_dist.js 里直接引用
       */
      return string;
    },
  };


  /**
   * 默认配置
   */
  const defaultConfig = {
    id: "cherry-markdown",
    // 第三方包
    externals: {
    },
    engine: {
      global: {
        classicBr: false,
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
      syntax: {
        autoLink: {
          enableShortLink: true,
          shortLinkLength: 20,
        },
        list: {
          listNested: false,
          indentSpace: 2, // 默认2个空格缩进
        },
        table: {
          enableChart: false,
        },
        inlineCode: {
          theme: 'red',
        },
        codeBlock: {
          theme: 'dark',
          wrap: true,
          lineNumber: true,
          copyCode: true,
          expandCode: true, // 是否展开代码块
          unExpandCode: true, // 是否展开代码块
          customRenderer: {
          },
          indentedCodeBlock: true,
        },
        emoji: {
          useUnicode: true,
        },
        fontEmphasis: {
          allowWhitespace: false,
        },
        strikethrough: {
          needWhitespace: false,
        },
        mathBlock: {
          engine: 'MathJax',
          src: '',
          plugins: true,
        },
        inlineMath: {
          engine: 'MathJax',
          src: '',
        },
        toc: {
          allowMultiToc: false,
        },
        header: {
          anchorStyle: 'default',
        },
      },
    },
    editor: {
      id: 'code',
      name: 'code',
      autoSave2Textarea: false,
      theme: 'default',
      height: '100%',
      defaultModel: 'edit&preview',
      convertWhenPaste: true,
      codemirror: {
        autofocus: true,
      },
    },
    toolbars: {
      theme: 'dark',
      showToolbar: true,
      toolbar: [
        'bold',
        'italic',
        {
          strikethrough: ['strikethrough', 'underline', 'sub', 'sup', 'ruby',],
        },
        'size',
        '|',
        'color',
        'header',
        '|',
        'drawIo',
        '|',
        {
          ol: ['ol', 'ul', 'checklist',]
        },
        'panel',
        'justify',
        'detail',
        '|',
        'formula',

        {
          insert: ['link', 'hr', 'br', 'code', 'formula', 'toc', 'table', 'ruby'],
        },
        {
          customMenu_fileUpload: ['image', 'audio', 'video', 'pdf', 'word']
        },
        'graph',
        'togglePreview',
        // 'switchModel',
      ],
      toolbarRight: ['fullScreen', '|'],
      bubble: ['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', 'quote', 'ruby', '|', 'size', 'color'], // array or false
      sidebar: ['mobilePreview', 'copy', 'theme'],
      toc: {
        updateLocationHash: false,
        defaultModel: 'pure',
      },
      customMenu: {
        customMenu_fileUpload: customMenu_fileUpload,
      },
    },
    drawioIframeUrl: 'drawio_demo/drawio_demo.html',
    fileUpload: callbacks.fileUpload,
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
      onClickPreview: callbacks.onClickPreview,
      onCopyCode: callbacks.onCopyCode,
      // 展开代码块代码时的回调
      onExpandCode: callbacks.onExpandCode,
      onUnExpandCode: callbacks.onUnExpandCode,
      changeString2Pinyin: callbacks.changeString2Pinyin,
    },
    previewer: {
      dom: false,
      className: 'cherry-markdown',
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
        maxNumPerTime: 2,
        // 不进行懒加载处理的图片数量，如果为0，即所有图片都进行懒加载处理， 如果设置为-1，则所有图片都不进行懒加载处理
        noLoadImgNum: 5,
        autoLoadImgNum: 5,
        maxTryTimesPerSrc: 2,
        // 加载一张图片之前的回调函数，函数return false 会终止加载操作
        beforeLoadOneImgCallback: (img: HTMLImageElement) => true,
        // 加载一张图片失败之后的回调函数
        failLoadOneImgCallback: (img: HTMLImageElement) => { },
        // 加载一张图片之后的回调函数，如果图片加载失败，则不会回调该函数
        afterLoadOneImgCallback: (img: HTMLImageElement) => { },
        // 加载完所有图片后调用的回调函数
        afterLoadAllImgCallback: () => { },
      },
    },
    isPreviewOnly: false,
    autoScrollByCursor: true,
    forceAppend: true,
    locale: 'zh_CN',
  };

  onMounted(() => {
    const cherryInstance = new Cherry(defaultConfig as Partial<CherryOptions>);
    storeCherry.cherry = shallowReactive(cherryInstance)
  })
}

export default initCherryMarkdown;