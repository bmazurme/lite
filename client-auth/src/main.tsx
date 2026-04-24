// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster, ToasterComponent, ToasterProvider } from '@gravity-ui/uikit';

import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';
import './index.css';

import App from './App.tsx';
import { store } from './store';

import ErrorBoundaryWrapper from './components/ErrorBoundaryWrapper.tsx';
import ThemeWrapper from './components/ThemeWrapper.tsx';

const toaster = new Toaster();

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <Provider store={store}>
      <ThemeWrapper>
        <ToasterProvider toaster={toaster}>
          <BrowserRouter>
            <ErrorBoundaryWrapper>
              <App />
              <ToasterComponent />
            </ErrorBoundaryWrapper>
          </BrowserRouter>
        </ToasterProvider>
      </ThemeWrapper>
    </Provider>,
  // </StrictMode>,
);

export { toaster };
