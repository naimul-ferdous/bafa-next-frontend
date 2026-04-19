import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { Ftw12sqnGroundSyllabusSimulatorGlobalNote } from '@/libs/types/ftw12sqnFlying';

const BASE = '/ftw-12sqn-ground-syllabus-simulator-global-notes';

export const ftw12sqnGroundSyllabusSimulatorGlobalNoteService = {
  async getAll(): Promise<Ftw12sqnGroundSyllabusSimulatorGlobalNote[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: Ftw12sqnGroundSyllabusSimulatorGlobalNote[] }>(
        BASE,
        token
      );
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch simulator global notes:', error);
      return [];
    }
  },

  async create(data: { note: string; is_active?: boolean }): Promise<Ftw12sqnGroundSyllabusSimulatorGlobalNote | null> {
    try {
      const token = getToken();
      const result = await apiClient.post<{ success: boolean; data: Ftw12sqnGroundSyllabusSimulatorGlobalNote }>(
        BASE,
        data,
        token
      );
      return result?.data || null;
    } catch (error) {
      console.error('Failed to create simulator global note:', error);
      return null;
    }
  },

  async update(noteId: number, data: { note?: string; is_active?: boolean }): Promise<Ftw12sqnGroundSyllabusSimulatorGlobalNote | null> {
    try {
      const token = getToken();
      const result = await apiClient.put<{ success: boolean; data: Ftw12sqnGroundSyllabusSimulatorGlobalNote }>(
        `${BASE}/${noteId}`,
        data,
        token
      );
      return result?.data || null;
    } catch (error) {
      console.error('Failed to update simulator global note:', error);
      return null;
    }
  },

  async delete(noteId: number): Promise<boolean> {
    try {
      const token = getToken();
      await apiClient.delete(`${BASE}/${noteId}`, token);
      return true;
    } catch (error) {
      console.error('Failed to delete simulator global note:', error);
      return false;
    }
  },
};
