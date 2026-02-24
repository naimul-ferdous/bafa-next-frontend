import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { AircraftType, Aircraft } from '@/libs/types/aircraft';

export const aircraftService = {
  // Aircraft Type Methods
  async getAllAircraftTypes(params?: any) {
    const token = getToken();
    // Filter out undefined, null, or empty values
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const query = new URLSearchParams(cleanParams).toString();
    return await apiClient.get<any>(`/aircraft-types${query ? `?${query}` : ''}`, token);
  },

  async getAircraftType(id: number) {
    const token = getToken();
    return await apiClient.get<any>(`/aircraft-types/${id}`, token);
  },

  async createAircraftType(data: Partial<AircraftType>) {
    const token = getToken();
    return await apiClient.post<any>('/aircraft-types', data, token);
  },

  async updateAircraftType(id: number, data: Partial<AircraftType>) {
    const token = getToken();
    return await apiClient.put<any>(`/aircraft-types/${id}`, data, token);
  },

  async deleteAircraftType(id: number) {
    const token = getToken();
    return await apiClient.delete<any>(`/aircraft-types/${id}`, token);
  },

  // Aircraft Methods
  async getAllAircrafts(params?: any) {
    const token = getToken();
    // Filter out undefined, null, or empty values
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const query = new URLSearchParams(cleanParams).toString();
    return await apiClient.get<any>(`/aircrafts${query ? `?${query}` : ''}`, token);
  },

  async getAircraft(id: number) {
    const token = getToken();
    return await apiClient.get<any>(`/aircrafts/${id}`, token);
  },

  async createAircraft(data: Partial<Aircraft>) {
    const token = getToken();
    return await apiClient.post<any>('/aircrafts', data, token);
  },

  async updateAircraft(id: number, data: Partial<Aircraft>) {
    const token = getToken();
    return await apiClient.put<any>(`/aircrafts/${id}`, data, token);
  },

  async deleteAircraft(id: number) {
    const token = getToken();
    return await apiClient.delete<any>(`/aircrafts/${id}`, token);
  },
};
