/* HabitQuest Bootstrap Entry Point */

import { initUI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing HabitQuest App...');
  initUI();

  // Register Progressive Web App Service Worker for Mobile Offline Support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then((reg) => console.log('PWA Service Worker registered successfully:', reg.scope))
      .catch((err) => console.error('PWA Service Worker registration failed:', err));
  }
});
