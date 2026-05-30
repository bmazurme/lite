import { useParams } from 'react-router-dom';

import ContentWrapper from '../components/ContentWrapper';
import { useGetNoteByIdQuery } from '../store/api/notes-api/endpoints';
import MarkdownPreview from '../components/MarkdownPreview/MarkdownPreview';

function PostPage() {
  const { noteId } = useParams();
  const { data } = useGetNoteByIdQuery(+noteId!);
  console.log(data);

  return (
    <ContentWrapper children={(
      <section className="post">
        <div className="post-title">
          {data?.title}
        </div>
        <div className="post-excerpt">
          <MarkdownPreview
            getValue={() => data?.content || ''}
            allowHTML={true}
            breaks={true}
            linkify={true}
          />
        </div>
        <div className="post-meta">
          {data?.type?.name}
        </div>
      </section>)}
      sidebar
    />
  )
}

export default PostPage;
