declare module 'vue3-google-login';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import vue3GoogleLogin from 'vue3-google-login'
import './assets/main.css';

import { vAutofocus } from './directives/autofocus';
import { vAuthVisible } from './directives/authVisible';

const app = createApp(App);

app.use(vue3GoogleLogin, {
  clientId: '820460508241-0u6sfjrf59vqlbbsuo6p4515hna1p11b.apps.googleusercontent.com'
});

app.use(router);

// Global directives
app.directive('autofocus', vAutofocus);
app.directive('auth-visible', vAuthVisible);

app.mount('#app');
