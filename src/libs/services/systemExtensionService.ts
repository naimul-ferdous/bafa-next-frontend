import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { SystemExtension } from '@/libs/types/systemExtension';

interface ExtensionQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  role_id?: number;
}

interface ExtensionPaginatedResponse {
  data: SystemExtension[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface ExtensionApiResponse {
  success: boolean;
  message: string;
  data: SystemExtension[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleExtensionApiResponse {
  success: boolean;
  message: string;
  data: SystemExtension;
}

interface ExtensionActionApiResponse {
  success: boolean;
  message: string;
  data?: SystemExtension;
}

interface ExtensionCreateData {
  name: string;
  role_id: number;
}

const emptyPage: ExtensionPaginatedResponse = {
  data: [],
  current_page: 1,
  per_page: 10,
  total: 0,
  last_page: 1,
  from: 0,
  to: 0,
};

export const systemExtensionService = {
  async getAll(params?: ExtensionQueryParams): Promise<ExtensionPaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.role_id) query.append('role_id', params.role_id.toString());

      const endpoint = `/system-extensions${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ExtensionApiResponse>(endpoint, token);

      if (!result) return emptyPage;

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
      console.error('Failed to fetch extensions:', error);
      return emptyPage;
    }
  },

  async get(id: number): Promise<SystemExtension | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleExtensionApiResponse>(`/system-extensions/${id}`, token);
      return result?.success ? result.data : null;
    } catch (error) {
      console.error(`Failed to fetch extension ${id}:`, error);
      return null;
    }
  },

  async create(data: ExtensionCreateData): Promise<SystemExtension | null> {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found. Please login again.');
    const result = await apiClient.post<ExtensionActionApiResponse>('/system-extensions', data, token);
    if (!result?.success) throw new Error(result?.message || 'Failed to create extension');
    return result.data || null;
  },

  async update(id: number, data: ExtensionCreateData): Promise<SystemExtension | null> {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found. Please login again.');
    const result = await apiClient.put<ExtensionActionApiResponse>(`/system-extensions/${id}`, data, token);
    if (!result?.success) throw new Error(result?.message || 'Failed to update extension');
    return result.data || null;
  },

  async delete(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ExtensionActionApiResponse>(`/system-extensions/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete extension ${id}:`, error);
      return false;
    }
  },
};

export default systemExtensionService;
