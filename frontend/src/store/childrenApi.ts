import { api } from './api'
import type { ChildDto, ChildGroupAssignmentDto } from '@/types'

export const childrenApi = api.injectEndpoints({
  endpoints: builder => ({
    getChildren: builder.query<ChildDto[], void>({
      query: () => '/children',
      providesTags: ['Child'],
    }),
    createChild: builder.mutation<ChildDto, ChildDto>({
      query: dto => ({ url: '/children', method: 'POST', body: dto }),
      invalidatesTags: ['Child'],
    }),
    updateChild: builder.mutation<ChildDto, ChildDto>({
      query: dto => ({ url: `/children/${dto.id}`, method: 'PUT', body: dto }),
      invalidatesTags: ['Child'],
    }),
    deleteChild: builder.mutation<void, number>({
      query: id => ({ url: `/children/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Child'],
    }),
    getChildAssignments: builder.query<ChildGroupAssignmentDto[], number>({
      query: childId => `/children/${childId}/assignments`,
      providesTags: (_, __, childId) => [{ type: 'Child', id: childId }],
    }),
    createChildAssignment: builder.mutation<ChildGroupAssignmentDto, { childId: number; dto: ChildGroupAssignmentDto }>({
      query: ({ childId, dto }) => ({ url: `/children/${childId}/assignments`, method: 'POST', body: dto }),
      invalidatesTags: (_, __, { childId }) => [{ type: 'Child', id: childId }],
    }),
  }),
})

export const {
  useGetChildrenQuery,
  useCreateChildMutation,
  useUpdateChildMutation,
  useDeleteChildMutation,
  useGetChildAssignmentsQuery,
  useCreateChildAssignmentMutation,
} = childrenApi
