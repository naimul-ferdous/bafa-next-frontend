import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { Ftw12sqnFlyingSyllabusNote } from '@/libs/types/ftw12sqnFlying';

export const ftw12sqnFlyingSyllabusNoteService = {
  async getAll(syllabusId: number): Promise<Ftw12sqnFlyingSyllabusNote[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: Ftw12sqnFlyingSyllabusNote[] }>(
        `/ftw-12sqn-flying-syllabus/${syllabusId}/notes`,
        token
      );
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch syllabus notes:', error);
      return [];
    }
  },

  async create(syllabusId: number, data: { note: string; is_active?: boolean }): Promise<Ftw12sqnFlyingSyllabusNote | null> {
    try {
      const token = getToken();
      const result = await apiClient.post<{ success: boolean; data: Ftw12sqnFlyingSyllabusNote }>(
        `/ftw-12sqn-flying-syllabus/${syllabusId}/notes`,
        data,
        token
      );
      return result?.data || null;
    } catch (error) {
      console.error('Failed to create syllabus note:', error);
      return null;
    }
  },

  async update(syllabusId: number, noteId: number, data: { note?: string; is_active?: boolean }): Promise<Ftw12sqnFlyingSyllabusNote | null> {
    try {
      const token = getToken();
      const result = await apiClient.put<{ success: boolean; data: Ftw12sqnFlyingSyllabusNote }>(
        `/ftw-12sqn-flying-syllabus/${syllabusId}/notes/${noteId}`,
        data,
        token
      );
      return result?.data || null;
    } catch (error) {
      console.error('Failed to update syllabus note:', error);
      return null;
    }
  },

  async delete(syllabusId: number, noteId: number): Promise<boolean> {
    try {
      const token = getToken();
      await apiClient.delete(`/ftw-12sqn-flying-syllabus/${syllabusId}/notes/${noteId}`, token);
      return true;
    } catch (error) {
      console.error('Failed to delete syllabus note:', error);
      return false;
    }
  },
};
