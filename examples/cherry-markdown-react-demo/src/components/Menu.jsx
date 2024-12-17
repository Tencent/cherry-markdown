import { useEffect, useRef, useState } from "react"

const Select = ({ options, onChange, selected }) => {
    const [showOptions, setShowOptions] = useState(false);
    return (
        <div className="custom-select-container">
            <div
                className={showOptions ? "custom-select active" : "custom-select"}
                onClick={() => { setShowOptions(prev => !prev); }}
            >
                {options[selected]}
            </div>
            {showOptions && (
                <ul className="custom-option-wrapper">
                    {options.map((option, idx) => {
                        return (
                            <li key={idx}
                                className="custom-option"
                                onClick={() => { onChange(idx); setShowOptions(false); }}
                            >
                                {option}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    );
}

const getFullCode = (code) => `\`\`\`javascript
import { useEffect, useState, useRef } from 'react';
import 'cherry-markdown/dist/cherry-markdown.css';
import Cherry from 'cherry-markdown';
export default () => {
    const editorRef = useRef(null);
    const [cherry, setCherry] = useState(null);
    useEffect(() => {
        if (cherry == null) {
            // 初始化编辑器
            const config = {
                el: editorRef.current,
                value: '',
                callback: {
                    afterChange: (md, html) => console.log('change'),
                },
            };
            const cherryObj = new Cherry(config);
            setCherry(cherryObj);
            // api操作如下
            ${code}
        }
    },[])
    return (<div ref={editorRef} />);
}
\`\`\``

const data = [
    {
        name: "Cherry API", api: [
            {
                name: "setMarkdown", title: `setMarkdown(content:string, keepCursor = false)`,
                desc: `设置内容，直接编辑器中的全部文本。setValue(content:string, keepCursor = false)有同样的功能，keepCursor = true 时更新内容的时候保持光标位置`,
                code: `cherryObj.setMarkdown("初始内容");
setTimeout(()=>{cherryObj.setMarkdown("2秒后替换成的新内容")},2000);`,
                markdown: `# Cherry API
## setMarkdown(content:string, keepCursor = false)
设置内容
${getFullCode(`cherryObj.setMarkdown("初始内容");
            setTimeout(()=>{cherryObj.setMarkdown("2秒后替换成的新内容")},2000);`)}

                    `
            },
            {
                name: "insert",
                title: `insert(content: string, isSelect = false, anchor = false, focus = true)`,
                desc: `插入内容\nisSelect = true 选中刚插入的内容\nanchor = false 在光标处插入内容\nanchor = [1, 3] 在第2行第4个字符处插入内容`,
                code: `cherryObj.insert("在光标处插入内容");
cherryObj.insert("在第二行插入内容，并选中插入的内容", true, [1, 0]);`,
                markdown: `# Cherry API
## insert(content: string, isSelect = false, anchor = false, focus = true)
在光标处或者指定行 + 偏移量插入内容
    > insert(\`content\`, \`isSelect\`, \`anchor\`, \`focus\`)
- \`content\` 被插入的文本
- \`isSelect\` 是否选中刚插入的内容，默认false，不选中
- \`anchor\` [x,y] 代表x+1行，y+1字符偏移量，默认false 会从光标处插入
- \`focus\` 保持编辑器处于focus状态，默认true，选中编辑器（用户可以继续输入）
${getFullCode(`cherryObj.insert("在光标处插入内容");
            cherryObj.insert("在第二行插入内容，并选中插入的内容", true, [1, 0]);`)}`,
            },
            {
                name: "getMarkdown",
                title: `getMarkdown()`,
                desc: `获取markdown内容`,
                code: `alert(cherryObj.getMarkdown());
console.log(cherryObj.getMarkdown());`,
                markdown: `# Cherry API
## getMarkdown()
获取markdown内容
${getFullCode(`alert(cherryObj.getMarkdown());
            console.log(cherryObj.getMarkdown());`)}`,
            },
            {
                name: "getHtml",
                title: `getHtml()`,
                desc: `获取渲染后的html内容`,
                code: `alert(cherryObj.getHtml());
console.log(cherryObj.getHtml());`,
                markdown: `# Cherry API
## getHtml()
获取渲染后的html内容
${getFullCode(`alert(cherryObj.getHtml());
            console.log(cherryObj.getHtml());`)}`,
            },
            {
                name: "destroy",
                title: `destroy()`,
                desc: `销毁函数`,
                code: `cherryObj.destroy();`,
                markdown: `# Cherry API
## destroy()
销毁函数
${getFullCode(`// cherryObj.destroy(); `)}`,
            },
            {
                name: "resetToolbar",
                title: `resetToolbar(type:string, toolbar:array)`,
                desc: `重置工具栏
type 修改工具栏的类型 {'toolbar'|'toolbarRight'|'sidebar'|'bubble'|'float'}
toolbar 工具栏配置`,
                code: `cherryObj.resetToolbar('toolbar', ['bold', 'table']);`,
                markdown: `# Cherry API
## resetToolbar(type:string, toolbar:array)
重置工具栏
type 修改工具栏的类型 {'toolbar'|'toolbarRight'|'sidebar'|'bubble'|'float'}
toolbar 工具栏配置
${getFullCode(`cherryObj.resetToolbar('toolbar', ['bold', 'table']);`)}`,
            },
            {
                name: "export",
                title: `export(type:string)`,
                desc: `导出预览区域的内容，type：{'pdf'|'img'}`,
                code: `if(confirm('导出pdf')) {
  cherryObj.export();
}else if(confirm('导出长图')) {
  cherryObj.export('img');
}`,
                markdown: `# Cherry API
## export(type:string)
导出预览区域的内容，type：{'pdf'|'img'}
${getFullCode(`if(confirm('导出pdf')) {
                cherryObj.export();
            }else if(confirm('导出长图')) {
                cherryObj.export('img');
            }`
                )}`,
            },
            {
                name: "switchModel",
                title: `switchModel(model:string)`,
                desc: `切换模式：{'edit&preview'|'editOnly'|'previewOnly'}`,
                code: `if(confirm('只读模式')) {
  cherryObj.switchModel('previewOnly');
}else if(confirm('纯编辑模式')) {
  cherryObj.switchModel('editOnly');
}else if(confirm('双栏编辑模式')) {
  cherryObj.switchModel('edit&preview');
}`,
                markdown: `# Cherry API
## switchModel(model:string)
切换模式：{'edit&preview'|'editOnly'|'previewOnly'}
${getFullCode(`if(confirm('只读模式')) {
                cherryObj.switchModel('previewOnly');
            }else if(confirm('纯编辑模式')) {
                cherryObj.switchModel('editOnly');
            }else if(confirm('双栏编辑模式')) {
                cherryObj.switchModel('edit&preview');
            }`
                )}`,
            },
            {
                name: "getToc",
                title: `getToc()`,
                desc: `获取由标题组成的目录`,
                code: `alert(cherryObj.getToc());
console.log(cherryObj.getToc());`,
                markdown: `# Cherry API
## getToc()
获取由标题组成的目录
${getFullCode(`alert(cherryObj.getToc());
            console.log(cherryObj.getToc());`)}`,
            },
            {
                name: "getCodeMirror",
                title: `getCodeMirror()`,
                desc: `获取左侧编辑器实例`,
                code: `alert(cherryObj.getCodeMirror());
console.log(cherryObj.getCodeMirror());`,
                markdown: `# Cherry API
## getCodeMirror()
获取左侧编辑器实例
${getFullCode(`alert(cherryObj.getCodeMirror());
            console.log(cherryObj.getCodeMirror());`)}`,
            },
            {
                name: "getPreviewer",
                title: `getPreviewer()`,
                desc: `获取右侧预览区对象实例`,
                code: `alert(cherryObj.getPreviewer());
console.log(cherryObj.getPreviewer());`,
                markdown: `# Cherry API
## getPreviewer()
获取右侧预览区对象实例
${getFullCode(`alert(cherryObj.getPreviewer());
            console.log(cherryObj.getPreviewer());`)}`,
            },

        ],
    },
    {
        name: "Cherry.Previewer API",
        api: [{
            name: "Previewer.scrollToId",
            title: `Previewer.scrollToId(id:string)`,
            desc: `滚动到对应id的元素位置
id 可以为带#号hash，也可以是id值`,
            code: `// 查看可跳转的id
console.log(cherryObj.getToc()); 
// 两种方式都可获得previewer对象
console.log(cherryObj.previewer == cherryObj.getPreviewer()) 
//两种写法都可以
// cherryObj.previewer.scrollToId('#test-scroll');
cherryObj.previewer.scrollToId('test-scroll');`,
            markdown: `# Cherry API
## Previewer.scrollToId(id:string)
滚动到对应id的元素位置
id 可以为带#号hash，也可以是id值
// 查看可跳转的id
${getFullCode(`// 查看可跳转的id
            console.log(cherryObj.getToc()); 
            // 两种方式都可获得previewer对象
            console.log(cherryObj.previewer == cherryObj.getPreviewer()) 
            //  两种写法都可以
            // cherryObj.previewer.scrollToId('#test-scroll');
            cherryObj.previewer.scrollToId('test-scroll');`)}
# Test Scroll`,
        }]
    },
    {
        name: "Cherry.engine API",
        api: [
            {
                name: "makeHtml",
                title: `engine.makeHtml(markdown:string)`,
                desc: `将markdown字符串渲染成Html`,
                code: `alert(cherryObj.engine.makeHtml('This is \`inline code\`'));
console.log(cherryObj.engine.makeHtml('This is \`inline code\`'));`,
                markdown: `# Cherry.engine API
## engine.makeHtml(markdown:string)
将markdown字符串渲染成Html
${getFullCode(`alert(cherryObj.engine.makeHtml('This is \`inline code\`'));
            console.log(cherryObj.engine.makeHtml('This is\`inline code\`'));`)}`,
            },
            {
                name: "makeMarkdown",
                title: `engine.makeMarkdown(html:string)`,
                desc: `将html字符串渲染成markdown`,
                code: `var html = \` < p > This is<code>inline code</code></ >\`;
alert(cherryObj.engine.makeMarkdown(html));
console.log(cherryObj.engine.makeMarkdown(html));`,
                markdown: `# Cherry.engine API
## engine.makeMarkdown(html:string)
将html字符串渲染成markdown
${getFullCode(`var html = \` < p > This is < code > inline code</ ></ >\`;
            alert(cherryObj.engine.makeMarkdown(html));
            console.log(cherryObj.engine.makeMarkdown(html));`)}`,
            },
        ],
    },
    {
        name: "Cherry.toolbar.toolbarHandlers API",
        api: [
            {
                name: "bold",
                title: `toolbar.toolbarHandlers.bold()`,
                desc: `在cherry编辑区域的选定文本处插入加粗语法`,
                code: `cherryObj.toolbar.toolbarHandlers.bold()`,
                markdown: `# Cherry.toolbar.toolbarHandlers API
## toolbar.toolbarHandlers.bold()
在cherry编辑区域的选定文本处插入加粗语法
${getFullCode(`cherryObj.toolbar.toolbarHandlers.bold()`)}`,
            },
            {
                name: "italic",
                title: `toolbar.toolbarHandlers.italic()`,
                desc: `在cherry编辑区域的选定文本处插入斜体语法`,
                code: `cherryObj.toolbar.toolbarHandlers.italic()`,
                markdown: `# Cherry.toolbar.toolbarHandlers API
## toolbar.toolbarHandlers.italic()
在cherry编辑区域的选定文本处插入斜体语法
${getFullCode(`cherryObj.toolbar.toolbarHandlers.italic()`)}`,
            },
            {
                name: "header",
                title: `toolbar.toolbarHandlers.header(level: int)`,
                desc: `在cherry编辑区域的选定文本处插入标题语法`,
                code: `cherryObj.toolbar.toolbarHandlers.header(1)
// cherryObj.toolbar.toolbarHandlers.header(2)
// cherryObj.toolbar.toolbarHandlers.header(4)`,
                markdown: `# Cherry.toolbar.toolbarHandlers API
## toolbar.toolbarHandlers.header(level: int)

在cherry编辑区域的选定文本处插入标题语法

${getFullCode(`cherryObj.toolbar.toolbarHandlers.header(1)
            // cherryObj.toolbar.toolbarHandlers.header(2)
            // cherryObj.toolbar.toolbarHandlers.header(4)`)}`,
            },
            {
                name: "strikethrough",
                title: `toolbar.toolbarHandlers.strikethrough()`,
                desc: `在cherry编辑区域的选定文本处插入删除线语法`,
                code: `cherryObj.toolbar.toolbarHandlers.strikethrough()`,
                markdown: `# Cherry.toolbar.toolbarHandlers API
## toolbar.toolbarHandlers.strikethrough()
在cherry编辑区域的选定文本处插入删除线语法
${getFullCode(`cherryObj.toolbar.toolbarHandlers.strikethrough()`)}`,
            },
            {
                name: "list",
                title: `toolbar.toolbarHandlers.list(type: string)`,
                desc: `在cherry编辑区域的选定文本处插入有序、无序列表或者checklist语法`,
                code: `if(confirm('有序列表')) {
        cherryObj.toolbar.toolbarHandlers.list(1);
    }else if (confirm('无序列表')) {
        cherryObj.toolbar.toolbarHandlers.list('2');
    } else if (confirm('checklist')) {
        cherryObj.toolbar.toolbarHandlers.list(3);
    } `,
                markdown: `# Cherry.toolbar.toolbarHandlers API
## toolbar.toolbarHandlers.list(type: string)
在cherry编辑区域的选定文本处插入有序、无序列表或者checklist语法
| level | 效果 |
|:-:|:-:|
| 1 | ol 列表 |
| 2 | ul 列表 |
| 3 | checklist | 
${getFullCode(`if(confirm('有序列表')) {
                cherryObj.toolbar.toolbarHandlers.list(1);
            }else if (confirm('无序列表')) {
                cherryObj.toolbar.toolbarHandlers.list('2');
            } else if (confirm('checklist')) {
                cherryObj.toolbar.toolbarHandlers.list(3);
            } `)}`,
            },
            {
                name: "insert",
                title: `toolbar.toolbarHandlers.insert(type: string)`,
                desc: `在cherry编辑区域的光标处插入特定语法`,
                code: `if (confirm('插入3*4的表格')) {
    cherryObj.toolbar.toolbarHandlers.insert('normal-table-3*4');
} else if (confirm('插入checklist')) {
    cherryObj.toolbar.toolbarHandlers.insert('checklist');
} `,
                markdown: `# Cherry.toolbar.toolbarHandlers API
## toolbar.toolbarHandlers.insert(type: string)
在cherry编辑区域的光标处插入特定语法：

| type | 效果 |
|:-:|:-:|
| 'hr' | 删除线 |
| 'br' | 强制换行 |
| 'code' | 代码块 |
| 'formula' | 行内公式 |
| 'checklist' | 检查项 |
| 'toc' | 目录 |
| 'link' | 超链接 |
| 'image' | 图片 |
| 'video' | 视频 |
| 'audio' | 音频 |
| 'normal-table' | 插入3行5列的表格 |
| 'normal-table-row*col' | 如 \`normal-table-2*4\` 插入2行(包含表头是3行)4列的表格 |

${getFullCode(`if (confirm('插入3*4的表格')) {
                cherryObj.toolbar.toolbarHandlers.insert('normal-table-3*4');
            } else if (confirm('插入checklist')) {
                cherryObj.toolbar.toolbarHandlers.insert('checklist');
            } `)}`,
            },
            {
                name: "graph",
                title: `toolbar.toolbarHandlers.graph(type:string)`,
                desc: `在cherry编辑区域的光标处插入画图语法`,
                code: `cherryObj.toolbar.toolbarHandlers.graph(1)
// cherryObj.toolbar.toolbarHandlers.graph('2')
// cherryObj.toolbar.toolbarHandlers.graph(4)`,
                markdown: `# Cherry.toolbar.toolbarHandlers API
## toolbar.toolbarHandlers.graph(type:string)
在cherry编辑区域的光标处插入画图语法

|id |效果 |
|:-:|:-:|
|'1' |流程图 |
|'2' |时序图 |
|'3' |状态图 |
|'4' |类图 |
|'5' |饼图 |
|'6' |甘特图 |
\`\`\`mermaid
graph LR
    A[公司] -->| 下 班 | B(菜市场)
    B --> C{看见<br>卖西瓜的}
    C -->|Yes| D[买一个包子]
    C -->|No| E[买一斤包子]
\`\`\`
${getFullCode(`cherryObj.toolbar.toolbarHandlers.graph(1)
            // cherryObj.toolbar.toolbarHandlers.graph('2')
            // cherryObj.toolbar.toolbarHandlers.graph(4)`)}`,
            },
        ]
    }
]

const CodeTextArea = ({ value, onChange }) => {
    const ref = useRef(null);
    useEffect(() => {
        // 高度适应内容
        const resize = () => {
            if (ref.current) {
                ref.current.style.height = 'auto'; // 重置高度
                ref.current.style.height = `${ref.current.scrollHeight}px`; // 设置新高度
            }
        };
        resize();
    }, [value]);
    return (
        <textarea ref={ref} className="code-input" placeholder="请输入可执行的js代码,编辑器对象为'cherryObj'" onChange={e => onChange(e.target.value)} value={value} />
    )
}

export default ({ cherryObj }) => {
    const [selectedGroup, setSelectedGroup] = useState(0);
    const [selectedApi, setSelectedApi] = useState(0);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [code, setCode] = useState("");
    const [allowReset, setAllowReset] = useState(false);
    const handleOptionChange = (groupIdx, apiIdx) => {
        setSelectedGroup(groupIdx);
        setSelectedApi(apiIdx);
        const content = data[groupIdx].api[apiIdx];
        setCode(content.code);
        setDesc(content.desc);
        setTitle(content.title);
        cherryObj.setMarkdown(content.markdown);
    }
    const reset = () => {
        const content = data[selectedGroup].api[selectedApi];
        setCode(content.code);
        cherryObj.setMarkdown(content.markdown);
    }
    const computeAllowReset = () => {
        const content = data[selectedGroup].api[selectedApi];
        const allow = content.name != "resetToolbar" && content.name != "destroy";
        setAllowReset(allow);
        return
    }
    useEffect(() => {
        if (cherryObj) {
            handleOptionChange(selectedGroup, selectedApi);
        }
        computeAllowReset()
    }, [cherryObj, selectedGroup, selectedApi])
    return (
        <div className="menu">
            <div>
                <span>选择例子</span>
                {cherryObj && <>
                    <Select options={data.map(datum => datum.name)} onChange={(idx) => { setSelectedGroup(idx); setSelectedApi(0) }} selected={selectedGroup} />
                    <Select options={data[selectedGroup].api.map(datum => datum.name)} onChange={setSelectedApi} selected={selectedApi} />
                </>}
            </div>
            <h2>{title}</h2>
            <h3>描述</h3>
            <div className="demo-desc">{desc}</div>
            <h3>
                <span>代码示例</span>
                {cherryObj && <>
                    <button className="run-btn" onClick={() => { eval(code); }}>点击执行</button>
                    <button className="run-btn" onClick={reset} disabled={!allowReset}>{allowReset ? "重置" : "请通过刷新恢复"}</button>
                </>}
            </h3>
            <CodeTextArea value={code} onChange={setCode} />
        </div>
    )
}