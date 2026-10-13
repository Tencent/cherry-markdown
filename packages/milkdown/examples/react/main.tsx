import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import 'mathlive/fonts.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing React root element.');

createRoot(root).render(<App />);
