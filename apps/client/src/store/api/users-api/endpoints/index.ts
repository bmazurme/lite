import usersApi from '..';

export type UserResponse = {
  id: number;
  username: string;
  status: string;
};

type UpdateUserPayload = Pick<UserResponse, 'id' | 'status'>;

const usersApiEndpoints = usersApi
  .enhanceEndpoints({
    addTagTypes: ['Users'],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      getUserInfo: builder.mutation<UserResponse, void>({
        query: () => ({
          url: '/users/me',
          method: 'GET',
        }),
      }),
      updateUser: builder.mutation<UserResponse, UpdateUserPayload>({
        query: ({ id, status }: UpdateUserPayload) => ({
          url: `/users/${id}`,
          method: 'PATCH',
          body: { status },
        }),
        invalidatesTags: ['Users'],
      }),
    }),
  });

export const { useGetUserInfoMutation, useUpdateUserMutation } = usersApiEndpoints;
export { usersApiEndpoints };
