import { createRoot } from 'react-dom/client';
import 'cherry-markdown/dist/cherry-markdown.css';
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';
import App from './App';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing React root element.');

createRoot(root).render(<App />);
