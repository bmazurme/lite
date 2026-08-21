// import { StrictMode } from 'react';
import { Toaster, ToasterComponent, ToasterProvider } from '@gravity-ui/uikit';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';
import '@gravity-ui/markdown-editor/styles/styles.css';
import '@diplodoc/transform/dist/css/yfm.css';
import './index.css';

import App from './App.tsx';
import ErrorBoundaryWrapper from './components/error-boundary-wrapper/error-boundary-wrapper.tsx';
import ThemeWrapper from './components/theme-wrapper';
import { store } from './store';


const toaster = new Toaster();

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <HelmetProvider>
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
      </Provider>
    </HelmetProvider>,
  // </StrictMode>,
);

export { toaster };
