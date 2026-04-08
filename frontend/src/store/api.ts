import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: [
    'Annex',
    'AnnexGroup',
    'AnnexTeacher',
    'AnnexRule',
    'AnnexTimeBlock',
    'ModificationGroup',
    'Exception',
    'EffectiveSchedule',
    'Teacher',
    'Group',
    'Child',
    'ClosedDay',
    'AnnexChildGroup',
  ],
  endpoints: () => ({}),
})
