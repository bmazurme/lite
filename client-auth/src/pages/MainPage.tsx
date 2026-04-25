import Posts from '../components/Posts';

function MainPage({ page }: { page?: number }) {
  return (
    <>
      <Posts page={page} />
    </>
  )
}

export default MainPage;
