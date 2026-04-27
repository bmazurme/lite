import { useNavigate } from 'react-router-dom';
import { Button, Text } from '@gravity-ui/uikit';
import style from './NotFoundPage.module.css';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <>
      <section className={style.container}>
        <Text variant="header-2">
          404
        </Text>
        <Text variant="header-1">
          Страница не найдена
        </Text>
        <Text variant="body-3">
          К сожалению, запрошенная страница не существует или была перемещена.
        </Text>
        <Button
          view="outlined-action"
          size="m"
          onClick={() => navigate('/')}
        >
          Вернуться на главную
        </Button>
      </section>
    </>
  )
}

export default NotFoundPage;
