## Syntax Feature

> It supports all common syntax. In addition, we also support some interesting syntaxes

### Feature 1：Image zoom, alignment, reference

`![img #Width # height # alignment] [picture URL or reference]`

Among them, width and height support: absolute pixel value (such as 200px), relative outer container percentage (such as 50%), alignment candidate values ​​are: left-aligned (default), right-aligned (right), centered (center), Floating left and right alignment (float-left/right

#### Show case

![图片尺寸](https://raw.githubusercontent.com/Tencent/cherry-markdown/main/examples/images/feature_image_size.png)

### Feature 2：Generate chart based on table content

![表格图表](https://raw.githubusercontent.com/Tencent/cherry-markdown/main/examples/images/feature_table_chart.png)

-----

### Feature 3：Font color, Font size

![字体样式](https://raw.githubusercontent.com/Tencent/cherry-markdown/main/examples/images/feature_font.png)

------

## Functional Features

### Feature 1：Copy HTML paste into MD syntax

![html转md](https://raw.githubusercontent.com/Tencent/cherry-markdown/main/examples/images/feature_copy.gif)

#### Scenario

- Provide Markdown beginners a way to quickly become familiar with MD syntax
- Provide the caller a method to migrate historical rich text data into markdown data

----

### Feature 2：Classic break& regular break

![br](https://raw.githubusercontent.com/Tencent/cherry-markdown/main/examples/images/feature_br.gif)

#### Scenario

Does the team have a maximum width limit on the markdown source code? One-click switch back to classic line break (only two or more consecutive line break can be regarded as one line feed)

-----

### Feature 3: Multi-cursor editing

![br](https://raw.githubusercontent.com/Tencent/cherry-markdown/main/examples/images/feature_cursor.gif)

#### Scenario

Want to batch modify? You can try multi-cursor editing (shortcut keys, search for multi cursor selection and other functions are under development)

### Feature 4：Image size

![wysiwyg](https://raw.githubusercontent.com/Tencent/cherry-markdown/main/examples/images/feature_image_wysiwyg.gif)

### Feature 5：export

![wysiwyg](https://raw.githubusercontent.com/Tencent/cherry-markdown/main/examples/images/feature_export.png)

-------

## Performance Features

### Local render

>Cherrymarkdown will judge which paragraph the user has changed and only render the changed paragraph, so as to improve the rendering performance during modification

![wysiwyg](https://raw.githubusercontent.com/Tencent/cherry-markdown/main/examples/images/feature_myers.png)

### Local update

>Cherrymarkdown uses the virtual DOM mechanism to locally update the content that needs to be changed in the preview area, which reduces the browser DOM operation and improves the performance of preview content update during modification

![wysiwyg](https://raw.githubusercontent.com/Tencent/cherry-markdown/main/examples/images/feature_vdom.gif)

-------
