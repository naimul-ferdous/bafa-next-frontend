/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { ftw12sqnResultsBupAdjustMarkGradingService } from "@/libs/services/ftw12sqnResultsBupAdjustMarkGradingService";
import { useFtw12sqnAdjustedModal } from "@/context/Ftw12sqnAdjustedModalContext";
import FullLogo from "@/components/ui/fulllogo";

export default function Ftw12sqnAdjustedFormModal() {
  const { isOpen, editingRecord, closeModal } = useFtw12sqnAdjustedModal();
  const [formData, setFormData] = useState({
    obtain_mark: "",
    adjusted_mark: "",
    grade: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        obtain_mark: editingRecord.obtain_mark != null ? String(editingRecord.obtain_mark) : "",
        adjusted_mark: editingRecord.adjusted_mark != null ? String(editingRecord.adjusted_mark) : "",
        grade: editingRecord.grade || "",
      });
    } else {
      setFormData({
        obtain_mark: "",
        adjusted_mark: "",
        grade: "",
      });
    }
    setError("");
  }, [editingRecord, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        obtain_mark: formData.obtain_mark === "" ? null : Number(formData.obtain_mark),
        adjusted_mark: formData.adjusted_mark === "" ? null : Number(formData.adjusted_mark),
        grade: formData.grade || null,
      };
      if (editingRecord) {
        await ftw12sqnResultsBupAdjustMarkGradingService.update(editingRecord.id, payload);
      } else {
        await ftw12sqnResultsBupAdjustMarkGradingService.create(payload);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('ftw12sqnAdjustedUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-2xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-6">
          <div>
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingRecord ? "Edit Record" : "Add a New Record"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingRecord ? "Update adjust mark grading details" : "Configure your new adjust mark grading details"}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Obtain Mark <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                value={formData.obtain_mark}
                onChange={(e) => handleChange("obtain_mark", e.target.value)}
                placeholder="Enter obtain mark"
                required
              />
            </div>

            <div>
              <Label>
                Adjusted Mark <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                value={formData.adjusted_mark}
                onChange={(e) => handleChange("adjusted_mark", e.target.value)}
                placeholder="Enter adjusted mark"
                required
              />
            </div>
          </div>

          <div>
            <Label>
              Grade <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.grade}
              onChange={(e) => handleChange("grade", e.target.value)}
              placeholder="Enter grade"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-2 pt-2">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-black rounded-xl"
            onClick={closeModal}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>
            {loading ? "Saving..." : editingRecord ? "Update Record" : "Save Record"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
