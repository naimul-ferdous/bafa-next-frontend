import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import { AtwPenpictureAssign, AtwCounselingAssign, AtwOlqAssign, AtwWarningAssign } from '@/libs/types/atwAssign';

export type AssignType = 'penpicture' | 'counseling' | 'olq' | 'warning';

interface AssignQueryParams {
  user_id?: number;
  course_id?: number;
}

export interface UserAssigns {
  penpicture: AtwPenpictureAssign[];
  counseling: AtwCounselingAssign[];
  olq:        AtwOlqAssign[];
  warning:    AtwWarningAssign[];
}

interface UserAssignsApiResponse {
  success: boolean;
  message: string;
  data: UserAssigns;
}

interface SingleAssignApiResponse {
  success: boolean;
  message: string;
  data: AtwPenpictureAssign | AtwCounselingAssign | AtwOlqAssign | AtwWarningAssign;
}

const EMPTY: UserAssigns = { penpicture: [], counseling: [], olq: [], warning: [] };

export const atwUserAssignService = {
  getAll: async (params?: AssignQueryParams): Promise<UserAssigns> => {
    try {
      const query = new URLSearchParams();
      if (params?.user_id)   query.append('user_id',   params.user_id.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());

      const endpoint = `/atw-user-assigns${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<UserAssignsApiResponse>(endpoint, token);

      if (!result) return { ...EMPTY };

      return {
        penpicture: result.data?.penpicture || [],
        counseling: result.data?.counseling || [],
        olq:        result.data?.olq        || [],
        warning:    result.data?.warning    || [],
      };
    } catch (error) {
      console.error('Failed to fetch user assigns:', error);
      return { ...EMPTY };
    }
  },

  store: async (
    type: AssignType,
    data: { course_id: number; user_id: number; semester_id?: number; program_id?: number; branch_id?: number; is_active?: boolean }
  ): Promise<AtwPenpictureAssign | AtwCounselingAssign | AtwOlqAssign | AtwWarningAssign | null> => {
    try {
      const token = getToken();
      const result = await apiClient.post<SingleAssignApiResponse>('/atw-user-assigns', { ...data, type }, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to create ${type} assign:`, error);
      throw error;
    }
  },

  destroy: async (type: AssignType, id: number): Promise<boolean> => {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/atw-user-assigns/${type}/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete ${type} assign ${id}:`, error);
      return false;
    }
  },
};

export default atwUserAssignService;
