/**
 * Program Service
 * API calls for program management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { SystemProgram, SystemProgramChangeableSemester } from '@/libs/types/system';

interface ProgramQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

interface ProgramPaginatedResponse {
  data: SystemProgram[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface ProgramApiResponse {
  success: boolean;
  message: string;
  data: SystemProgram[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleProgramApiResponse {
  success: boolean;
  message: string;
  data: SystemProgram;
}

interface ProgramActionApiResponse {
  success: boolean;
  message: string;
  data?: SystemProgram;
}

interface ChangeableSemesterInput {
  name: string;
  short_name?: string;
  semester_id: number;
}

interface ProgramCreateData {
  name: string;
  short_name?: string;
  description?: string;
  duration_months?: number;
  qualification_level?: string;
  is_changeable?: boolean;
  is_active?: boolean;
  changeable_semesters?: ChangeableSemesterInput[];
}

interface ChangeableSemesterApiResponse {
  success: boolean;
  message: string;
  data: SystemProgramChangeableSemester[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface ChangeableSemesterActionApiResponse {
  success: boolean;
  message: string;
  data?: SystemProgramChangeableSemester;
}

export const programService = {
  /**
   * Get all programs with pagination
   */
  async getAllPrograms(params?: ProgramQueryParams): Promise<ProgramPaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) {
        query.append('page', params.page.toString());
      }

      if (params?.per_page) {
        query.append('per_page', params.per_page.toString());
      }

      if (params?.search) {
        query.append('search', params.search);
      }

      const endpoint = `/system-programs${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<ProgramApiResponse>(endpoint, token);

      if (!result) {
        return {
          data: [],
          current_page: 1,
          per_page: 10,
          total: 0,
          last_page: 1,
          from: 0,
          to: 0,
        };
      }

      return {
        data: result.data || [],
        current_page: result.pagination?.current_page || 1,
        per_page: result.pagination?.per_page || 10,
        total: result.pagination?.total || 0,
        last_page: result.pagination?.last_page || 1,
        from: result.pagination?.from || 0,
        to: result.pagination?.to || 0,
      };
    } catch (error) {
      console.error('Failed to fetch programs:', error);
      return {
        data: [],
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
        from: 0,
        to: 0,
      };
    }
  },

  /**
   * Get single program
   */
  async getProgram(id: number): Promise<SystemProgram | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleProgramApiResponse>(`/system-programs/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch program ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new program
   */
  async createProgram(data: ProgramCreateData): Promise<SystemProgram | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<ProgramActionApiResponse>('/system-programs', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create program');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create program:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update program
   */
  async updateProgram(id: number, data: Partial<ProgramCreateData>): Promise<SystemProgram | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<ProgramActionApiResponse>(`/system-programs/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update program');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update program ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete program
   */
  async deleteProgram(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ProgramActionApiResponse>(`/system-programs/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete program ${id}:`, error);
      return false;
    }
  },

  // --- Changeable Semesters ---

  async getChangeableSemesters(programId: number): Promise<SystemProgramChangeableSemester[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<ChangeableSemesterApiResponse>(
        `/system-programs/${programId}/changeable-semesters?per_page=100`,
        token
      );
      return result?.data || [];
    } catch (error) {
      console.error(`Failed to fetch changeable semesters for program ${programId}:`, error);
      return [];
    }
  },

  async createChangeableSemester(
    programId: number,
    data: { name: string; code: string; semester_id: number; is_active?: boolean }
  ): Promise<SystemProgramChangeableSemester | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ChangeableSemesterActionApiResponse>(
        `/system-programs/${programId}/changeable-semesters`,
        data,
        token
      );
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create changeable semester');
      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create changeable semester:', error);
      throw error;
    }
  },

  async updateChangeableSemester(
    programId: number,
    id: number,
    data: { name: string; code: string; semester_id: number; is_active?: boolean }
  ): Promise<SystemProgramChangeableSemester | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<ChangeableSemesterActionApiResponse>(
        `/system-programs/${programId}/changeable-semesters/${id}`,
        data,
        token
      );
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update changeable semester');
      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to update changeable semester:', error);
      throw error;
    }
  },

  async deleteChangeableSemester(programId: number, id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ChangeableSemesterActionApiResponse>(
        `/system-programs/${programId}/changeable-semesters/${id}`,
        token
      );
      return result?.success || false;
    } catch (error) {
      console.error('Failed to delete changeable semester:', error);
      return false;
    }
  },
};

export default programService;
