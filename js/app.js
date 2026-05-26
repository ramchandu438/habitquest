/* HabitQuest Bootstrap Entry Point */

import { initUI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing HabitQuest App...');
  initUI();

  // Register Progressive Web App Service Worker for Mobile Offline Support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then((reg) => {
        console.log('PWA Service Worker registered successfully:', reg.scope);
        
        // Dynamic live cache update reloader
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New app updates installed! Hot-reloading client layout...');
              window.location.reload();
            }
          });
        });
      })
      .catch((err) => console.error('PWA Service Worker registration failed:', err));
  }
});
