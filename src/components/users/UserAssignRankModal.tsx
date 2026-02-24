"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import FullLogo from "../ui/fulllogo";
import { Modal } from "@/components/ui/modal";
import { userService } from "@/libs/services/userService";
import { rankService } from "@/libs/services/rankService";
import type { User, Rank } from "@/libs/types/user";

interface UserAssignRankModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess?: () => void;
}

export default function UserAssignRankModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: UserAssignRankModalProps) {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRankId, setSelectedRankId] = useState<number | "">("");

  useEffect(() => {
    if (isOpen && user) {
      loadRanks();
      setSelectedRankId(user.rank_id || "");
    }
  }, [isOpen, user]);

  const loadRanks = async () => {
    setLoadingData(true);
    try {
      const response = await rankService.getAllRanks({ per_page: 1000 });
      setRanks(response.data.filter(r => r.is_active !== false));
    } catch (err) {
      console.error("Failed to load ranks:", err);
      setError("Failed to load ranks list");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await userService.updateUser(user.id, {
        rank_id: selectedRankId === "" ? undefined : Number(selectedRankId),
      });
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update rank");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton className="max-w-md">
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
            Assign User Rank
          </h2>
          <p className="text-sm text-gray-500">
            Select rank for {user?.name || "User"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {loadingData ? (
          <div className="flex items-center justify-center py-10">
            <Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Rank
              </label>
              <select
                value={selectedRankId}
                onChange={(e) => setSelectedRankId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Rank / Select Rank</option>
                {ranks.sort((a, b) => a.hierarchy_level - b.hierarchy_level).map((rank) => (
                  <option key={rank.id} value={rank.id}>
                    {rank.name} ({rank.short_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
                    Save Rank
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
