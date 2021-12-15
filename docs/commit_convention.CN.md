
## 一、规范意义

作为开源项目，我们的提交规范也要和业界使用[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/ )的规范一致，因此要定制一套符合我们的提交规范。同时，我们还规范开发工作流，以便版本管理和多人协作。

## 二、提交公式

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

- 标题行:  **必填** , 描述主要修改类型和内容，scope增强描述提交作用范围，例如我们cherry的core层、Edior、Previewer等
- 主题内容: 描述为什么修改, 做了什么样的修改, 以及开发的思路； **这里直接引用tapd源码关键字，若没有则不填**
- 页脚注释: 放 Breaking Changes 或 Closed Issues

### 示例

```
fix: 四个空格（2个tab）需识别为代码块

其他补充信息，解释fix 标题

Fixed #10 
Close #10
```

### type 类型如下

```
1.  feat：新功能（feature）
2.  fix：修补 bug
3.  docs：文档（documentation）
4.  style： 格式（不影响代码运行的变动）
5.  refactor：重构（即不是新增功能，也不是修改 bug 的代码变动）
6.  test：增加测试
7.  chore：构建过程或辅助工具的变动
```

### 使用git cz提交(开发者可选方式)

为了方便使用，增加了[commitizen](https://github.com/commitizen/cz-cli)支持，使用[cz-customizable](https://github.com/leonardoanalista/cz-customizable)进行配置。支持使用 `git cz` 替代 `git commit` 。
需全局安装
`npm install commitizen -g`

## 三、自动生成changelog（生成release，为版本发布使用）

**master分支合并新代码** 后生成新版本：
执行指令
`npm run release -- --release-as 1.1.0`

自动生成Change log，生成的文档包括3个部分：

- New features
- Bug fixes
- Breaking changes

每个部分都会罗列相关的 commit ，并且有指向这些 commit 的链接。生成的文档允许手动修改，所以发布前，你还可以添加其他内容。

## 四、版本发布

执行上条release指令后才能执行发布流程：
执行指令
`npm run publish`
