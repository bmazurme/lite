import typesApi from '../index';

export type TypeResponse = {
  id: number;
  name: string;
  color: string;
};

const typesApiEndpoints = typesApi
  .enhanceEndpoints({
    addTagTypes: ['Types'],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      getTypes: builder.mutation<TypeResponse[], void>({
        query: () => ({
          url: 'types',
          method: 'GET',
        }),
        invalidatesTags: ['Types'],
      }),
      createType: builder.mutation<TypeResponse, { name: string; color: string }>({
        query: (data) => ({
          url: 'types',
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['Types'],
      }),
      updateType: builder.mutation<TypeResponse, { id: number; name: string; color: string }>({
        query: ({ id, ...data }) => ({
          url: `types/${id}`,
          method: 'PATCH',
          body: data,
        }),
        invalidatesTags: ['Types'],
      }),
      deleteType: builder.mutation<void, number>({
        query: (id) => ({
          url: `types/${id}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Types'],
      }),
    }),
  });

export const {
  useGetTypesMutation,
  useCreateTypeMutation,
  useUpdateTypeMutation,
  useDeleteTypeMutation,
} = typesApiEndpoints;
export { typesApiEndpoints };
