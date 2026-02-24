/**
 * Authentication Types
 */

import { User, Permission, Role, Wing, SubWing, Menu } from './user';
import { ApiResponse } from './api';

// Re-export User and other types from user module
export type { User, Permission, Role, Wing, SubWing, Menu };

// ============================================================================
// Login & Authentication
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
  refresh_token: string;
}

export interface LoginErrorResponse extends ApiResponse {
  success: false;
  message: string;
}

// ============================================================================
// Token Management
// ============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  token: string;
  refresh_token: string;
}

// ============================================================================
// Auth State
// ============================================================================

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// ============================================================================
// Current User
// ============================================================================

export interface CurrentUserResponse {
  user: User;
  menus?: Menu[];
}

// ============================================================================
// Password Management
// ============================================================================

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface ChangePasswordResponse extends ApiResponse {
  success: true;
  message: string;
}

// ============================================================================
// Profile
// ============================================================================

export interface ProfileResponse extends ApiResponse {
  success: true;
  data: User;
}

export interface UpdateProfileRequest {
  name?: string;
  contact_number?: string;
  blood_group?: string;
}

export interface UpdateProfileResponse extends ApiResponse {
  success: true;
  message: string;
  data: User;
}

// ============================================================================
// Permissions
// ============================================================================

export interface PermissionsResponse extends ApiResponse {
  success: true;
  data: {
    permissions: Permission[];
    permission_codes: string[];
    total: number;
  };
}

// ============================================================================
// Roles
// ============================================================================

export interface RolesResponse extends ApiResponse {
  success: true;
  data: {
    assignments: Array<{
      id: number;
      role: Role;
      wing: Wing;
      sub_wing: SubWing | null;
      assigned_at: string;
    }>;
    total: number;
  };
}

// ============================================================================
// Wings
// ============================================================================

export interface WingsResponse extends ApiResponse {
  success: true;
  data: {
    primary_wing: Wing;
    primary_sub_wing: SubWing | null;
    accessible_wings: Wing[];
    accessible_sub_wings: SubWing[];
  };
}

// ============================================================================
// Menus
// ============================================================================

export interface MenusResponse extends ApiResponse {
  success: true;
  data: Menu[];
  meta: {
    user_id: number;
    user_type: 'official' | 'cadet';
    total_menus: number;
  };
}

// ============================================================================
// Logout
// ============================================================================

export interface LogoutResponse extends ApiResponse {
  success: true;
  message: string;
}

// ============================================================================
// Context Types
// ============================================================================

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  menus: Menu[];
  userIsSuperAdmin: boolean;
  userIsSystemAdmin: boolean;
}
