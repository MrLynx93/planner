import { api } from './api'
import type { AnnexDto, AnnexGroupDto, AnnexTeacherDto, ScheduleBlock } from '@/components/schedule/types'

export const annexesApi = api.injectEndpoints({
  endpoints: builder => ({
    getAnnexes: builder.query<AnnexDto[], void>({
      query: () => '/annexes',
      providesTags: ['Annex'],
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
  }),
})

export const {
  useGetAnnexesQuery,
  useGetAnnexGroupsQuery,
  useGetAnnexTeachersQuery,
  useGetAnnexTimeBlocksQuery,
} = annexesApi
