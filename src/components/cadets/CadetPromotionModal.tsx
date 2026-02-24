/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { cadetService } from "@/libs/services/cadetService";
import { semesterService } from "@/libs/services/semesterService";
import FullLogo from "@/components/ui/fulllogo";
import { Icon } from "@iconify/react";
import { CadetProfile } from "@/libs/types/user";
import { SystemSemester } from "@/libs/types/system";

interface CadetPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cadet: CadetProfile | null;
  onSuccess: () => void;
}

export default function CadetPromotionModal({ isOpen, onClose, cadet, onSuccess }: CadetPromotionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  
  const [formData, setFormData] = useState({
    next_semester_id: "",
    start_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadSemesters();
      setFormData({
        next_semester_id: "",
        start_date: new Date().toISOString().split("T")[0],
        description: "",
      });
      setError("");
    }
  }, [isOpen]);

  const loadSemesters = async () => {
    try {
      const response = await semesterService.getAllSemesters({ per_page: 100 });
      setSemesters(response.data);
    } catch (err: any) {
      console.error("Failed to load semesters:", err);
      setError("Failed to load semesters.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadet) return;

    const currentSemesterAssignment = cadet.assigned_semesters?.find(s => s.is_current);
    if (!currentSemesterAssignment) {
      setError("Cadet has no current semester assignment to promote from.");
      return;
    }

    if (!formData.next_semester_id) {
      setError("Please select the next semester.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await cadetService.promoteSemester(cadet.id, {
        current_semester_assignment_id: currentSemesterAssignment.id,
        next_semester_id: Number(formData.next_semester_id),
        start_date: formData.start_date,
        description: formData.description || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to promote cadet:", err);
      setError(err.response?.data?.message || err.message || "Failed to promote cadet.");
    } finally {
      setLoading(false);
    }
  };

  const currentSemester = cadet?.assigned_semesters?.find(s => s.is_current)?.semester;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true} className="max-w-xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col items-center mb-6">
          <FullLogo />
          <h2 className="text-xl font-bold text-gray-900 mt-4">Promote Cadet</h2>
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
            <Label>Current Semester</Label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
              {currentSemester?.name || "Not Assigned"}
            </div>
          </div>

          <div>
            <Label>Next Semester <span className="text-red-500">*</span></Label>
            <select
              value={formData.next_semester_id}
              onChange={(e) => setFormData({ ...formData, next_semester_id: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Next Semester...</option>
              {semesters
                .filter(s => s.id !== currentSemester?.id)
                .map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Promotion Date <span className="text-red-500">*</span></Label>
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
              placeholder="Add any remarks for this promotion..."
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
            Promote Cadet
          </button>
        </div>
      </form>
    </Modal>
  );
}
