/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { cadetAssignmentService } from "@/libs/services/cadetAssignmentService";
import { rankService } from "@/libs/services/rankService";
import FullLogo from "@/components/ui/fulllogo";
import { Icon } from "@iconify/react";
import { CadetProfile } from "@/libs/types/user";
import { Rank } from "@/libs/types";

interface CadetRankAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cadet: CadetProfile | null;
  onSuccess: () => void;
}

export default function CadetRankAssignmentModal({ isOpen, onClose, cadet, onSuccess }: CadetRankAssignmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ranks, setRanks] = useState<Rank[]>([]);
  
  const [formData, setFormData] = useState({
    rank_id: "",
    start_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadRanks();
      setFormData({
        rank_id: "",
        start_date: new Date().toISOString().split("T")[0],
        description: "",
      });
      setError("");
    }
  }, [isOpen]);

  const loadRanks = async () => {
    try {
      const response = await rankService.getAllRanks({ per_page: 100 });
      setRanks(response.data);
    } catch (err: any) {
      console.error("Failed to load ranks:", err);
      setError("Failed to load ranks.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadet) return;

    if (!formData.rank_id) {
      setError("Please select a rank.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await cadetAssignmentService.assignRank({
        cadet_id: cadet.id,
        rank_id: Number(formData.rank_id),
        start_date: formData.start_date,
        description: formData.description || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to assign rank:", err);
      setError(err.response?.data?.message || err.message || "Failed to assign rank.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true} className="max-w-xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col items-center mb-6">
          <FullLogo />
          <h2 className="text-xl font-bold text-gray-900 mt-4">Assign Rank</h2>
          <p className="text-sm text-gray-500">
            {cadet ? `${cadet.name} (${cadet.cadet_number})` : ""}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Rank <span className="text-red-500">*</span></Label>
            <select
              value={formData.rank_id}
              onChange={(e) => setFormData({ ...formData, rank_id: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Rank...</option>
              {ranks.map((rank) => (
                <option key={rank.id} value={rank.id}>
                  {rank.short_name} - {rank.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Assignment Date <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Remarks</Label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any remarks..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
            disabled={loading}
          >
            {loading && <Icon icon="hugeicons:fan-01" className="animate-spin w-4 h-4" />}
            Assign Rank
          </button>
        </div>
      </form>
    </Modal>
  );
}
