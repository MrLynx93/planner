import { api } from './api'
import type { AnnexDto, AnnexGroupDto, AnnexTeacherDto, ScheduleBlock } from '@/components/schedule/types'
import type { AnnexRuleDto, AnnexChildGroupDto } from '@/types'

export const annexesApi = api.injectEndpoints({
  endpoints: builder => ({
    getAnnexes: builder.query<AnnexDto[], void>({
      query: () => '/annexes',
      providesTags: ['Annex'],
    }),
    createAnnex: builder.mutation<AnnexDto, AnnexDto>({
      query: dto => ({ url: '/annexes', method: 'POST', body: dto }),
      invalidatesTags: ['Annex'],
    }),
    updateAnnex: builder.mutation<AnnexDto, AnnexDto>({
      query: dto => ({ url: `/annexes/${dto.id}`, method: 'PUT', body: dto }),
      invalidatesTags: ['Annex'],
    }),
    deleteAnnex: builder.mutation<void, number>({
      query: id => ({ url: `/annexes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Annex'],
    }),
    getAnnexGroups: builder.query<AnnexGroupDto[], number>({
      query: annexId => `/annexes/${annexId}/groups`,
      providesTags: ['AnnexGroup'],
    }),
    getAnnexTeachers: builder.query<AnnexTeacherDto[], number>({
      query: annexId => `/annexes/${annexId}/teachers`,
      providesTags: ['AnnexTeacher'],
    }),
    getAnnexTimeBlocks: builder.query<ScheduleBlock[], number>({
      query: annexId => `/annexes/${annexId}/time-blocks`,
      providesTags: ['AnnexTimeBlock'],
    }),
    getAnnexRules: builder.query<AnnexRuleDto[], number>({
      query: annexId => `/annexes/${annexId}/rules`,
      providesTags: ['AnnexRule'],
    }),
    createAnnexRule: builder.mutation<AnnexRuleDto, { annexId: number; dto: AnnexRuleDto }>({
      query: ({ annexId, dto }) => ({ url: `/annexes/${annexId}/rules`, method: 'POST', body: dto }),
      invalidatesTags: ['AnnexRule'],
    }),
    deleteAnnexRule: builder.mutation<void, { annexId: number; annexRuleId: number }>({
      query: ({ annexId, annexRuleId }) => ({ url: `/annexes/${annexId}/rules/${annexRuleId}`, method: 'DELETE' }),
      invalidatesTags: ['AnnexRule'],
    }),
    activateAnnex: builder.mutation<AnnexDto, number>({
      query: id => ({ url: `/annexes/${id}/activate`, method: 'POST' }),
      invalidatesTags: ['Annex'],
    }),
    getAnnexChildren: builder.query<AnnexChildGroupDto[], number>({
      query: annexId => `/annexes/${annexId}/children`,
      providesTags: ['AnnexChildGroup'],
    }),
    assignChildToAnnex: builder.mutation<AnnexChildGroupDto, { annexId: number; dto: AnnexChildGroupDto }>({
      query: ({ annexId, dto }) => ({ url: `/annexes/${annexId}/children`, method: 'POST', body: dto }),
      invalidatesTags: ['AnnexChildGroup'],
    }),
    removeChildFromAnnex: builder.mutation<void, { annexId: number; annexChildGroupId: number }>({
      query: ({ annexId, annexChildGroupId }) => ({
        url: `/annexes/${annexId}/children/${annexChildGroupId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AnnexChildGroup'],
    }),
  }),
})

export const {
  useGetAnnexesQuery,
  useCreateAnnexMutation,
  useUpdateAnnexMutation,
  useDeleteAnnexMutation,
  useGetAnnexGroupsQuery,
  useGetAnnexTeachersQuery,
  useGetAnnexTimeBlocksQuery,
  useGetAnnexRulesQuery,
  useCreateAnnexRuleMutation,
  useDeleteAnnexRuleMutation,
  useActivateAnnexMutation,
  useGetAnnexChildrenQuery,
  useAssignChildToAnnexMutation,
  useRemoveChildFromAnnexMutation,
} = annexesApi
