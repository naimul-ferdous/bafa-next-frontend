import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import { CtwPenpictureAssign, CtwCounselingAssign, CtwOlqAssign, CtwWarningAssign } from '@/libs/types/ctwAssign';

export type CtwAssignType = 'penpicture' | 'counseling' | 'olq' | 'warning';

interface AssignQueryParams {
  user_id?: number;
  course_id?: number;
}

export interface CtwUserAssigns {
  penpicture: CtwPenpictureAssign[];
  counseling: CtwCounselingAssign[];
  olq:        CtwOlqAssign[];
  warning:    CtwWarningAssign[];
}

interface CtwUserAssignsApiResponse {
  success: boolean;
  message: string;
  data: CtwUserAssigns;
}

interface CtwSingleAssignApiResponse {
  success: boolean;
  message: string;
  data: CtwPenpictureAssign | CtwCounselingAssign | CtwOlqAssign | CtwWarningAssign;
}

const EMPTY: CtwUserAssigns = { penpicture: [], counseling: [], olq: [], warning: [] };

export const ctwUserAssignService = {
  getAll: async (params?: AssignQueryParams): Promise<CtwUserAssigns> => {
    try {
      const query = new URLSearchParams();
      if (params?.user_id)   query.append('user_id',   params.user_id.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());

      const endpoint = `/ctw-user-assigns${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<CtwUserAssignsApiResponse>(endpoint, token);

      if (!result) return { ...EMPTY };

      return {
        penpicture: result.data?.penpicture || [],
        counseling: result.data?.counseling || [],
        olq:        result.data?.olq        || [],
        warning:    result.data?.warning    || [],
      };
    } catch (error) {
      console.error('Failed to fetch CTW user assigns:', error);
      return { ...EMPTY };
    }
  },

  store: async (
    type: CtwAssignType,
    data: { course_id: number; user_id: number; semester_id?: number; program_id?: number; branch_id?: number; is_active?: boolean }
  ): Promise<CtwPenpictureAssign | CtwCounselingAssign | CtwOlqAssign | CtwWarningAssign | null> => {
    try {
      const token = getToken();
      const result = await apiClient.post<CtwSingleAssignApiResponse>('/ctw-user-assigns', { ...data, type }, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to create CTW ${type} assign:`, error);
      throw error;
    }
  },

  destroy: async (type: CtwAssignType, id: number): Promise<boolean> => {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/ctw-user-assigns/${type}/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete CTW ${type} assign ${id}:`, error);
      return false;
    }
  },
};

export default ctwUserAssignService;
