/**
 * Geo Location Service
 * API calls for Bangladesh geographical data (Divisions, Districts, Post Offices)
 */

import apiClient from '@/libs/auth/api-client';

export interface Division {
  id: number;
  name: string;
  bn_name: string;
}

export interface District {
  id: number;
  division_id: number;
  name: string;
  bn_name: string;
}

export interface PostOffice {
  id: number;
  district_id: number;
  name: string;
  bn_name: string;
  post_code?: string;
}

interface GeoApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const geoLocationService = {
  /**
   * Get all divisions
   */
  async getDivisions(): Promise<Division[]> {
    try {
      const result = await apiClient.get<GeoApiResponse<Division[]>>('/geo/divisions');
      if (result.success) {
        return result.data || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch divisions:', error);
      return [];
    }
  },

  /**
   * Get districts by division ID
   */
  async getDistricts(divisionId: number): Promise<District[]> {
    try {
      const result = await apiClient.get<GeoApiResponse<District[]>>(`/geo/division/${divisionId}/districts`);
      if (result.success) {
        return result.data || [];
      }
      return [];
    } catch (error) {
      console.error(`Failed to fetch districts for division ${divisionId}:`, error);
      return [];
    }
  },

  /**
   * Get post offices by district ID
   */
  async getPostOffices(districtId: number): Promise<PostOffice[]> {
    try {
      const result = await apiClient.get<GeoApiResponse<PostOffice[]>>(`/geo/district/${districtId}/post-offices`);
      if (result.success) {
        return result.data || [];
      }
      return [];
    } catch (error) {
      console.error(`Failed to fetch post offices for district ${districtId}:`, error);
      return [];
    }
  },
};

export default geoLocationService;
