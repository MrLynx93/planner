import { api } from './api'
import type { TeacherDto } from '@/types'

export const teachersApi = api.injectEndpoints({
  endpoints: builder => ({
    getTeachers: builder.query<TeacherDto[], void>({
      query: () => '/teachers',
      providesTags: ['Teacher'],
    }),
    createTeacher: builder.mutation<TeacherDto, TeacherDto>({
      query: dto => ({ url: '/teachers', method: 'POST', body: dto }),
      invalidatesTags: ['Teacher'],
    }),
    updateTeacher: builder.mutation<TeacherDto, TeacherDto>({
      query: dto => ({ url: `/teachers/${dto.id}`, method: 'PUT', body: dto }),
      invalidatesTags: ['Teacher'],
    }),
    deleteTeacher: builder.mutation<void, number>({
      query: id => ({ url: `/teachers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Teacher'],
    }),
  }),
})

export const {
  useGetTeachersQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
} = teachersApi
