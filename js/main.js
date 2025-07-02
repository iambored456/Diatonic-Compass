// (file path: js/main.js)
import App from './app.js';

// Ensure the DOM is fully loaded before initializing the app
document.addEventListener('DOMContentLoaded', () => {
  const mainContainer = document.querySelector('.main-container');
  if (mainContainer) {
    new App(mainContainer);
  } else {
    console.error('Main container not found. App could not be initialized.');
  }
});