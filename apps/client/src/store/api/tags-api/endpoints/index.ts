import tagsApi from '../index';

export type TagResponse = {
  id: number;
  name: string;
  slug: string;
  count?: number;
};

const tagsApiEndpoints = tagsApi
  .enhanceEndpoints({
    addTagTypes: ['Tags'],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      getTags: builder.mutation<TagResponse[], void>({
        query: () => ({
          url: 'tags',
          method: 'GET',
        }),
        invalidatesTags: ['Tags'],
      }),
      updateTag: builder.mutation<TagResponse, { id: number; name: string }>({
        query: ({ id, name }) => ({
          url: `tags/${id}`,
          method: 'PATCH',
          body: { name },
        }),
        invalidatesTags: ['Tags'],
      }),
      deleteTag: builder.mutation<{ message: string }, number>({
        query: (id) => ({
          url: `tags/${id}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Tags'],
      }),
    }),
  });

export const {
  useGetTagsMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} = tagsApiEndpoints;
export { tagsApiEndpoints };
