## Markdown API

### Markdown.constants

Markdown 编辑器常量

#### Markdown.constants.HOOKS_TYPE_LIST

语法 Hook 类型常量列表

-   Type: `enum`
-   Value: `{ DEFAULT: 'sentence', SEN: 'sentence', PAR: 'paragraph', PAG: 'page' }`

### Markdown.createSyntaxHook( HOOK_NAME, HOOK_TYPE, options )

创建自定义的语法 Hook

| 参数      | 类型                               | 描述                                                                     |
| --------- | ---------------------------------- | ------------------------------------------------------------------------ |
| HOOK_NAME | string                             | 语法 Hook 标识名，唯一                                                   |
| HOOK_TYPE | Markdown.constants.HOOKS_TYPE_LIST | 语法 Hook 类型，仅可选 SEN（行内语法）、PAR（段落语法）、PAG（全局语法） |
| options   | { Function }                       | Hook 方法集合                                                            |

**options 配置**

| 参数                                                                    | 类型     | 描述                                                        |
| ----------------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| beforeMakeHtml (<br>str: string<br> ): string                           | Function | 生命周期，返回替换后的字符串                                |
| makeHtml (<br>str: string,<br> sentenceMakeFunc: Function<br> ): string | Function | 生命周期，返回替换后的字符串                                |
| afterMakeHtml (<br>str: string<br> ): string                            | Function | 生命周期，返回替换后的字符串                                |
| rule ( ): { reg: RegExp }                                               | Function | 语法 Hook 匹配规则，返回含有类型为 RegExp 的 reg 成员的对象 |
| test (<br>str: string<br>): boolean                                     | Function | 语法匹配操作方法，可自定义匹配方式                          |

## 配置

### externals

外部依赖配置

-   Type: `{ [packageName: string]: Object }`
-   Default: `{}`
-   Usage:
    从全局对象引入

```Javascript
new Markdown({
    externals: {
        echarts: window.echarts
    }
});
```

    通过`import`引入

```Javascript
import echarts from 'echarts';

new Markdown({
    externals: {
        echarts
    }
});
```

### engine

markdown 解析引擎配置

#### engine.syntax

编辑器内置语法配置

-   Type: `{ [HOOK_NAME: string]: { [option: string]: any } | boolean }`
-   Default: `{}`
-   Usage:
    禁用特定语法

```Javascript
new Markdown({
    engine: {
        syntax: {
            'sup': false // 禁用上标语法
        }
    }
});
```

    传入配置到特定语法解析器

```Javascript
import EchartsTableEngine from '@addons/core-hooks-table-echarts-plugin';

new Markdown({
    engine: {
        syntax: {
            'table': { // 启用表格生成图表功能
                enableChart: true,
                chartRenderEngine: EchartsTableEngine
            }
        }
    }
});
```

-   `HOOK_NAME`参考列表

| HOOK_NAME    | 描述                            | 语法符号                         |
| ------------ | ------------------------------- | -------------------------------- |
| `autoLink`   | 自动解析文本段落中的`URL`为链接 | 合法 URL                         |
| `blockquote` | 引用区块                        | `> 引用内容`<br>`> 多行输入`     |
| `br`         | 两空行转换为一个换行            | -                                |
| `checkList`  | 任务列表                        | `- [ ] 未勾选`<br>`- [x] 已勾选` |

#### engine.customSyntax

自定义语法配置

-   Type: `{ [CUSTOM_HOOK_NAME: string]: Function<SyntaxBase> | { [option: string]: any } }`
-   Default: `{}`
-   Usage:
    传入一个自定义的语法 Hook

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

    插入到指定Hook前或后面，只有一个参数会生效，before优先

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

    强制覆盖内置的语法Hook

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

##### options
