/**
 * Menu and Permission Types
 */

export interface Permission {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  module: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  pivot?: PermissionPivot;
}

export interface PermissionPivot {
  menu_id: number;
  permission_id: number;
}

export interface Menu {
  id: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  icon?: string | null;
  route?: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent?: Menu | null;
  children?: Menu[];
  permissions?: Permission[];
}

/**
 * Menu Service API Types
 */
export interface MenuQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface MenuCreateData {
  name: string;
  slug: string;
  icon?: string;
  route?: string;
  parent_id?: number | null;
  order: number;
  is_active: boolean;
}

export interface MenuPaginatedResponse {
  data: Menu[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

/**
 * API Response Types
 */
export interface MenuApiResponse {
  success: boolean;
  message: string;
  data: Menu[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface SingleMenuApiResponse {
  success: boolean;
  message: string;
  data: Menu;
}

export interface MenuArrayApiResponse {
  success: boolean;
  message: string;
  data: Menu[];
}

export interface MenuActionApiResponse {
  success: boolean;
  message: string;
  data?: Menu | null;
}
