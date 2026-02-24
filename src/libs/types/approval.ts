/**
 * Approval System Types - Following Backend Architecture
 */

import type { Role, User } from './user';

// ==================== APPROVAL PROCESS TYPES ====================
// Defines the approval hierarchy/levels

export interface ApprovalProcess {
  id: number;
  status_code: string;
  role_id: number;
  description?: string;
  is_first?: boolean;      // True if this is the first step (e.g., Instructor)
  is_final?: boolean;      // True if this is the final approval step
  no_need_forward?: boolean; // True if this role only approves cadets without forwarding
  status: 'active' | 'inactive' | 'draft';
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  role?: Role;
  creator?: User;
}

export interface ApprovalProcessCreateData {
  status_code: string;
  role_id: number;
  description?: string;
  is_first?: boolean;
  is_final?: boolean;
  no_need_forward?: boolean;
  status: 'active' | 'inactive' | 'draft';
}

export interface ApprovalProcessQueryParams {
  page?: number;
  per_page?: number;
  status?: 'active' | 'inactive' | 'draft';
  role_id?: number;
  allData?: boolean;
}

// ==================== APPROVAL STATUS TYPES ====================
// Overall approval status per course/semester

export interface ApprovalStatus {
  id: number;
  course_id: number;
  semester_id: number;
  exam_type: string;
  progress_id?: number;
  send_progress_id?: number;
  next_progress_id?: number;
  status: 'active' | 'inactive' | 'draft';
  approval_status?: 'pending' | 'approved' | 'rejected';
  remark?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: {
    id: number;
    name: string;
    code?: string;
  };
  semester?: {
    id: number;
    name: string;
    code?: string;
  };
  creator?: User;
  approvalProcess?: ApprovalProcess;
  sendProgress?: ApprovalProcess;
  nextProgress?: ApprovalProcess;
}

export interface ApprovalStatusCreateData {
  course_id: number;
  semester_id: number;
  exam_type?: string;
  progress_id?: number;
  send_progress_id?: number;
  next_progress_id?: number;
  status: 'active' | 'inactive' | 'draft';
  approval_status?: 'pending' | 'approved' | 'rejected';
  remark?: string;
}

export interface ApprovalStatusQueryParams {
  page?: number;
  per_page?: number;
  course_id?: number;
  semester_id?: number;
  progress_id?: number;
  status?: 'active' | 'inactive' | 'draft';
  approval_status?: 'pending' | 'approved' | 'rejected';
  allData?: boolean;
}

// ==================== CADET APPROVAL STATUS TYPES ====================
// Per-cadet approval status

export interface CadetApprovalStatus {
  id: number;
  cadet_id: number;
  course_id: number;
  semester_id: number;
  progress_id: number;
  send_progress_id?: number;
  next_progress_id?: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  remark?: string;
  approved_by?: number;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
  cadet?: {
    id: number;
    name: string;
    bd_no?: string;
    bdno?: string;
    cadet_number?: string;
    rank?: {
      id: number;
      name: string;
    };
  };
  course?: {
    id: number;
    name: string;
  };
  semester?: {
    id: number;
    name: string;
  };
  approver?: User;
  approvalProcess?: ApprovalProcess;
  sendProgress?: ApprovalProcess;
  nextProgress?: ApprovalProcess;
}

export interface CadetApprovalStatusCreateData {
  cadet_id: number;
  course_id: number;
  semester_id: number;
  progress_id: number;
  send_progress_id?: number;
  next_progress_id?: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  remark?: string;
}

export interface CadetApprovalStatusQueryParams {
  page?: number;
  per_page?: number;
  cadet_id?: number;
  course_id?: number;
  semester_id?: number;
  progress_id?: number;
  approval_status?: 'pending' | 'approved' | 'rejected';
  allData?: boolean;
}

export interface BulkApproveData {
  cadet_ids: number[];
  course_id: number;
  semester_id: number;
  progress_id: number;
  send_progress_id?: number;
  next_progress_id?: number;
  remark?: string;
}

// ==================== APPROVAL SUMMARY TYPES ====================

export interface ApprovalSummary {
  total_cadets: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  all_approved: boolean;
  has_rejected: boolean;
  can_forward: boolean;
}

// ==================== UI HELPER TYPES ====================

export interface ApprovalStatusItem {
  roleName: string;
  text: string;
  timestamp: string | null;
  color: string;
  icon: string;
  isResubmission: boolean;
  remark: string | null;
  nextProgressId: number | null;
  processId: number;
  isPending: boolean;
  isCurrentStage?: boolean;
}

// ==================== PAGINATED RESPONSE TYPES ====================

export interface ApprovalProcessPaginatedResponse {
  data: ApprovalProcess[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface ApprovalStatusPaginatedResponse {
  data: ApprovalStatus[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface CadetApprovalStatusPaginatedResponse {
  data: CadetApprovalStatus[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}
