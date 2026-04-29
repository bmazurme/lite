import ContentWrapper from '../components/ContentWrapper';
import Posts from '../components/Posts';

function MainPage({ page }: { page?: number }) {
  return (
    <ContentWrapper
      children={(<Posts page={page} />)}
      sidebar
    />
  )
}

export default MainPage;
