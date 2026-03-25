import apiClient from "@/libs/auth/api-client";
import { getToken } from "@/libs/auth/auth-token";

export interface ActivityLogEntry {
  id: number;
  user_id: number | null;
  action: string;
  model_type: string;
  model_id: number | null;
  message: string;
  created_at: string;
  user?: { id: number; name: string } | null;
}

const activityLogService = {
  async getChartData(view: "daily" | "monthly" | "yearly"): Promise<(number | null)[]> {
    const token = getToken();
    const res = await apiClient.get<{ data: { data: (number | null)[] } }>(`/activity-logs/chart?view=${view}`, token ?? undefined);
    return res.data.data;
  },

  async getRecent(limit = 10): Promise<ActivityLogEntry[]> {
    const token = getToken();
    const res = await apiClient.get<{ data: ActivityLogEntry[] }>(`/activity-logs/recent?limit=${limit}`, token ?? undefined);
    return res.data;
  },
};

export default activityLogService;
