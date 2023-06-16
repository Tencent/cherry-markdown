# 拓展

## Markdown 配置

可通过配置 engine 对象来配置 Markdown 的解析规则，比如 table 是否可使用 chart（pro 版本可用）

```js
engine: {
  // 自定义语法
  customSyntax: {
    // 名字冲突时强制覆盖内置语法解析器
    // SyntaxClass: {             
    //   syntax: SyntaxClass,      
    //   force: true,              
    //   before: 'HOOK_NAME',      
    //   after: 'HOOK_NAME'        
    // }
  }
}
```

- Key: `customSyntax`
- Description: 自定义语法配置
- Type: ``{ [HOOK_NAME: string]: { [option: string]: any } | boolean }``
- Default: `{}`
- Options:
  - SyntaxClass   `<[String]> hook 名字`
     - syntax      `<[SyntaxBase]> hook 构造函数`
     - force       `<[Boolean]> 是否强制覆盖同名 hook`
     - before      `<[String]> hookName，在这个 hook 之前执行`
     - after       `<[String]> hookName，在这个 hook 之后执行`

## 自定义语法

### Cherry.createSyntaxHook( HOOK_NAME, HOOK_TYPE, OPTIONS )

#### 创建自定义的语法 Hook

| 参数      | 类型                               | 描述                                                                     |
| --------- | ---------------------------------- | ------------------------------------------------------------------------ |
| HOOK_NAME | string                             | 语法 Hook 标识名，唯一                                                   |
| HOOK_TYPE | Cherry.constants.HOOKS_TYPE_LIST | 语法 Hook 类型，仅可选 SEN（行内语法）、PAR（段落语法）               |
| OPTIONS   | { Function }                       | 可选操作                                                            |

#### options 配置

| 参数                                                                    |  类型     | 描述                                                        |
| ----------------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| beforeMakeHtml (<br>str:string<br> ): string                            | Function | 生命周期，返回替换后的字符串                                |
| makeHtml (<br>str:string,<br> sentenceMakeFunc:Function<br> ):string    | Function | 生命周期，返回替换后的字符串                                |
| afterMakeHtml (<br>str:string<br> ): string                             | Function | 生命周期，返回替换后的字符串                                |
| rule ( ): { reg: RegExp }                                               | Function | 语法 Hook 匹配规则，返回含有类型为 RegExp 的 reg 成员的对象 |
| test (<br>str: string<br>):boolean                                      | Function | 语法匹配操作方法，可自定义匹配方式                          |

#### 基础使用

```Javascript
const CustomHook = Cherry.createSyntaxHook(
  'customHook',
  Cherry.constants.HOOKS_TYPE_LIST.PAR,
  {
    makeHtml(str) {
      console.log('hello custom hook');
      return str;
    },
    rule() {
      return { reg: new RegExp() };
    }
  }
);

new Cherry({
  engine: {
    customSyntax: {
      CustomHook: CustomHook
    }
  }
});
```

#### 插入到指定Hook前或后面，只有一个参数会生效，before优先

```Javascript
new Cherry({
  engine: {
    customSyntax: {
      CustomHook: {
        syntax: CustomHook,
        before: 'codeBlock',
        // after: 'codeBlock'
      }
    }
  }
});
```

#### 强制覆盖内置的语法Hook

```Javascript
new Cherry({
  engine: {
    customSyntax: {
      CustomHook: {
        syntax: CustomHook,
        force: true
      }
    }
  }
});
```

## 自定义工具栏

创建自定义的菜单 Hook

| 参数      | 类型                               | 描述                                                                     |
| --------- | ---------------------------------- | ------------------------------------------------------------------------ |
| HOOK_NAME | string                             | 语法 Hook 标识名，唯一                                                   |
| OPTIONS   | { Object }                       | 自定义菜单配置                                                            |

#### options 配置

| 参数                         | 类型     | 描述                           |
| ----------------------------------------------------------------------- | -------- |    --------------------------------- |
| iconName                           | String | 图标类名                               |
| onClick (<br> selection:Function<br> ) | Function | 点击时的回调函数                                |
| shortcutKeys   | Array | 快捷键集合, 用于注册键盘函数，当匹配的快捷键组合命中时，也会调用click函数   |
| subMenuConfig (<br>name:String<br>iconName:String<br>noIcon:Boolean<br>onclick:Function<br>) | Array | 子菜单集合 |

```Javascript
/**
 * 自定义一个语法
 */
const CustomHookA = Cherry.createSyntaxHook('codeBlock', Cherry.constants.HOOKS_TYPE_LIST.PAR, {
  makeHtml(str) {
    console.warn('custom hook', 'hello');
    return str;
  },
  rule(str) {
    const regex = {
      begin: '',
      content: '',
      end: '',
    };
    regex.reg = new RegExp(regex.begin + regex.content + regex.end, 'g');
    return regex;
  },
});
/**
 * 自定义一个自定义菜单
 * 点第一次时，把选中的文字变成同时加粗和斜体
 * 保持光标选区不变，点第二次时，把加粗斜体的文字变成普通文本
 */
const customMenuA = Cherry.createMenuHook('加粗斜体',  {
  iconName: 'font',
  onClick: function(selection) {
    // 获取用户选中的文字，调用getSelection方法后，如果用户没有选中任何文字，会尝试获取光标所在位置的单词或句子
    let $selection = this.getSelection(selection) || '同时加粗斜体';
    // 如果是单选，并且选中内容的开始结束内没有加粗语法，则扩大选中范围
    if (!this.isSelections && !/^\s*(\*\*\*)[\s\S]+(\1)/.test($selection)) {
      this.getMoreSelection('***', '***', () => {
        const newSelection = this.editor.editor.getSelection();
        const isBoldItalic = /^\s*(\*\*\*)[\s\S]+(\1)/.test(newSelection);
        if (isBoldItalic) {
          $selection = newSelection;
        }
        return isBoldItalic;
      });
    }
    // 如果选中的文本中已经有加粗语法了，则去掉加粗语法
    if (/^\s*(\*\*\*)[\s\S]+(\1)/.test($selection)) {
      return $selection.replace(/(^)(\s*)(\*\*\*)([^\n]+)(\3)(\s*)($)/gm, '$1$4$7');
    }
    /**
     * 注册缩小选区的规则
     *    注册后，插入“***TEXT***”，选中状态会变成“***【TEXT】***”
     *    如果不注册，插入后效果为: “【***TEXT***】”
     */
    this.registerAfterClickCb(() => {
      this.setLessSelection('***', '***');
    });
    return $selection.replace(/(^)([^\n]+)($)/gm, '$1***$2***$3');
  }
});
/**
 * 定义一个空壳，用于自行规划cherry已有工具栏的层级结构
 */
const customMenuB = Cherry.createMenuHook('实验室',  {
  iconName: '',
});
/**
 * 定义一个自带二级菜单的工具栏
 */
const customMenuC = Cherry.createMenuHook('帮助中心',  {
  iconName: 'question',
  onClick: (selection, type) => {
    switch(type) {
      case 'shortKey': 
        return `${selection}快捷键看这里: https: //codemirror.net/5/demo/sublime.html`;
      case 'github': 
        return `${selection}我们在这里: https: //github.com/Tencent/cherry-markdown`;
      case 'release': 
        return `${selection}我们在这里: https: //github.com/Tencent/cherry-markdown/releases`;
      default: 
        return selection;
    }
  },
  subMenuConfig: [
    { noIcon: true, name: '快捷键', onclick: (event)=>
      {cherry.toolbar.menus.hooks.customMenuCName.fire(null, 'shortKey')} },
    { noIcon: true, name: '联系我们', onclick: (event)=>
      {cherry.toolbar.menus.hooks.customMenuCName.fire(null, 'github')} },
    { noIcon: true, name: '更新日志', onclick: (event)=>
      {cherry.toolbar.menus.hooks.customMenuCName.fire(null, 'release')} },
  ]
});

// 使用
{
toolbars: {
  toolbar: [
       ...
       customMenuAName,
       customMenuBName,
       customMenuCName
  ],
   customMenu: {
     customMenuAName: customMenuA,
     customMenuBName: customMenuB,
     customMenuCName: customMenuC,
    }, 
}
}

```
