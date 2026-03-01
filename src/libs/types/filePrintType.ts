export interface FilePrintType {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FilePrintTypeCreateData {
  name: string;
  code: string;
  is_active: boolean;
}

export interface FilePrintTypeUpdateData {
  name: string;
  code: string;
  is_active: boolean;
}

export interface FilePrintTypeQueryParams {
  search?: string;
  per_page?: number;
  page?: number;
  all?: boolean;
}

export interface FilePrintTypePaginatedResponse {
  current_page: number;
  data: FilePrintType[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: any[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}
