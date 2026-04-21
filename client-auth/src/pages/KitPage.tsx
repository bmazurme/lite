import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { onError } from 'react-error-boundary';

import ErrorBoundaryWrapper from '../components/ErrorBoundaryWrapper';


function BrokenComponent() {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error('Компонент сломался!');
  }

  return (
    <div>
      <h3>Рабочий компонент</h3>
      <button className="counter" onClick={() => setShouldCrash(true)}>
        Сломать компонент
      </button>
    </div>
  );
}


function KitPage() {
  const navigate = useNavigate();

  return (
    <>
      <ErrorBoundaryWrapper>
        <section id="center">
          <div className="hero">
            error
          </div>
           <button
            className="counter"
            onClick={() => navigate('/')}
          >
            Home
          </button>
          <BrokenComponent />
        </section>
      </ErrorBoundaryWrapper>
    </>
  )
}

export default KitPage;
