import { useState } from 'react';

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

export default BrokenComponent;
