import notesApi from '..';

type Note = {
  // id: number;
  title: string;
  preview: string;
  content: string;
  type: string;
  // type: {
  //   id: number;
  // };
};

type NoteResponse = {
  id: number;
  title: string;
  content: string;
  type: {
    id: number;
    name: string;
  };
};

const notesApiEndpoints = notesApi
  .enhanceEndpoints({
    addTagTypes: ['Notes'],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      createNote: builder.mutation<NoteResponse, Note>({
        query: (data: Note) => ({
          url: '/notes',
          method: 'POST',
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
      getNotesByPage: builder.mutation<{ data: NoteResponse[]; total: number }, number>({
        query: (page) => ({
          url: `/notes/pages/${page}`,
          method: 'GET',
        }),
        invalidatesTags: ['Notes'],
      }),
    }),
  });

export const { useCreateNoteMutation, useGetNoteByIdQuery, useGetNotesByPageMutation } = notesApiEndpoints;
export { notesApiEndpoints };
