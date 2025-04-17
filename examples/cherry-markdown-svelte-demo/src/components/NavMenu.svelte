<script>
    import  {handleClick}  from './index'
    
    export let items = [
        {
            title: 'Cherry API',
            groupIdx:0,
            children: [
                {
                    title: 'setMarkdown',
                    apiIdx:0,
                },
                {
                    title: 'insert',
                    apiIdx:1,
                },
                {
                    title: 'getMarkdown',
                    apiIdx:2,
                },
                {
                    title: 'getHTML',
                    apiIdx:3,
                },
                {
                    title: 'destroy',
                    apiIdx:4,
                },
                {
                    title: 'resetToolbar',
                    apiIdx:5,
                },
                {
                    title: 'export',
                    apiIdx:6,
                },
                {
                    title: 'switchModel',
                    apiIdx:7,
                },
                {
                    title: 'getToc',
                    apiIdx:8,
                },
                {
                    title: 'getCodeMirror',
                    apiIdx:9,   
                },
                {
                    title: 'getPreviewer',
                    apiIdx:10,
               },
            ]
        },
        {
            title: 'Cherry.Previewer API',
            groupIdx:1,
            children: [
                {
                    title: 'Previewer.scrollTold',
                    apiIdx:0,
                }
            ]
        },
        {
            title: 'Cherry.engine API',
            groupIdx:2,
            children: [
                {
                    title: 'makeHtml',
                    apiIdx:0,
                },
                {
                    title: 'makeMarkdown',
                    apiIdx:1,
                }
            ]
        },
        {
            title: 'Cherry.toolbar.toolbarHandl ers API',
            groupIdx:3,
            children: [
                {
                    title: 'bold',
                    apiIdx:0,
                },
                {
                    title: 'italic',
                    apiIdx:1,
                },
                {
                    title: 'header',
                    apiIdx:2,
                },
                {
                    title: 'strikethrough',
                    apiIdx:3,
                },
                {
                    title: 'list',
                    apiIdx:4,
                },
                {
                    title: 'insert',
                    apiIdx:5,
                },
                {
                    title: 'graph',
                    apiIdx:6,
                },
            ]
        },
    ];

</script>

<div class="navmenu">
    <ul>
        {#each items as item (item.title)}
            <li class="title">
                {item.title}
                {#if item.children.length > 0}
                    <ul>
                        {#each item.children as child (child.title)}
                            <li class="option"><a href="/" on:click={()=>handleClick(item.groupIdx,child.apiIdx)}>{child.title}</a></li>
                        {/each}
                    </ul>
                {/if}
            </li>
        {/each}
    </ul>
</div>


<style>
.navmenu {
    background-color: #f8eeed;
    padding: 0 1rem;
    width: 20%;
    height: 620px;
    max-height: 620px; 
    overflow-y: auto; 
    overflow-x: hidden;
    scrollbar-width: none; 
}

.navmenu ul {
    padding: 0;
}

.title {
    color: #454545;
    text-decoration: none;
    font-weight: bold;
    display: block;
    padding: 0.5rem;
}

.option {
    font-size: 17px;
    color: #454545;
    text-decoration: none;
    font-weight: 350;
    display: block;
    padding: 0.5rem;
}

.option a{
    color: #454545;
    text-decoration: none;
}

.option :hover {
    text-decoration: underline;
    color: #e26862;
}
</style>