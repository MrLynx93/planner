import { api } from './api';
import type { ViolationDto } from '@/types';

type GetViolationsArg = { annexId: number; year: number; month: number };

export const violationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getViolations: builder.query<ViolationDto[], GetViolationsArg>({
      query: ({ annexId, year, month }) =>
        `/annexes/${annexId}/violations?year=${year}&month=${month}`,
      providesTags: ['Violation'],
    }),
  }),
});

export const { useGetViolationsQuery } = violationsApi;
