/**
 * Authentication Service
 * API calls for authentication and user management
 */

import apiClient from '@/libs/auth/api-client';
import {
  LoginResponse,
  CurrentUserResponse,
  RefreshTokenResponse,
  LogoutResponse,
  ChangePasswordResponse,
  ProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  PermissionsResponse,
  RolesResponse,
  WingsResponse,
  MenusResponse,
} from '@/libs/types';
import { getToken } from '@/libs/auth/auth-token';

class AuthService {
  // Get fresh token on each call instead of caching it
  private getAuthToken(): string | undefined {
    return getToken();
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      { email, password }
    );

    return response;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<CurrentUserResponse> {
    const token = this.getAuthToken();
    const response = await apiClient.get<CurrentUserResponse>('/auth/me', token);
    return response;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>(
      '/auth/refresh',
      { refresh_token: refreshToken }
    );

    return response;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<LogoutResponse> {
    const token = this.getAuthToken();
    const response = await apiClient.post<LogoutResponse>('/auth/logout', {}, token);
    return response;
  }

  /**
   * Change user password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ): Promise<ChangePasswordResponse> {
    const token = this.getAuthToken();
    const response = await apiClient.post<ChangePasswordResponse>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    }, token);

    return response;
  }

  /**
   * Get user profile with all relationships
   */
  async getProfile(): Promise<ProfileResponse> {
    const token = this.getAuthToken();
    const response = await apiClient.get<ProfileResponse>('/profile', token);
    return response;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const token = this.getAuthToken();
    const response = await apiClient.put<UpdateProfileResponse>('/profile', data, token);
    return response;
  }

  /**
   * Get user permissions
   */
  async getPermissions(): Promise<PermissionsResponse> {
    const token = this.getAuthToken();
    const response = await apiClient.get<PermissionsResponse>('/profile/permissions', token);
    return response;
  }

  /**
   * Get user roles
   */
  async getRoles(): Promise<RolesResponse> {
    const token = this.getAuthToken();
    const response = await apiClient.get<RolesResponse>('/profile/roles', token);
    return response;
  }

  /**
   * Get user accessible wings
   */
  async getWings(): Promise<WingsResponse> {
    const token = this.getAuthToken();
    const response = await apiClient.get<WingsResponse>('/profile/wings', token);
    return response;
  }
}

export const authService = new AuthService();
export default AuthService;

/**
 * Menu Service
 */
export const menuService = {
  /**
   * Get accessible menus for current user
   */
  async getUserMenus(): Promise<MenusResponse> {
    const token = getToken();
    const response = await apiClient.get<MenusResponse>('/menus/user', token);
    return response;
  },
};
