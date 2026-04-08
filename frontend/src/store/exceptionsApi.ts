import { api } from './api'
import type { ExceptionDto, ExceptionReason, ScheduleBlock } from '@/components/schedule/types'

export type CreateModificationItemRequest =
  | {
      type: 'REMOVE'
      timeBlockId: number
      date: string  // "YYYY-MM-DD"
      teacherId?: never
      groupId?: never
      startTime?: never
      endTime?: never
    }
  | {
      type: 'ADD'
      date: string  // "YYYY-MM-DD"
      teacherId: number
      groupId: number
      startTime: string  // "HH:mm:ss"
      endTime: string
      timeBlockId?: never
    }

export interface CreateExceptionRequest {
  title: string | null
  reason: ExceptionReason
  note: string | null
  modifications: CreateModificationItemRequest[]
}

export interface UpdateExceptionRequest {
  title: string | null
  reason: ExceptionReason
  note: string | null
}

type CreateExceptionArg = { annexId: number; request: CreateExceptionRequest }
type UpdateExceptionArg = { annexId: number; exceptionId: number; request: UpdateExceptionRequest }
type DeleteExceptionArg = { annexId: number; exceptionId: number }
type GetEffectiveScheduleArg = { annexId: number; weekStart: string }  // weekStart: "YYYY-MM-DD"

export const exceptionsApi = api.injectEndpoints({
  endpoints: builder => ({
    getExceptions: builder.query<ExceptionDto[], number>({
      query: annexId => `/annexes/${annexId}/modification-groups`,
      providesTags: ['Exception'],
    }),
    createException: builder.mutation<ExceptionDto, CreateExceptionArg>({
      query: ({ annexId, request }) => ({
        url: `/annexes/${annexId}/modification-groups`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['Exception', 'EffectiveSchedule'],
    }),
    updateException: builder.mutation<ExceptionDto, UpdateExceptionArg>({
      query: ({ annexId, exceptionId, request }) => ({
        url: `/annexes/${annexId}/modification-groups/${exceptionId}`,
        method: 'PUT',
        body: request,
      }),
      invalidatesTags: ['Exception'],
    }),
    deleteException: builder.mutation<void, DeleteExceptionArg>({
      query: ({ annexId, exceptionId }) => ({
        url: `/annexes/${annexId}/modification-groups/${exceptionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Exception', 'EffectiveSchedule'],
    }),
    getEffectiveSchedule: builder.query<ScheduleBlock[], GetEffectiveScheduleArg>({
      query: ({ annexId, weekStart }) => `/annexes/${annexId}/schedule?weekStart=${weekStart}`,
      providesTags: ['EffectiveSchedule'],
    }),
  }),
})

export const {
  useGetExceptionsQuery,
  useCreateExceptionMutation,
  useUpdateExceptionMutation,
  useDeleteExceptionMutation,
  useGetEffectiveScheduleQuery,
} = exceptionsApi
