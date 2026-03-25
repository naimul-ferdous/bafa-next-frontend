import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import { CombinedViewShortData } from './atwCombinedViewShortService';

export const atwAssessmentOlqCombinedViewShortService = {
  async get(): Promise<CombinedViewShortData> {
    try {
      const token = getToken();
      const res = await apiClient.get<{ success: boolean; data: CombinedViewShortData }>(
        '/atw-assessment-olq-results/combined-view-short',
        token
      );
      return res?.data ?? { rows: [], authorities: [] };
    } catch {
      return { rows: [], authorities: [] };
    }
  },
};

export default atwAssessmentOlqCombinedViewShortService;
