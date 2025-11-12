import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import './assets/main.css';
import { vAutofocus } from './directives/autofocus';

const app = createApp(App);

app.use(router);
app.directive('autofocus', vAutofocus);

app.mount('#app');
