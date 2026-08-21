import { Loader } from '@gravity-ui/uikit';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const AddPage = lazy(() => import('./pages/add-page'));
const EditPage = lazy(() => import('./pages/edit-page'));
const MainPage = lazy(() => import('./pages/main-page'));
const NotFoundPage = lazy(() => import('./pages/not-found-page'));
const NotePage = lazy(() => import('./pages/note-page'));
const OauthErrorPage = lazy(() => import('./pages/oauth-error-page/oauth-error-page'));
const OauthPage = lazy(() => import('./pages/oauth-page'));
const ProfilePage = lazy(() => import('./pages/profile-page'));
const TypeNotesPage = lazy(() => import('./pages/type-notes-page'));
const TagNotesPage = lazy(() => import('./pages/tag-notes-page'));
const SearchNotesPage = lazy(() => import('./pages/search-notes-page'));
const WikiResolvePage = lazy(() => import('./pages/wiki-resolve-page/wiki-resolve-page'));
const TypesAdminPage = lazy(() => import('./pages/types-admin-page'));
const TagsAdminPage = lazy(() => import('./pages/tags-admin-page'));

const fallback = (
  <div className="suspense-fallback">
    <Loader size="m" />
  </div>
);

function App() {
  return (
    <>
      <Suspense fallback={fallback}>
        <Routes>
          <Route path="/" element={(<MainPage page={1} />)} />
          <Route path="/notes" element={(<MainPage />)} />
          <Route path="/oauth" element={(<OauthPage />)} />
          <Route path="/oauth-error" element={(<OauthErrorPage />)} />
          <Route path="/add-note" element={(<AddPage />)} />
          <Route path="/edit-note/:noteId" element={(<EditPage />)} />
          <Route path="/note/:noteId" element={(<NotePage />)} />
          <Route path="/n/:slug" element={(<NotePage />)} />
          <Route path="/notes/type/:typeId" element={(<TypeNotesPage />)} />
          <Route path="/notes/tag/:slug" element={(<TagNotesPage />)} />
          <Route path="/search" element={(<SearchNotesPage />)} />
          <Route path="/wiki/:title" element={(<WikiResolvePage />)} />
          <Route path="/profile" element={(<ProfilePage />)} />
          <Route path="/admin/types" element={(<TypesAdminPage />)} />
          <Route path="/admin/tags" element={(<TagsAdminPage />)} />
          <Route path="*" element={(<NotFoundPage />)} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App;
