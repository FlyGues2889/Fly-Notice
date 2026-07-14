import { createApp } from 'vue';
import App from './App.vue';
import './assets/index.css';
import { Window } from '@tauri-apps/api/window';
import i18n from './i18n';

const app = createApp(App);
app.use(i18n);
app.mount('#root');

try {
  let appWindow: any;
  try {
    appWindow = new Window('main');
  } catch (e) {
    // Fallback object to prevent crashing in browser previews
    appWindow = {
      minimize: () => console.log('Tauri Minimize clicked (Tauri API not present)'),
      toggleMaximize: () => console.log('Tauri Maximize clicked (Tauri API not present)'),
      close: () => console.log('Tauri Close clicked (Tauri API not present)')
    };
  }

  // Bind event listeners using a small timeout so Vue has finished mounting the DOM
  setTimeout(() => {
    document
      .getElementById('titlebar-minimize')
      ?.addEventListener('click', () => appWindow.minimize());
    document
      .getElementById('titlebar-maximize')
      ?.addEventListener('click', () => appWindow.toggleMaximize());
    document
      .getElementById('titlebar-close')
      ?.addEventListener('click', () => {
        appWindow.close();
      });
  }, 100);
} catch (error) {
  console.warn('Tauri window controls initialization failed:', error);
}

