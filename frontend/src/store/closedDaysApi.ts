import { api } from './api'
import type { ClosedDayDto } from '@/types'

export const closedDaysApi = api.injectEndpoints({
  endpoints: builder => ({
    getClosedDays: builder.query<ClosedDayDto[], void>({
      query: () => '/closed-days',
      providesTags: ['ClosedDay'],
    }),
    createClosedDay: builder.mutation<ClosedDayDto, ClosedDayDto>({
      query: dto => ({ url: '/closed-days', method: 'POST', body: dto }),
      invalidatesTags: ['ClosedDay'],
    }),
    deleteClosedDay: builder.mutation<void, number>({
      query: id => ({ url: `/closed-days/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ClosedDay'],
    }),
  }),
})

export const {
  useGetClosedDaysQuery,
  useCreateClosedDayMutation,
  useDeleteClosedDayMutation,
} = closedDaysApi
