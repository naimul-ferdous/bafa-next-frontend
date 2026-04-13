import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface CtwAttendenceResultCadet {
  id: number;
  ctw_attendence_result_id: number;
  cadet_id: number;
  status: AttendanceStatus;
  remarks: string | null;
  cadet?: {
    id: number;
    name: string;
    cadet_number: string;
    assignedRanks?: { rank: { name: string; short_name: string } }[];
    assignedBranchs?: { branch: { name: string } }[];
  };
}

export interface CtwAttendenceResult {
  id: number;
  course_id: number;
  semester_id: number;
  attendence_type_id: number;
  attendance_date: string | null;
  remarks: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  course?: { id: number; name: string; code: string };
  semester?: { id: number; name: string; code: string };
  attendence_type?: { id: number; name: string; short_name: string };
  creator?: { id: number; name: string } | null;
  cadet_attendances?: CtwAttendenceResultCadet[];
  cadet_attendances_count?: number;
  present_count?: number;
  absent_count?: number;
  late_count?: number;
  excused_count?: number;
}

export interface CtwAttendenceCadetOption {
  id: number;
  name: string;
  cadet_number: string;
  assigned_ranks?: { rank: { name: string; short_name: string } }[];
  assigned_branchs?: { branch: { name: string } }[];
}

export interface CtwAttendenceResultFormData {
  course_id: number;
  semester_id: number;
  attendence_type_id: number;
  attendance_date?: string | null;
  remarks?: string | null;
  cadets: { cadet_id: number; status: AttendanceStatus; remarks?: string | null }[];
}

interface PaginatedResponse {
  data: CtwAttendenceResult[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface ApiPaginatedResult {
  success: boolean;
  data: CtwAttendenceResult[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

export const ctwAttendenceResultService = {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    course_id?: number;
    semester_id?: number;
  }): Promise<PaginatedResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    if (params?.course_id) query.set('course_id', String(params.course_id));
    if (params?.semester_id) query.set('semester_id', String(params.semester_id));
    const token = getToken();
    const result = await apiClient.get<ApiPaginatedResult>(
      `/ctw-attendence-results?${query.toString()}`,
      token
    );
    return {
      data: result.data ?? [],
      current_page: result.pagination?.current_page ?? 1,
      last_page: result.pagination?.last_page ?? 1,
      per_page: result.pagination?.per_page ?? 10,
      total: result.pagination?.total ?? 0,
      from: result.pagination?.from ?? 0,
      to: result.pagination?.to ?? 0,
    };
  },

  async getOne(id: number): Promise<CtwAttendenceResult> {
    const token = getToken();
    const result = await apiClient.get<{ success: boolean; data: CtwAttendenceResult }>(
      `/ctw-attendence-results/${id}`,
      token
    );
    return result.data;
  },

  async checkExisting(
    courseId: number,
    semesterId: number,
    attendenceTypeId: number,
    attendanceDate: string | null
  ): Promise<CtwAttendenceResult | null> {
    const token = getToken();
    const params = new URLSearchParams();
    params.set('course_id', String(courseId));
    params.set('semester_id', String(semesterId));
    params.set('attendence_type_id', String(attendenceTypeId));
    if (attendanceDate) {
      params.set('attendance_date', attendanceDate);
    }
    const result = await apiClient.get<{ success: boolean; data: CtwAttendenceResult | null }>(
      `/ctw-attendence-results/check-existing?${params.toString()}`,
      token
    );
    return result.data;
  },

  async create(data: CtwAttendenceResultFormData): Promise<CtwAttendenceResult> {
    const token = getToken();
    const result = await apiClient.post<{ success: boolean; data: CtwAttendenceResult }>(
      '/ctw-attendence-results',
      data,
      token
    );
    return result.data;
  },

  async update(id: number, data: Partial<CtwAttendenceResultFormData>): Promise<CtwAttendenceResult> {
    const token = getToken();
    const result = await apiClient.put<{ success: boolean; data: CtwAttendenceResult }>(
      `/ctw-attendence-results/${id}`,
      data,
      token
    );
    return result.data;
  },

  async delete(id: number): Promise<void> {
    const token = getToken();
    await apiClient.delete(`/ctw-attendence-results/${id}`, token);
  },

  async getSemesterWise(params?: { course_id?: number; page?: number; per_page?: number }): Promise<{
    data: {
      course_id: number;
      semester_id: number;
      total_sessions: number;
      present_count: number;
      absent_count: number;
      late_count: number;
      excused_count: number;
      course?: { id: number; name: string; code: string };
      semester?: { id: number; name: string; code: string };
    }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  }> {
    const query = new URLSearchParams();
    if (params?.course_id) query.set('course_id', String(params.course_id));
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    const token = getToken();
    const result = await apiClient.get<ApiPaginatedResult>(
      `/ctw-attendence-results-semester-wise?${query.toString()}`,
      token
    );
    return {
      data: (result.data ?? []) as any,
      current_page: result.pagination?.current_page ?? 1,
      last_page: result.pagination?.last_page ?? 1,
      per_page: result.pagination?.per_page ?? 10,
      total: result.pagination?.total ?? 0,
      from: result.pagination?.from ?? 0,
      to: result.pagination?.to ?? 0,
    };
  },

  async getCadetsForAttendance(
    courseId: number,
    semesterId: number
  ): Promise<CtwAttendenceCadetOption[]> {
    const token = getToken();
    const result = await apiClient.get<{ success: boolean; data: CtwAttendenceCadetOption[] }>(
      `/ctw-attendence-results-cadets?course_id=${courseId}&semester_id=${semesterId}`,
      token
    );
    return result.data ?? [];
  },

  async getAttendanceTypesByCourseSemester(
    courseId: number,
    semesterId: number
  ): Promise<{ id: number; name: string; short_name: string; total_sessions: number; present_count: number; absent_count: number; late_count: number; excused_count: number }[]> {
    const query = new URLSearchParams();
    query.set('course_id', String(courseId));
    query.set('semester_id', String(semesterId));
    const token = getToken();
    const result = await apiClient.get<{ success: boolean; data: { id: number; name: string; short_name: string; total_sessions: number; present_count: number; absent_count: number; late_count: number; excused_count: number }[] }>(
      `/ctw-attendence-results-types?${query.toString()}`,
      token
    );
    return result.data ?? [];
  },

  async getAttendanceByTypeForMonth(
    courseId: number,
    semesterId: number,
    attendenceTypeId: number,
    year: number,
    month: number
  ): Promise<CtwAttendenceResult[]> {
    const query = new URLSearchParams();
    query.set('course_id', String(courseId));
    query.set('semester_id', String(semesterId));
    query.set('attendence_type_id', String(attendenceTypeId));
    query.set('year', String(year));
    query.set('month', String(month));
    const token = getToken();
    const result = await apiClient.get<{ success: boolean; data: CtwAttendenceResult[] }>(
      `/ctw-attendence-results-by-type?${query.toString()}`,
      token
    );
    return result.data ?? [];
  },
};
