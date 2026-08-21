import notesApi from '..';

type NotePayload = {
  title: string;
  preview: string;
  content: string;
  coverImage?: string;
  type: string;
  tags?: string[];
  relatedNoteIds?: number[];
  published?: boolean;
  reviewedAt?: string | null;
};

export type NoteTag = {
  id: number;
  name: string;
  slug: string;
};

export type BacklinkRef = {
  id: number;
  slug: string;
  title: string;
};

export type NoteResponse = {
  id: number;
  slug: string;
  title: string;
  preview: string;
  content: string;
  coverImage?: string | null;
  createdAt?: string;
  updatedAt?: string;
  reviewedAt?: string | null;
  type: {
    id: number;
    name: string;
    color: string;
  };
  tags?: NoteTag[];
  backlinks?: BacklinkRef[];
  relatedNotes?: BacklinkRef[];
  published?: boolean;
};

const notesApiEndpoints = notesApi
  .enhanceEndpoints({
    addTagTypes: ['Notes'],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      createNote: builder.mutation<NoteResponse, NotePayload>({
        query: (data: NotePayload) => ({
          url: '/notes',
          method: 'POST',
          body: { ...data, type: { id: Number(data.type) } },
        }),
        invalidatesTags: ['Notes'],
      }),
      updateNote: builder.mutation<NoteResponse, NotePayload & { id: number }>({
        query: ({ id, ...data }: NotePayload & { id: number }) => ({
          url: `/notes/${id}`,
          method: 'PATCH',
          body: { ...data, type: { id: Number(data.type) } },
        }),
        invalidatesTags: ['Notes'],
      }),
      getNoteById: builder.query<NoteResponse, number>({
        query: (id) => ({
          url: `/notes/${id}`,
          method: 'GET',
        }),
        providesTags: ['Notes'],
      }),
      getNoteBySlug: builder.query<NoteResponse, string>({
        query: (slug) => ({
          url: `/notes/slug/${slug}`,
          method: 'GET',
        }),
        providesTags: ['Notes'],
      }),
      getNotesByPage: builder.mutation<{ data: NoteResponse[]; total: number }, number>({
        query: (page) => ({
          url: `/notes/pages/${page}`,
          method: 'GET',
        }),
        invalidatesTags: ['Notes'],
      }),
      deleteNote: builder.mutation<void, number>({
        query: (id) => ({
          url: `/notes/${id}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Notes'],
      }),
      getNotesByType: builder.mutation<{ data: NoteResponse[]; total: number }, { typeId: number; page: number }>({
        query: ({ typeId, page }) => ({
          url: `/notes/type/${typeId}/pages/${page}`,
          method: 'GET',
        }),
        invalidatesTags: ['Notes'],
      }),
      getNotesByTag: builder.mutation<{ data: NoteResponse[]; total: number }, { slug: string; page: number }>({
        query: ({ slug, page }) => ({
          url: `/notes/tag/${encodeURIComponent(slug)}/pages/${page}`,
          method: 'GET',
        }),
        invalidatesTags: ['Notes'],
      }),
      searchNotes: builder.mutation<{ data: NoteResponse[]; total: number }, { q: string; page: number }>({
        query: ({ q, page }) => ({
          url: `/notes/search?q=${encodeURIComponent(q)}&page=${page}`,
          method: 'GET',
        }),
        invalidatesTags: ['Notes'],
      }),
      getNoteByTitle: builder.query<BacklinkRef, string>({
        query: (title) => ({
          url: `/notes/by-title/${encodeURIComponent(title)}`,
          method: 'GET',
        }),
        providesTags: ['Notes'],
      }),
      uploadImage: builder.mutation<{ url: string; name: string }, File>({
        query: (file) => {
          const body = new FormData();
          body.append('file', file);

          return {
            url: '/uploads/image',
            method: 'POST',
            body,
          };
        },
      }),
    }),
  });

export const {
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useGetNoteByIdQuery,
  useGetNoteBySlugQuery,
  useGetNotesByPageMutation,
  useDeleteNoteMutation,
  useGetNotesByTypeMutation,
  useGetNotesByTagMutation,
  useSearchNotesMutation,
  useGetNoteByTitleQuery,
  useUploadImageMutation,
} = notesApiEndpoints;
export { notesApiEndpoints };
