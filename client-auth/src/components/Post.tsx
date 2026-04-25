import { useNavigate } from 'react-router-dom';
import { Button } from '@gravity-ui/uikit';

function Post() {
  const navigate = useNavigate();

  return (
    <div className="post">
      <div className="post-title">
        Установка и настройка NGINX NTLM-модуля
      </div>
      <div className="post-excerpt">
        NGINX NTLM-модуль — это дополнительный модуль для веб-сервера Nginx,
        который позволяет реализовать аутентификацию по протоколу NTLM.
        Это особенно полезно при работе с корпоративными сетями и Active Directory.
      </div>
      <div className="read-more">
        <Button
          view="outlined-action"
          size="m"
          onClick={() => navigate('/note/1')}
        >
          read-more
        </Button>
        
      </div>
      <div className="post-meta">
        post-meta
      </div>
    </div>
  )
}

export default Post;
