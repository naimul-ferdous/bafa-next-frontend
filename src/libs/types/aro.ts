/**
 * ARO (Academy Routine Orders) Types
 */

export type AroStatus = 'draft' | 'running' | 'expired' | 'archived';

export interface Aro {
  id: number;
  title: string | null;
  expired_date: string | null;
  file: string | null;
  status: AroStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AroCreateData {
  title: string;
  expired_date: string;
  status: AroStatus;
  file?: File;
}
