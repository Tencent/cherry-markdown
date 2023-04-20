import { createApp } from 'vue';
import App from './App.vue';
import './samples/node-api';
import "cherry-markdown/dist/cherry-markdown.css";
import './index.css'

createApp(App)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*');
  });
