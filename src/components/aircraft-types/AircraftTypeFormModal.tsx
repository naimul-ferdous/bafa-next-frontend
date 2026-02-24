/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { aircraftService } from "@/libs/services/aircraftService";
import { useAircraftTypeModal } from "@/context/AircraftTypeModalContext";
import FullLogo from "@/components/ui/fulllogo";

export default function AircraftTypeFormModal() {
  const { isOpen, editingAircraftType, closeModal } = useAircraftTypeModal();
  const [formData, setFormData] = useState({
    title: "",
    status: "active" as "active" | "deactive",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingAircraftType) {
      setFormData({
        title: editingAircraftType.title,
        status: editingAircraftType.status,
      });
    } else {
      setFormData({
        title: "",
        status: "active",
      });
    }
    setError("");
  }, [editingAircraftType, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingAircraftType) {
        await aircraftService.updateAircraftType(editingAircraftType.id, formData);
      } else {
        await aircraftService.createAircraftType(formData);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('aircraftTypeUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save aircraft type");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-2xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col items-center mb-6">
          <div><FullLogo /></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingAircraftType ? "Edit Aircraft Type" : "Add Aircraft Type"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingAircraftType ? "Update aircraft type details" : "Register a new aircraft type in the system"}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Aircraft Type Title <span className="text-red-500">*</span></Label>
            <Input value={formData.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="e.g. PT-6, K-8W" required />
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="status" checked={formData.status === "active"} onChange={() => handleChange("status", "active")} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This type will be available for aircraft assignments.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="status" checked={formData.status === "deactive"} onChange={() => handleChange("status", "deactive")} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This type will be disabled.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-2">
          <button type="button" className="px-6 py-2 border border-gray-300 text-black rounded-xl" onClick={closeModal} disabled={loading}>Cancel</button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>{loading ? "Saving..." : editingAircraftType ? "Update Type" : "Save Type"}</button>
        </div>
      </form>
    </Modal>
  );
}
