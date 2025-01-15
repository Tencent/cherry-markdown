import { createApp } from "vue";
import App from "./App.vue";
import "cherry-markdown/dist/cherry-markdown.css";
import { createPinia } from 'pinia';

const pinia = createPinia();

const app = createApp(App)
app.use(pinia)
app.mount('#app')
