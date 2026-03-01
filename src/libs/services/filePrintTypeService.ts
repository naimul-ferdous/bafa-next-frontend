import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import { 
  FilePrintType, 
  FilePrintTypeCreateData, 
  FilePrintTypeUpdateData, 
  FilePrintTypeQueryParams, 
  FilePrintTypePaginatedResponse 
} from "../types/filePrintType";

interface FilePrintTypeApiResponse {
  success: boolean;
  message: string;
  data: FilePrintType | FilePrintType[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

class FilePrintTypeService {
  async getFilePrintTypes(params?: FilePrintTypeQueryParams): Promise<FilePrintTypePaginatedResponse | FilePrintType[]> {
    try {
      const cleanParams = params ? Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v != null && v !== "")
      ) : {};

      const query = new URLSearchParams(cleanParams as Record<string, string>).toString();
      const token = getToken();
      const result = await apiClient.get<FilePrintTypeApiResponse>(`/file-print-types${query ? `?${query}` : ""}`, token);
      
      if (params?.all) {
        return (result?.data as FilePrintType[]) || [];
      }
      
      // Return paginated format matching the interface
      return {
        data: (result?.data as FilePrintType[]) || [],
        current_page: result?.pagination?.current_page || 1,
        per_page: result?.pagination?.per_page || 10,
        total: result?.pagination?.total || 0,
        last_page: result?.pagination?.last_page || 1,
        from: result?.pagination?.from || 0,
        to: result?.pagination?.to || 0,
        first_page_url: '',
        last_page_url: '',
        links: [],
        next_page_url: null,
        path: '',
        prev_page_url: null,
      } as FilePrintTypePaginatedResponse;
    } catch (error) {
      console.error('Failed to fetch file print types:', error);
      if (params?.all) return [];
      return {
        data: [],
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
        from: 0,
        to: 0,
        first_page_url: '',
        last_page_url: '',
        links: [],
        next_page_url: null,
        path: '',
        prev_page_url: null,
      };
    }
  }

  async getActiveFilePrintTypes(): Promise<FilePrintType[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<FilePrintTypeApiResponse>('/file-print-types?all=true', token);
      return (result?.data as FilePrintType[]) || [];
    } catch (error) {
      console.error('Failed to fetch active file print types:', error);
      return [];
    }
  }

  async getFilePrintType(id: number): Promise<FilePrintType | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<FilePrintTypeApiResponse>(`/file-print-types/${id}`, token);
      return (result?.data as FilePrintType) || null;
    } catch (error) {
      console.error(`Failed to fetch file print type ${id}:`, error);
      return null;
    }
  }

  async createFilePrintType(data: FilePrintTypeCreateData): Promise<FilePrintType | null> {
    try {
      const token = getToken();
      const result = await apiClient.post<FilePrintTypeApiResponse>('/file-print-types', data, token);
      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create file print type');
      }
      return (result.data as FilePrintType) || null;
    } catch (error) {
      console.error('Failed to create file print type:', error);
      throw error;
    }
  }

  async updateFilePrintType(id: number, data: FilePrintTypeUpdateData): Promise<FilePrintType | null> {
    try {
      const token = getToken();
      const result = await apiClient.put<FilePrintTypeApiResponse>(`/file-print-types/${id}`, data, token);
      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update file print type');
      }
      return (result.data as FilePrintType) || null;
    } catch (error) {
      console.error(`Failed to update file print type ${id}:`, error);
      throw error;
    }
  }

  async deleteFilePrintType(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<FilePrintTypeApiResponse>(`/file-print-types/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete file print type ${id}:`, error);
      return false;
    }
  }
}

export const filePrintTypeService = new FilePrintTypeService();
