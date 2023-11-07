# Api

---

## Cherry

  ::: details  使用
   ```ts
   import Cherry from 'cherry-markdown';
   const cherry = new Cherry();
   cherry.setMarkdown('# welcome to cherry editor!');
   ```
  :::

### 设置内容 -- `setMarkdown`
   -  **content** : `string` 设置的内容
   -  **keepCursor** ?: (默认false) `boolean` 更新内容的时候是否保持光标位置
  
      设置的新内容。
      
       ```ts
          setMarkdown(content,keepCursor=false);
       ```

       等价功能:

      ```ts
         setValue(content,keepCursor=false);
      ```

### 插入内容 -- `insert`
   -  **content** : `string` 插入的内容
   -  **isSelect** ?: (默认false) `boolean` 是否选中刚插入的内容
   -  **anchor** ?: (默认false) `boolean | [x,y]` [x,y] 代表x+1行，y+1字符偏移量，false时会从光标处插入
   -  **focus** ?: (默认true) `boolean` 是否持编辑器处于focus状态，选中编辑器（用户可以继续输入）
  
      插入内容。
      
      ```ts
         insert(content,isSelect=false, anchor=[0, 3], focus=true);
      ```

### 获取markdown -- `getMarkdown`
   - *null*
  
     获取markdown内容。
      
      ```ts
         getMarkdown();
      ```

### 获取html -- `getHtml`
   - **wrapTheme** ?: (默认true) `boolean` 是否在外层包裹主题class
  
     获取渲染后的html内容。
      
      ```ts
         getHtml(wrapTheme=true);
      ```

### 导出文件 -- `export`
   -  **type** ?: (默认'pdf') `'pdf'|'img'|'html'|'markdown'`
   -  **fileName** ?: (默认'') ` string` 默认为当前有内容的第一行内容，第一行内容为空时为'cherry-export.*'
  
      你可以自定义导出的文件名。
      
      ```ts
         export(type='pdf',fileName='');
      ```

### 切换模式 -- `switchModel`
   - type ?: (默认'edit&preview') `'edit&preview' | 'editOnly' | 'previewOnly'`
       - `'edit&preview'` 编辑模式和预览模式同在
       - `'editOnly'` 仅编辑模式
       - `'previewOnly'` 仅预览模式

        切换页面显示模式。
    
      ```ts
         switchModel(type='edit&preview');
      ```

### 获取标题目录 -- `getToc`
   - *null*

       获取由标题组成的目录。
     
      ```ts
         getToc();
      ```

### 获取编辑器对象实例 -- `getCodeMirror`
   - *null*

      获取编辑器对象实例。
    
      ```ts
         getCodeMirror();
      ```

### 获取预览区对象实例 -- `getPreviewer`
   - *null*

      获取预览区对象实例。
    
       ```ts
         getPreviewer();
       ```

### 修改主题 -- `setTheme`
   - theme ?: (默认'default') `string`

      你可以使用 [option.theme](../../cherry/configuration/base.html#theme-编辑器主题配置) 里的 className。
    
       ```ts
         setTheme(theme='default');
       ```

---

## Cherry.engine Api

  ::: details  使用
   ```ts
     ESM1 :
   import Cherry from 'cherry-markdown';
   const cherry = new Cherry();
   cherry.engine.makeHtml('# welcome to cherry editor!');

     ESM2 :
   import CherryEngine from '../dist/cherry-markdown.engine.core.esm';
   const cherryEngineInstance = new CherryEngine();
   const htmlContent = cherryEngineInstance.makeHtml('# welcome to cherry editor!');

     Node:
   const { default: CherryEngine } = require('cherry-markdown/dist/cherry-markdown.engine.core.common');
   const cherryEngineInstance = new CherryEngine();
   const htmlContent = cherryEngineInstance.makeHtml('# welcome to cherry editor!');
   ```
  :::

### 制作html -- `markHtml`
   - markdown : `string`

     将markdown字符串制作成html。
    
       ```ts
        markHtml(markdown);
       ```
       
### 制作markdown -- `makeMarkdown`
   - html : `string`

      将html字符串渲染成markdown。
    
       ```ts
         makeMarkdown(html);
       ```

---

## Cherry.toolbar.toolbarHandlers API

  ::: details  使用
   ```ts
   import Cherry from 'cherry-markdown';
   const cherry = new Cherry();
   cherry.toolbar.toolbarHandlers.bold();
   ```
  :::

### 加粗语法 -- `bold`
   - *nll*

      向cherry编辑器中插入加粗语法。
    
       ```ts
          toolbar.toolbarHandlers.bold();
       ```

### 斜体语法 -- `italic`
   - *nll*

      向cherry编辑器中插入斜体语法。
    
       ```ts
          toolbar.toolbarHandlers.italic();
       ```

### 删除线语法 -- `strikehrough`
   - *nll*

      向cherry编辑器中插入删除线语法。
    
       ```ts
          toolbar.toolbarHandlers.strikehrough();
       ```

### 列表语法 -- `list`
   - type : `'ol'|'ul'|'checklist'|1|2|3|'1'|'2'|'3'`
     - `'ol' | 1 | '1'` : 有序列表
     - `'ul' | 2 | '2'` : 无序列表
     - `'checklist' | 3 | '3'` : 可选列表

      向cherry编辑器中插入有序、无序列表或者checklist语法。
    
      ```ts
         toolbar.toolbarHandlers.list(type);
      ```

### 特定语法 -- `insert`
   - type : `'hr'|'br'|'code'|'formula'|'checklist'|'toc'|'link'|'image'|'video'|'audio'|'normal-table'|'normal-table-row*col'`
     - `hr` : 删除线
     - `br` : 强制换行
     - `code` : 代码块
     - `formula` : 行内公式
     - `checklist` : 检查项
     - `toc` : 目录
     - `link` : 超链接
     - `image` : 图片
     - `video` : 视频
     - `audio` : 音频
     - `normal-table` : 插入3行5列的表格。
     - `normal-table-row*col` : 插入2行(包含表头是3行)4列的表格`(如 normal-table-2*4)`。

      向cherry编辑器中插入特定语法。
    
      ```ts
         toolbar.toolbarHandlers.insert(type);
      ```

### 画图语法 -- `insert`
   - type : `'1'|'2'|'3'|'4'|'5'|'6'|1|2|3|4|5|6|'flow'|'sequence'|'state'|'class'|'pie'|'gantt'`
     - `'flow' | 1 | ('1'` : 流程图
     - `'sequence' | 2 | '2'` : 时序图
     - `'state' | 3 | '3'` : 状态图
     - `'class' | 4 | '4'` : 类图
     - `'pie' | 5 | '5'` : 饼图
     - `'gantt' | 6 | '6'` : 甘特图

     向cherry编辑器中插入画图语法。
    
      ```ts
         toolbar.toolbarHandlers.graph(type);
      ```

### 隐藏工具栏 -- `previewOnly`
   - *nll*

      隐藏工具栏。
    
       ```ts
         toolbar.previewOnly();
       ```

### 显示工具栏 -- `showToolbar`
   - *nll*

      显示工具栏。
    
       ```ts
          toolbar.showToolbar();
       ```