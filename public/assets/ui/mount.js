import ui from './ui.js';

const go = () => ui.startAll(document);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', go, { once: true });
} else {
  go();
}
window.__tasteUi = ui;
