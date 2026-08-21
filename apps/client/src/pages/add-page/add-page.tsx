import { useNavigate } from 'react-router-dom';

import ContentWrapper from '../../components/content-wrapper';
import EditForm from '../../components/edit-form/edit-form';
import type { FormPayload } from '../../components/edit-form/edit-form-payload';
import PageMeta from '../../components/page-meta';
import ProtectedWrapper from '../../components/protected-wrapper';
import RedirectToLogin from '../../components/redirect-to-login';
import { toaster } from '../../main';
import { useCreateNoteMutation } from '../../store';

export default function AddPage() {
  const navigate = useNavigate();
  const [createNote] = useCreateNoteMutation();

  const onSubmit = async (formData: FormPayload) => {
    try {
      await createNote(formData);
      navigate('/');
    } catch {
      toaster.add({
        name: 'create-note-error',
        title: 'Не удалось создать заметку',
        theme: 'danger',
      });
    }
  };

  return (
    <ContentWrapper sidebar>
      <ProtectedWrapper fallback={<RedirectToLogin />}>
        <PageMeta title="Новая заметка" noindex />
        <div className="form-container">
          <EditForm
            title="Addition"
            action={onSubmit}
          />
        </div>
      </ProtectedWrapper>
    </ContentWrapper>
  );
}
