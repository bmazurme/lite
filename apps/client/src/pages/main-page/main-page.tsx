import ContentWrapper from '../../components/content-wrapper';
import Notes from '../../components/notes/notes';
import PageMeta from '../../components/page-meta';

function MainPage({ page }: { page?: number }) {
  return (
    <>
      <PageMeta
        title="Заметки"
        description="Все заметки"
      />
      <ContentWrapper
        children={(<Notes page={page} />)}
        sidebar
      />
    </>
  );
}

export default MainPage;
