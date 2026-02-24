/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { cadetService } from "@/libs/services/cadetService";
import FullLogo from "@/components/ui/fulllogo";
import { Icon } from "@iconify/react";
import { CadetProfile } from "@/libs/types/user";

interface CadetPostponeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cadet: CadetProfile | null;
  onSuccess: () => void;
}

export default function CadetPostponeModal({ isOpen, onClose, cadet, onSuccess }: CadetPostponeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    postpone_date: new Date().toISOString().split("T")[0],
    reason: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        postpone_date: new Date().toISOString().split("T")[0],
        reason: "",
      });
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadet) return;

    if (!formData.reason) {
      setError("Please provide a reason for postponement.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await cadetService.postponeCadet(cadet.id, {
        postpone_date: formData.postpone_date,
        reason: formData.reason,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to postpone cadet:", err);
      setError(err.response?.data?.message || err.message || "Failed to postpone cadet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true} className="max-w-xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col items-center mb-6">
          <FullLogo />
          <h2 className="text-xl font-bold text-gray-900 mt-4 text-center uppercase tracking-wide">Postpone Cadet</h2>
          <p className="text-sm text-gray-500 font-medium">
            {cadet ? `${cadet.name} (${cadet.cadet_number})` : ""}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm flex items-center gap-3">
            <Icon icon="hugeicons:alert-circle" className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-6">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Note:</strong> Postponing a cadet will set their status to <span className="font-bold">Postponed</span> and automatically deactivate (<span className="font-bold font-mono">is_current = 0</span>) all their current assignments including Course, Semester, Program, Branch, Group, and Rank.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <Label>Postpone Date <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              value={formData.postpone_date}
              onChange={(e) => setFormData({ ...formData, postpone_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Reason <span className="text-red-500">*</span></Label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide reason for postponement (e.g. medical leave, personal issues)..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 flex items-center gap-2 font-bold shadow-lg shadow-amber-200 transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading && <Icon icon="hugeicons:fan-01" className="animate-spin w-4 h-4" />}
            Postpone Cadet
          </button>
        </div>
      </form>
    </Modal>
  );
}
