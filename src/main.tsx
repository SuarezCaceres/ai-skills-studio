import { StrictMode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  flushSync(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
}
