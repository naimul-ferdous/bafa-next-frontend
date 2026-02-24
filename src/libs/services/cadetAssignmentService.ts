import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface AssignmentData {
  cadet_id: number;
  start_date: string;
  end_date?: string;
  description?: string;
}

export interface RankAssignmentData extends AssignmentData {
  rank_id: number;
}

export interface CourseAssignmentData extends AssignmentData {
  course_id: number;
}

export interface SemesterAssignmentData extends AssignmentData {
  semester_id: number;
}

export interface WingAssignmentData extends AssignmentData {
  wing_id: number;
}

export interface SubWingAssignmentData extends AssignmentData {
  sub_wing_id: number;
}

export interface ProgramAssignmentData extends AssignmentData {
  program_id: number;
}

export interface GroupAssignmentData extends AssignmentData {
  group_id: number;
}

export const cadetAssignmentService = {
  // Rank Assignments
  assignRank: async (data: RankAssignmentData) => {
    const token = getToken();
    const response = await apiClient.post('/cadet-assignments/ranks', data, token);
    return response.data;
  },

  getCadetRanks: async (cadetId: number) => {
    const token = getToken();
    const response = await apiClient.get(`/cadet-assignments/ranks/${cadetId}`, token);
    return response.data;
  },

  updateRankAssignment: async (id: number, data: Partial<RankAssignmentData>) => {
    const token = getToken();
    const response = await apiClient.put(`/cadet-assignments/ranks/${id}`, data, token);
    return response.data;
  },

  removeRankAssignment: async (id: number) => {
    const token = getToken();
    const response = await apiClient.delete(`/cadet-assignments/ranks/${id}`, token);
    return response;
  },

  // Course Assignments
  assignCourse: async (data: CourseAssignmentData) => {
    const token = getToken();
    const response = await apiClient.post('/cadet-assignments/courses', data, token);
    return response.data;
  },

  getCadetCourses: async (cadetId: number) => {
    const token = getToken();
    const response = await apiClient.get(`/cadet-assignments/courses/${cadetId}`, token);
    return response.data;
  },

  updateCourseAssignment: async (id: number, data: Partial<CourseAssignmentData>) => {
    const token = getToken();
    const response = await apiClient.put(`/cadet-assignments/courses/${id}`, data, token);
    return response.data;
  },

  removeCourseAssignment: async (id: number) => {
    const token = getToken();
    const response = await apiClient.delete(`/cadet-assignments/courses/${id}`, token);
    return response;
  },

  // Semester Assignments
  assignSemester: async (data: SemesterAssignmentData) => {
    const token = getToken();
    const response = await apiClient.post('/cadet-assignments/semesters', data, token);
    return response.data;
  },

  getCadetSemesters: async (cadetId: number) => {
    const token = getToken();
    const response = await apiClient.get(`/cadet-assignments/semesters/${cadetId}`, token);
    return response.data;
  },

  updateSemesterAssignment: async (id: number, data: Partial<SemesterAssignmentData>) => {
    const token = getToken();
    const response = await apiClient.put(`/cadet-assignments/semesters/${id}`, data, token);
    return response.data;
  },

  removeSemesterAssignment: async (id: number) => {
    const token = getToken();
    const response = await apiClient.delete(`/cadet-assignments/semesters/${id}`, token);
    return response;
  },

  // Wing Assignments
  assignWing: async (data: WingAssignmentData) => {
    const token = getToken();
    const response = await apiClient.post('/cadet-assignments/wings', data, token);
    return response.data;
  },

  getCadetWings: async (cadetId: number) => {
    const token = getToken();
    const response = await apiClient.get(`/cadet-assignments/wings/${cadetId}`, token);
    return response.data;
  },

  updateWingAssignment: async (id: number, data: Partial<WingAssignmentData>) => {
    const token = getToken();
    const response = await apiClient.put(`/cadet-assignments/wings/${id}`, data, token);
    return response.data;
  },

  removeWingAssignment: async (id: number) => {
    const token = getToken();
    const response = await apiClient.delete(`/cadet-assignments/wings/${id}`, token);
    return response;
  },

  // Sub-Wing Assignments
  assignSubWing: async (data: SubWingAssignmentData) => {
    const token = getToken();
    const response = await apiClient.post('/cadet-assignments/subwings', data, token);
    return response.data;
  },

  getCadetSubWings: async (cadetId: number) => {
    const token = getToken();
    const response = await apiClient.get(`/cadet-assignments/subwings/${cadetId}`, token);
    return response.data;
  },

  updateSubWingAssignment: async (id: number, data: Partial<SubWingAssignmentData>) => {
    const token = getToken();
    const response = await apiClient.put(`/cadet-assignments/subwings/${id}`, data, token);
    return response.data;
  },

  removeSubWingAssignment: async (id: number) => {
    const token = getToken();
    const response = await apiClient.delete(`/cadet-assignments/subwings/${id}`, token);
    return response;
  },

  // Program Assignments
  assignProgram: async (data: ProgramAssignmentData) => {
    const token = getToken();
    const response = await apiClient.post('/cadet-assignments/programs', data, token);
    return response.data;
  },

  getCadetPrograms: async (cadetId: number) => {
    const token = getToken();
    const response = await apiClient.get(`/cadet-assignments/programs/${cadetId}`, token);
    return response.data;
  },

  updateProgramAssignment: async (id: number, data: Partial<ProgramAssignmentData>) => {
    const token = getToken();
    const response = await apiClient.put(`/cadet-assignments/programs/${id}`, data, token);
    return response.data;
  },

  removeProgramAssignment: async (id: number) => {
    const token = getToken();
    const response = await apiClient.delete(`/cadet-assignments/programs/${id}`, token);
    return response;
  },

  // Group Assignments
  assignGroup: async (data: GroupAssignmentData) => {
    const token = getToken();
    const response = await apiClient.post('/cadet-assignments/groups', data, token);
    return response.data;
  },

  getCadetGroups: async (cadetId: number) => {
    const token = getToken();
    const response = await apiClient.get(`/cadet-assignments/groups/${cadetId}`, token);
    return response.data;
  },

  updateGroupAssignment: async (id: number, data: Partial<GroupAssignmentData>) => {
    const token = getToken();
    const response = await apiClient.put(`/cadet-assignments/groups/${id}`, data, token);
    return response.data;
  },

  removeGroupAssignment: async (id: number) => {
    const token = getToken();
    const response = await apiClient.delete(`/cadet-assignments/groups/${id}`, token);
    return response;
  },
};
