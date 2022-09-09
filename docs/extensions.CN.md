# 拓展

## Markdown 配置

可通过配置 engine 对象来配置 markdown 的解析规则，比如 table 是否可使用 chart（pro 版本可用）

```js
engine: {
    // 自定义语法
    customSyntax: {
        // 'SyntaxClass': SyntaxClass   
        // 名字冲突时强制覆盖内置语法解析器
        // 'SyntaxClass': {             
        //    syntax: SyntaxClass,      
        //    force: true,              
        //    before: 'HOOK_NAME',      
        //    after: 'HOOK_NAME'        
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
    - syntax    `<[SyntaxBase]> hook 构造函数`
    - force     `<[Boolean]> 是否强制覆盖同名 hook`
    - before    `<[String]> hookName，在这个 hook 之前执行`
    - after     `<[String]> hookName，在这个 hook 之后执行`

## 自定义语法

### Markdown.createSyntaxHook( HOOK_NAME, HOOK_TYPE, OPTIONS )

创建自定义的语法 Hook

| 参数      | 类型                               | 描述                                                                     |
| --------- | ---------------------------------- | ------------------------------------------------------------------------ |
| HOOK_NAME | string                             | 语法 Hook 标识名，唯一                                                   |
| HOOK_TYPE | Markdown.constants.HOOKS_TYPE_LIST | 语法 Hook 类型，仅可选 SEN（行内语法）、PAR（段落语法）               |
| OPTIONS   | { Function }                       | 可选操作                                                            |

**options 配置**

| 参数                                                                    | 类型     | 描述                                                        |
| ----------------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| beforeMakeHtml (<br>str: string<br> ): string                           | Function | 生命周期，返回替换后的字符串                                |
| makeHtml (<br>str: string,<br> sentenceMakeFunc: Function<br> ): string | Function | 生命周期，返回替换后的字符串                                |
| afterMakeHtml (<br>str: string<br> ): string                            | Function | 生命周期，返回替换后的字符串                                |
| rule ( ): { reg: RegExp }                                               | Function | 语法 Hook 匹配规则，返回含有类型为 RegExp 的 reg 成员的对象 |
| test (<br>str: string<br>): boolean                                     | Function | 语法匹配操作方法，可自定义匹配方式                          |

#### 基础使用

```Javascript
const CustomHook = Markdown.createSyntaxHook(
    'customHook',
    Markdown.constants.HOOKS_TYPE_LIST.PAR,
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

new Markdown({
    engine: {
        customSyntax: {
            CustomHook: CustomHook
        }
    }
});
```

#### 插入到指定Hook前或后面，只有一个参数会生效，before优先

```Javascript
new Markdown({
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
new Markdown({
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

**options 配置**

| 参数                                                                    | 类型     | 描述                                                        |
| ----------------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| iconName                           | String | 图标类名                               |
| onClick (<br> selection: Function<br> ) | Function | 点击时的回调函数                                |
| shortcutKeys   | Array | 快捷键集合, 用于注册键盘函数，当匹配的快捷键组合命中时，也会调用click函数   |
| subMenuConfig (<br>name: String<br>iconName： String<Br>noIcon: Boolean<Br>onclick: Function ) | Array | 子菜单集合 |
