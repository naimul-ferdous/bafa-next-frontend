import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { Ftw12sqnFlyingSyllabusGlobalNote } from '@/libs/types/ftw12sqnFlying';

export const ftw12sqnFlyingSyllabusGlobalNoteService = {
  async getAll(): Promise<Ftw12sqnFlyingSyllabusGlobalNote[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: Ftw12sqnFlyingSyllabusGlobalNote[] }>(
        '/ftw-12sqn-flying-syllabus-global-notes',
        token
      );
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch global notes:', error);
      return [];
    }
  },

  async create(data: { note: string; is_active?: boolean }): Promise<Ftw12sqnFlyingSyllabusGlobalNote | null> {
    try {
      const token = getToken();
      const result = await apiClient.post<{ success: boolean; data: Ftw12sqnFlyingSyllabusGlobalNote }>(
        '/ftw-12sqn-flying-syllabus-global-notes',
        data,
        token
      );
      return result?.data || null;
    } catch (error) {
      console.error('Failed to create global note:', error);
      return null;
    }
  },

  async update(noteId: number, data: { note?: string; is_active?: boolean }): Promise<Ftw12sqnFlyingSyllabusGlobalNote | null> {
    try {
      const token = getToken();
      const result = await apiClient.put<{ success: boolean; data: Ftw12sqnFlyingSyllabusGlobalNote }>(
        `/ftw-12sqn-flying-syllabus-global-notes/${noteId}`,
        data,
        token
      );
      return result?.data || null;
    } catch (error) {
      console.error('Failed to update global note:', error);
      return null;
    }
  },

  async delete(noteId: number): Promise<boolean> {
    try {
      const token = getToken();
      await apiClient.delete(`/ftw-12sqn-flying-syllabus-global-notes/${noteId}`, token);
      return true;
    } catch (error) {
      console.error('Failed to delete global note:', error);
      return false;
    }
  },
};
