
## 一、 Normative implication

As a formal open-source project team, our submission specifications are consistent with the Conventional Commits specifications.

## 二、提交公式

```bash
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

- Title line:  **must be filled** , describe your main modification type and content, scope enhance the description submission scope, such as the Cherry core layer, Edior, Previewer, etc.
- Subject content: describe why you changed, what you had changed and development ideas  **here directly cites to the tapd source code keyword. Don't fill in if you don't have it
- Footer notes:  for Breaking Changes or Closed Issues

### Example

```bash
fix: 四个空格（2个tab）需识别为代码块

其他补充信息，解释fix 标题

Fixed #10 
Close #10
```

### Types are as follows

```bash
1.  feat：新功能（feature）
2.  fix：修补 bug
3.  docs：文档（documentation）
4.  style： 格式（不影响代码运行的变动）
5.  refactor：重构（即不是新增功能，也不是修改 bug 的代码变动）
6.  test：增加测试
7.  chore：构建过程或辅助工具的变动
```

### Use git cz to submit (developer optional method)

We support commitizen support for ease of use, use cz-customizable to configure. Support  git cz instead of git commit. Need install globally npm install commitizen -g

`npm install commitizen -g`

## 三、Automatically generate Change log（generate release for release）

 Generate a new version after **merging the new code in the master branch**: Execute the command:

`npm run release -- --release-as 1.1.0`

Automatically generate Change log，The generated document consists of three parts：

- New features
- Bug fixes
- Breaking changes

Each section will list the related commit, and there are links to those commits. The generated document allows manual modification, so you can add other content before publishing.

## 四、Version release

The release process can only be executed after the previous release instruction is executed:

`npm run publish`
