
import ContentWrapper from '../components/ContentWrapper';
import { VITE_TOKEN } from '../utils/constants';

const OauthPage = () => {
  const URL = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${VITE_TOKEN}`;
  return (
    <ContentWrapper children={(
      <a href={URL}>
        oauth
      </a>
    )}
    />  
  );
};

export default OauthPage;
