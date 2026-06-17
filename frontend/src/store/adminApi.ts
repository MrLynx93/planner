import { api } from './api';

const ALL_TAGS = [
  'Annex', 'AnnexGroup', 'AnnexTeacher', 'AnnexRule', 'AnnexTimeBlock',
  'ModificationGroup', 'Exception', 'EffectiveSchedule', 'Teacher', 'Group',
  'Child', 'AnnexChildGroup', 'GlobalRule', 'Violation',
] as const;

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    clearDatabase: builder.mutation<void, void>({
      query: () => ({ url: '/admin/clear', method: 'POST' }),
      invalidatesTags: [...ALL_TAGS],
    }),
    importDatabase: builder.mutation<void, FormData>({
      query: (formData) => ({
        url: '/admin/import',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [...ALL_TAGS],
    }),
  }),
});

export const { useClearDatabaseMutation, useImportDatabaseMutation } = adminApi;
