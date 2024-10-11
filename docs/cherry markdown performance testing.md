## 测试方法：

通过对比在各种场景下的页面渲染速度来对比各种markdown插件的性能，我们将测试场景细分为以下三个关键维度：篇幅长短、内容复杂度、以及渲染类型。

<table>
    <tr>
        <td ><strong>维度</td>
        <td><strong>类别</td>
        <td><strong>描述</td>
    </tr>
    <tr>
        <td rowspan="3"><strong>篇幅长短</strong></td>
        <td>1. 10kb以内</td>
        <td>适用于短小文档或文章的快速渲染。</td>
    </tr>
    <tr>
        <td>2. 10kb～100kb</td>
        <td>适用于中等长度文档的渲染，平衡速度与功能。</td>
    </tr>
    <tr>
        <td>3. 100kb以上</td>
        <td>适用于长篇文档，重点测试处理大量数据时的性能。</td>
    </tr>
    <tr>
        <td rowspan="2"><strong>内容复杂度</strong></td>
        <td>1. 纯文本</td>
        <td>仅包含基础文本内容，无额外Markdown语法元素。</td>
    </tr>
    <tr>
        <td>2. 复杂文本</td>
        <td>包含多种Markdown语法元素，如标题、列表、代码块等。</td>
    </tr>
    <tr>
        <td rowspan="2"><strong>渲染类型</strong></td>
        <td>1.浏览</td>
        <td>重点测试文档浏览性能，适用于阅读场景。</td>
    </tr>
	<tr>
	    <td>2. 编辑</td>
	    <td>重点测试文档编辑时的实时渲染性能。</td>
	</tr>
</table>

接下来我们根据**三个维度**设计了**12种不同情景**进行性能测试，**最终根据各种场景下的性能进行打分，并得出最终得分**。

## 测试过程截图

### cherry-markdown

![](https://s2.loli.net/2024/10/11/dGsEy4l9ZpoFAfh.png)
![aad27171186c6361d3aa3250f49b1ac.png](https://s2.loli.net/2024/10/11/KQEPkcpsgCji9DO.png)
![06ac019e8f40c5c37bc6b488748aeaa.png](https://s2.loli.net/2024/10/11/N6o3QFjpveswXfB.png)

![06ac019e8f40c5c37bc6b488748aeaa.png](https://s2.loli.net/2024/10/11/qzlhIn9xUr5TRG1.png)
![0ebbac09b7a03a49feb65ff761f2085.png](https://s2.loli.net/2024/10/11/5OcRHW9AdLI1EiJ.png)
![c56e1850360d996846294d6c1bb9a46.png](https://s2.loli.net/2024/10/11/G5pdYxrQbfTlPDB.png)
![10d0b0b2cd61a029aaa8b85baad1315.png](https://s2.loli.net/2024/10/11/Z8Fg4rO7Pi6f5xv.png)
![](https://s2.loli.net/2024/10/11/Z8Fg4rO7Pi6f5xv.png)
![5eca229b78baf180c871d20e0bf59fe.png](https://s2.loli.net/2024/10/11/nRiN7ckELDsU8Pl.png)
![a93d605d6b1432bf4dcb5d1e58866d1.png](https://s2.loli.net/2024/10/11/F1kZH3Uzrd7gxfI.png)
![](https://s2.loli.net/2024/10/11/F1kZH3Uzrd7gxfI.png)
### tui.editor
![66bc320b8efb40db698513193121612.png](https://s2.loli.net/2024/10/11/mgOVHFt9AKlT3Ms.png)
![cc39dc5f104f0f7375dd9541abb3db5.png](https://s2.loli.net/2024/10/11/phOVUM8xy4PA7Xm.png)
![f4fe19ada922b47a39c75b30fbc87bb.png](https://s2.loli.net/2024/10/11/c2ld4aTgwpmztuI.png)

![f4fe19ada922b47a39c75b30fbc87bb.png](https://s2.loli.net/2024/10/11/M34FQLiTbfa8rgq.png)
![16f75dc83e4d86cf52c5ef129896cc6.png](https://s2.loli.net/2024/10/11/DIfQwKTCd5uNUis.png)

![f216f700e903a2ef7d149a530864971.png](https://s2.loli.net/2024/10/11/7FR3DyXPqfVC4A9.png)

![f216f700e903a2ef7d149a530864971.png](https://s2.loli.net/2024/10/11/vyWXiKtE2hOQYNf.png)
![4c92b574d8659dcf5a3c14fe44a7ae0.png](https://s2.loli.net/2024/10/11/aC6c2NQAwkL95Il.png)
![703f866bea590587e88dc939301a3c2.png](https://s2.loli.net/2024/10/11/G2VIOxPZHtFqm69.png)
![3623e2a173d7753096c17cb29c22a9d.png](https://s2.loli.net/2024/10/11/bMR36FUksVtelgj.png)
![](https://s2.loli.net/2024/10/11/bMR36FUksVtelgj.png)![b188c5d359502d84a9afdb9699007df.png](https://s2.loli.net/2024/10/11/fsdgWaGhMYoFDCb.png)
### Vditor
![154822676f1773c7e04bcd29f2d0464.png](https://s2.loli.net/2024/10/11/rUOlC1ozKqNcIiS.png)
