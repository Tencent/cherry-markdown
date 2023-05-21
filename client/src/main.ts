import { createApp } from 'vue';
import App from './App.vue';
import './samples/node-api';
import "cherry-markdown/dist/cherry-markdown.css";
import './index.css'
import { createPinia } from 'pinia';

const pinia = createPinia()

createApp(App).use(pinia)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*');
  });
