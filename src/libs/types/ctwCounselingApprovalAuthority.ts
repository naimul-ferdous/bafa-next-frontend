export interface CtwCounselingApprovalAuthority {
  id: number;
  role_id: number | null;
  user_id: number | null;
  sort: number;
  is_cadet_approve: boolean;
  is_final: boolean;
  is_active: boolean;
  role?: {
    id: number;
    name: string;
  } | null;
  user?: {
    id: number;
    name: string;
  } | null;
}
