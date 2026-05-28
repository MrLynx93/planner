import { api } from './api';
import type { GlobalRuleDto, RuleWithSourceDto } from '@/types';

export const globalRulesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getGlobalRules: builder.query<GlobalRuleDto[], void>({
      query: () => '/global-rules',
      providesTags: ['GlobalRule'],
    }),
    getAllRulesWithSource: builder.query<RuleWithSourceDto[], void>({
      query: () => '/global-rules/with-source',
      providesTags: ['GlobalRule', 'AnnexRule'],
    }),
    createGlobalRule: builder.mutation<GlobalRuleDto, GlobalRuleDto>({
      query: (dto) => ({ url: '/global-rules', method: 'POST', body: dto }),
      invalidatesTags: ['GlobalRule'],
    }),
    updateGlobalRule: builder.mutation<GlobalRuleDto, { id: number; intValue: number }>({
      query: ({ id, intValue }) => ({ url: `/global-rules/${id}`, method: 'PUT', body: { intValue } }),
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
  useGetAllRulesWithSourceQuery,
  useCreateGlobalRuleMutation,
  useUpdateGlobalRuleMutation,
  useDeleteGlobalRuleMutation,
} = globalRulesApi;
