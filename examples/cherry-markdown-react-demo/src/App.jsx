import { useEffect, useState, useRef } from 'react';
import './App.css';
import Header from './components/Header'
import 'cherry-markdown/dist/cherry-markdown.css';
import Cherry from 'cherry-markdown';
import Title from './components/Title';
import Menu from "./components/Menu";

function App() {
  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);
  useEffect(() => {
    if (editor == null) {
      // 初始化编辑器
      const config = {
        el: editorRef.current,
        value: '',
        callback: {
          afterChange: (md, html) => console.log('change'),
        },
      };
      setEditor(new Cherry(config));
    }
  }, []);
  return (
    <>
      <Header />
      <main>
        <div className='main-wrapper'>
          <Title />
          <Menu cherryObj={editor} />
          {/* 该div作为编辑器的最外层容器 */}
          <div ref={editorRef} id="markdown-container" />
        </div>
      </main>
    </>
  );
}

export default App;