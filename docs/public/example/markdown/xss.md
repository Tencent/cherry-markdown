# 例子
> [Github 地址](https://github.com/Tencent/cherry-markdown){target=_blank}

- [basic](index.html){target=_blank}
- [H5](h5.html){target=_blank}
- [多实例](multiple.html){target=_blank}
- [无 toolbar](notoolbar.html){target=_blank}
- [纯预览模式](preview_only.html){target=_blank}
- [注入](xss.html){target=_blank}
- [API](api.html){target=_blank}
- [图片所见即所得编辑尺寸](img.html){target=_blank}
- [标题自动序号](head_num.html){target=_blank}

<!-- <script>alert('hello')</script> -->

<style>
  div {
    color:red;
  }
</style>
<iframe src="123"></iframe>

<div>
  <h1>需要注意</h1>
  <div>
    会有xss注入风险
    **请在大人陪伴下开启**
  </div>
</div>

```
var cherry = new Cherry({
  id: 'markdown',
  engine: {
    global: {
      // htmlWhiteList: 'iframe|script|style'
      htmlWhiteList: 'ALL'
    },
  },
  value: document.getElementById("demo-val").value,
});
```
