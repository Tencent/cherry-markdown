import { useEffect, useState, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import 'cherry-markdown/dist/cherry-markdown.css';
import Cherry from 'cherry-markdown';
import Title from './components/Title';
import Menu from "./components/Menu";

function App() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [editor, setEditor] = useState<Cherry | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (editorRef.current === null || isInitialized.current) return;
    try {
      // 初始化编辑器
      const config = {
        el: editorRef.current,
        value: '欢迎使用 Cherry Markdown 编辑器',
        callback: {
          afterChange: () => console.log('change'),
        },
      };

      const cherry = new Cherry(config);
      setEditor(cherry);
      isInitialized.current = true;
    } catch (error) {
      console.error('初始化 Cherry 编辑器失败', error);
    }
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

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