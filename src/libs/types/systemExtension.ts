export interface SystemExtension {
  id: number;
  name: string;
  role_id: number;
  role?: { id: number; name: string; slug?: string } | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
}
