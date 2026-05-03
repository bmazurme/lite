import { useState } from 'react';
import { Button, Text } from '@gravity-ui/uikit';

function BrokenComponent() {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error('Компонент сломался!');
  }

  return (
    <div>
      <Text variant="header-1">
        Рабочий компонент
      </Text>
      <Button
        view="outlined-danger"
        size="m"
        onClick={() => setShouldCrash(true)}
      >
        Сломать компонент
      </Button>
    </div>
  );
}

export default BrokenComponent;
