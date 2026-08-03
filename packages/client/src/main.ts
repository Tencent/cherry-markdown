import { createApp } from 'vue';
import App from './App';
// IMPORTANT: CodeMirror 6 injects its styles at runtime via StyleModule when the
// editor bundle is executed. In `vite build`, all statically-imported .css files
// are merged into a single stylesheet that is loaded BEFORE any JS runs, which
// means CodeMirror's styles end up injected AFTER cherry-markdown.css and our
// global.css — the exact opposite of the `vite dev` behavior.
//
// To keep the cascade order consistent (CodeMirror → cherry-markdown → global)
// in both dev and build, we import these two stylesheets as raw strings via
// Vite's `?inline` query and append them to <head> at runtime. Runtime <style>
// tags are always placed after CodeMirror's injected styles, so our overrides
// stay authoritative.
import cherryMarkdownCss from 'cherry-markdown/dist/cherry-markdown.css?inline';
import globalCss from './styles/global.css?inline';
import { createPinia } from 'pinia';

// Side-effect: register Milkdown adapter so switching engine via StatusBar
// can boot a real Milkdown editor. Placed after the CSS injection so that
// Milkdown's own theme stylesheet (imported inside the adapter) applies
// on top of the cherry/global cascade.
import './components/composables/milkdownAdapter';

function injectStyle(css: string, id: string) {
  const style = document.createElement('style');
  style.setAttribute('data-inject-id', id);
  style.textContent = css;
  document.head.appendChild(style);
}

// Order matters: cherry first, then global (global overrides cherry).
injectStyle(cherryMarkdownCss, 'cherry-markdown');
injectStyle(globalCss, 'client-global');

const pinia = createPinia();

const app = createApp(App);
app.use(pinia);
app.mount('#app');
