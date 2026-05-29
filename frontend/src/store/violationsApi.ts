import { api } from './api';
import type { TemplateViolationDto, ViolationDto } from '@/types';

type GetViolationsArg = { annexId: number; year: number; month: number };

export const violationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getViolations: builder.query<ViolationDto[], GetViolationsArg>({
      query: ({ annexId, year, month }) =>
        `/annexes/${annexId}/violations?year=${year}&month=${month}`,
      providesTags: ['Violation'],
    }),
    getTemplateViolations: builder.query<TemplateViolationDto[], number>({
      query: (annexId) => `/annexes/${annexId}/violations/template`,
      providesTags: ['Violation', 'AnnexTimeBlock'],
    }),
  }),
});

export const { useGetViolationsQuery, useGetTemplateViolationsQuery } = violationsApi;
