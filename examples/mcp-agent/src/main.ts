import { createApp } from 'vue'
import App from './App.vue'

// No `gissen/style.css` import: this app only renders, via GissenRender, and
// never mounts GissenEditor.
createApp(App).mount('#app')
