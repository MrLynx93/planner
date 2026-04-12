import { api } from './api';
import type { GroupDto } from '@/types';

export const groupsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getGroups: builder.query<GroupDto[], void>({
      query: () => '/groups',
      providesTags: ['Group'],
    }),
    createGroup: builder.mutation<GroupDto, GroupDto>({
      query: (dto) => ({ url: '/groups', method: 'POST', body: dto }),
      invalidatesTags: ['Group'],
    }),
    updateGroup: builder.mutation<GroupDto, GroupDto>({
      query: (dto) => ({ url: `/groups/${dto.id}`, method: 'PUT', body: dto }),
      invalidatesTags: ['Group'],
    }),
    deleteGroup: builder.mutation<void, number>({
      query: (id) => ({ url: `/groups/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Group'],
    }),
  }),
});

export const {
  useGetGroupsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
} = groupsApi;
