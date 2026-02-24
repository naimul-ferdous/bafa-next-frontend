/**
 * Instructor Service
 * API calls for instructor management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { InstructorBiodata } from '@/libs/types/user';

interface InstructorQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  course_id?: number;
  semester_id?: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
}

interface InstructorPaginatedResponse {
  data: InstructorBiodata[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface InstructorApiResponse {
  success: boolean;
  message: string;
  data: InstructorBiodata[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleInstructorApiResponse {
  success: boolean;
  message: string;
  data: InstructorBiodata;
}

interface InstructorActionApiResponse {
  success: boolean;
  message: string;
  data?: InstructorBiodata;
}

interface Certification {
  examFullName: string;
  examShortName: string;
  passingYear: string;
  grade: string;
  outOf: string;
  instituteName: string;
  others: string;
}

interface Achievement {
  achievementTitle: string;
  description: string;
  achievementDate: string;
  awardedBy: string;
}

interface InstructorCreateData {
  // Basic Information
  serviceNumber: string; // BD Number
  profilePicture?: string; // base64 string
  signature?: string; // base64 string
  name: string;
  nameBangla?: string;
  shortName?: string;
  gender: string;
  maritalStatus: string;
  religion: string;
  dateOfBirth: string;
  weight?: string;
  height?: string;
  bloodGroup: string;
  hairColor?: string;
  eyeColor?: string;
  caste?: string;
  complexion?: string;
  identificationMark?: string;
  otherInformation?: string;

  // Contact Information
  nationalId?: string;
  mobile: string;
  password: string;
  imo?: string;
  email: string;
  whatsapp?: string;
  viber?: string;
  facebookId?: string;
  drivingLicense?: string;
  passport?: string;

  // Spouse Information
  hasSpouse?: boolean;
  spouseName?: string;
  spouseGender?: string;
  hasChildren?: boolean;
  children?: Array<{ name: string; gender: string }>;

  // Languages
  languages?: Array<{ language: string; write: boolean; read: boolean; speak: boolean }>;

  // Office Information
  unit?: string;
  trade?: string;
  dateOfCommission?: string;
  joiningDate?: string;
  employeeType?: string;
  legend?: string;
  postingDate?: string;

  // Present Address
  presentDivision?: string;
  presentDistrict?: string;
  presentPostOffice?: string;
  presentPostCode?: string;
  presentAddress?: string;

  // Permanent Address
  permanentDivision?: string;
  permanentDistrict?: string;
  permanentPostOffice?: string;
  permanentPostCode?: string;
  permanentAddress?: string;

  // Guardian Address
  guardianDivision?: string;
  guardianDistrict?: string;
  guardianPostOffice?: string;
  guardianPostCode?: string;
  guardianAddress?: string;

  // Certifications/Education
  certifications?: Certification[];

  // Achievements
  achievements?: Achievement[];

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;

  // Professional Information
  specialization?: string;
  qualification?: string;
  yearsOfExperience?: string;
  instructorSince?: string;
}

export const instructorService = {
  async getAllInstructors(params?: InstructorQueryParams): Promise<InstructorPaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.program_id) query.append('program_id', params.program_id.toString());
      if (params?.branch_id) query.append('branch_id', params.branch_id.toString());
      if (params?.group_id) query.append('group_id', params.group_id.toString());

      const endpoint = `/instructors${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<InstructorApiResponse>(endpoint, token);

      if (!result) {
        return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
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
      console.error('Failed to fetch instructors:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async getInstructor(id: number): Promise<InstructorBiodata | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleInstructorApiResponse>(`/instructors/${id}`, token);
      if (!result || !result.success) return null;
      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch instructor ${id}:`, error);
      return null;
    }
  },

  async createInstructor(data: InstructorCreateData): Promise<InstructorBiodata | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<InstructorActionApiResponse>('/instructors', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create instructor');
      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create instructor:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  async updateInstructor(id: number, data: Partial<InstructorCreateData>): Promise<InstructorBiodata | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<InstructorActionApiResponse>(`/instructors/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update instructor');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update instructor ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  async deleteInstructor(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<InstructorActionApiResponse>(`/instructors/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete instructor ${id}:`, error);
      return false;
    }
  },
};

export default instructorService;
