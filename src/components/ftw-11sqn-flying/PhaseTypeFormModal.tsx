/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { ftw11sqnFlyingPhaseTypeService } from "@/libs/services/ftw11sqnFlyingPhaseTypeService";
import { useFtw11sqnFlyingPhaseTypeModal } from "@/context/Ftw11sqnFlyingPhaseTypeModalContext";
import FullLogo from "@/components/ui/fulllogo";

export default function PhaseTypeFormModal() {
  const { isOpen, editingType, viewingType, isViewMode, closeModal } = useFtw11sqnFlyingPhaseTypeModal();
  const [formData, setFormData] = useState({
    type_name: "",
    type_code: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingType) {
      setFormData({
        type_name: editingType.type_name,
        type_code: editingType.type_code,
        is_active: editingType.is_active !== false,
      });
    } else if (viewingType) {
      setFormData({
        type_name: viewingType.type_name,
        type_code: viewingType.type_code,
        is_active: viewingType.is_active !== false,
      });
    } else {
      setFormData({
        type_name: "",
        type_code: "",
        is_active: true,
      });
    }
    setError("");
  }, [editingType, viewingType, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    setError("");
    setLoading(true);

    try {
      if (editingType) {
        await ftw11sqnFlyingPhaseTypeService.update(editingType.id, formData);
      } else {
        await ftw11sqnFlyingPhaseTypeService.create(formData);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('phaseTypeUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save phase type");
    } finally {
      setLoading(false);
    }
  };

  const displayData = viewingType || editingType;

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-2xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col items-center mb-6">
          <div><FullLogo /></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isViewMode ? "View Phase Type" : editingType ? "Edit Phase Type" : "Add a New Phase Type"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isViewMode ? "Phase type details" : editingType ? "Update phase type details" : "Configure your new phase type details"}
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
              <Label>Type Name <span className="text-red-500">*</span></Label>
              {isViewMode ? (
                <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{displayData?.type_name}</p>
              ) : (
                <Input value={formData.type_name} onChange={(e) => handleChange("type_name", e.target.value)} placeholder="e.g. Dual, Solo" required />
              )}
            </div>
            <div>
              <Label>Type Code <span className="text-red-500">*</span></Label>
              {isViewMode ? (
                <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-mono">{displayData?.type_code}</p>
              ) : (
                <Input value={formData.type_code} onChange={(e) => handleChange("type_code", e.target.value)} placeholder="e.g. dual, solo, " required />
              )}
            </div>
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            {isViewMode ? (
              <p className="px-4 py-2">
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${displayData?.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {displayData?.is_active ? "Active" : "Inactive"}
                </span>
              </p>
            ) : (
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="is_active_phase" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">This phase type will be available for use throughout the system.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="is_active_phase" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">This phase type will be hidden from general use.</div>
                  </div>
                </label>
              </div>
            )}
          </div>

          {isViewMode && displayData?.created_at && (
            <div>
              <Label>Created At</Label>
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                {new Date(displayData.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-2 pt-2">
          <button type="button" className="px-6 py-2 border border-gray-300 text-black rounded-xl" onClick={closeModal} disabled={loading}>
            {isViewMode ? "Close" : "Cancel"}
          </button>
          {!isViewMode && (
            <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>
              {loading ? "Saving..." : editingType ? "Update Phase Type" : "Save Phase Type"}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
