import { api } from './api';
import type { GlobalRuleDto } from '@/types';

export const globalRulesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getGlobalRules: builder.query<GlobalRuleDto[], void>({
      query: () => '/global-rules',
      providesTags: ['GlobalRule'],
    }),
    createGlobalRule: builder.mutation<GlobalRuleDto, GlobalRuleDto>({
      query: (dto) => ({ url: '/global-rules', method: 'POST', body: dto }),
      invalidatesTags: ['GlobalRule'],
    }),
    deleteGlobalRule: builder.mutation<void, number>({
      query: (id) => ({ url: `/global-rules/${id}`, method: 'DELETE' }),
      invalidatesTags: ['GlobalRule'],
    }),
  }),
});

export const {
  useGetGlobalRulesQuery,
  useCreateGlobalRuleMutation,
  useDeleteGlobalRuleMutation,
} = globalRulesApi;
