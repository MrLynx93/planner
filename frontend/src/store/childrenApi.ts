import { api } from './api';
import type { ChildDto } from '@/types';

export const childrenApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getChildren: builder.query<ChildDto[], void>({
      query: () => '/children',
      providesTags: ['Child'],
    }),
    createChild: builder.mutation<ChildDto, ChildDto>({
      query: (dto) => ({ url: '/children', method: 'POST', body: dto }),
      invalidatesTags: ['Child'],
    }),
    updateChild: builder.mutation<ChildDto, ChildDto>({
      query: (dto) => ({
        url: `/children/${dto.id}`,
        method: 'PUT',
        body: dto,
      }),
      invalidatesTags: ['Child'],
    }),
    deleteChild: builder.mutation<void, number>({
      query: (id) => ({ url: `/children/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Child'],
    }),
  }),
});

export const {
  useGetChildrenQuery,
  useCreateChildMutation,
  useUpdateChildMutation,
  useDeleteChildMutation,
} = childrenApi;
