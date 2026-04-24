## 引入cherry并使用自己的[mermaid](https://mermaid.js.org/){target=_blank}
```html
<script src="https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.min.js"></script>
<script src="yourPath/cherry-markdown.core.js"></script>
<script src="yourPath/addons/cherry-code-block-mermaid-plugin.js"></script>
<script>
Cherry.usePlugin(CherryCodeBlockMermaidPlugin, {
  mermaid: window.mermaid,
  mermaidAPI: window.mermaid,
});
var cherryEditor = new Cherry({id: 'markdown'});
</script>
```

## 效果
> 可以使用对应版本mermaid的语法

- 思维导图：
```mermaid
mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid
```
- 统计图
```mermaid
    xychart-beta
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
```
- 计划
```mermaid
journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 3: Me
```
