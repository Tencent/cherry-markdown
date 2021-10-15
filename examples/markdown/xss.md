<script>alert('hello')</script>
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
