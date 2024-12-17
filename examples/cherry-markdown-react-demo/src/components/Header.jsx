export default () => {
    return (
        <header>
            <div className="header-wrapper">
                <img src="logo--color.png" className="header-logo" />
                <a href="#" className="header-text">Demo</a>
                <a href="https://github.com/Tencent/cherry-markdown/wiki/%E5%88%9D%E8%AF%86cherry-markdown-%E7%BC%96%E8%BE%91%E5%99%A8" target="_blank" className="header-text">介绍</a>
                <a href="https://tencent.github.io/cherry-markdown/examples/api.html" target="_blank" className="header-text">API文档</a>
                <a href="https://tencent.github.io/cherry-markdown/examples/preview_only.html" target="_blank" className="header-text">Markdown语法</a>
                <a href="https://github.com/Tencent/cherry-markdown" target="_black" className="header-repo-a">
                    <img src="github.svg" className="header-logo" />
                </a>
            </div>
        </header>
    )
}