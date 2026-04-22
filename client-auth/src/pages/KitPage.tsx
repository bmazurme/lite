import { useNavigate } from 'react-router-dom';

import ErrorBoundaryWrapper from '../components/ErrorBoundaryWrapper';
import BrokenComponent from '../components/BrokenComponent';

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
