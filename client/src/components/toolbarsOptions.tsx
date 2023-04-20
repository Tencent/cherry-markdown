import CherryOptions from 'cherry-markdown';
import Cherry from 'cherry-markdown';

/**
 * @desc 自定义导航配置-插入Base
 * @doc [自定义工具栏](https://github.com/Tencent/cherry-markdown/blob/dev/examples/scripts/index-demo.js)
 */
const customMenuInsertBase = () => {
  return Cherry.createMenuHook('插入Base', {
    iconName: '',
  })
}


/**
 * @desc 自定义导航配置-插入Upgrade
 */
const customMenuInsertUpgrade = () => {
  return Cherry.createMenuHook('插入Upgrade', {
    iconName: '',
  })
}
/**
 * @desc 自定义导航配置-上传Upload
 */
const customMenuInsertUpload = () => {
  return Cherry.createMenuHook('上传Upload', {
    iconName: '',
  })
}

/**
 * @desc 自定义导航配置-Tips
 */
const customMenuTips = () => {
  return Cherry.createMenuHook('Tips', {
    iconName: 'question',
    onClick: () => {
      console.log("文档提示,跳转到官方文档")
    },
  })
}

/** 
 * @desc 工具栏区域配置
 */
const toolbarsOptions: CherryOptions['toolbar']= {

    theme: 'light',
    toolbar: [
      'header',
      'bold',
      'italic',
      'strikethrough',
      '|',
      'drawIo',
      '|',
      'ol',
      'ul',
      'checklist',
      '|',
      'color',
      'ruby',
      '|',
      'list',
      {
        customMenuInsertBase: ['link', 'hr', 'br']
      },
      {
        customMenuInsertUpgrade: ['code', 'formula', 'toc', 'table']
      },
      {
        // customMenuInsertUpload: ['image', 'audio', 'video', 'pdf', 'word']
        customMenuInsertUpload: ['image']
      },
      'customMenuTips',

    ],
    customMenu: {
      customMenuInsertBase: customMenuInsertBase(),
      customMenuInsertUpgrade: customMenuInsertUpgrade(),
      customMenuInsertUpload: customMenuInsertUpload(),
      customMenuTips: customMenuTips(),
    }
  }
export {
  toolbarsOptions,
}