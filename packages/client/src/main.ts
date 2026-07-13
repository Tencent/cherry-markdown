import { createApp } from 'vue';
import App from './App';
// NOTE: cherry-markdown.css must be imported BEFORE global.css,
// so that our project-wide overrides in global.css have higher cascade priority.
import 'cherry-markdown/dist/cherry-markdown.css';
import './styles/global.css';
import { createPinia } from 'pinia';

const pinia = createPinia();

const app = createApp(App);
app.use(pinia);
app.mount('#app');
