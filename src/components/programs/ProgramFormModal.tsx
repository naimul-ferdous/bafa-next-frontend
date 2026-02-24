/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { programService } from "@/libs/services/programService";
import { useProgramModal } from "@/context/ProgramModalContext";
import FullLogo from "@/components/ui/fulllogo";

export default function ProgramFormModal() {
  const { isOpen, editingProgram, closeModal } = useProgramModal();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    duration_months: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (editingProgram) {
      setFormData({
        name: editingProgram.name,
        code: editingProgram.code,
        description: editingProgram.description || "",
        duration_months: editingProgram.duration_months || 0,
        is_active: editingProgram.is_active !== false,
      });
    } else {
      // Reset form for new program
      setFormData({
        name: "",
        code: "",
        description: "",
        duration_months: 0,
        is_active: true,
      });
    }
    setError("");
  }, [editingProgram, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingProgram) {
        await programService.updateProgram(editingProgram.id, formData);
      } else {
        await programService.createProgram(formData);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('programUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save program");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-2xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col items-center mb-6">
          <div>
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingProgram ? "Edit Program" : "Add a New Program"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingProgram ? "Update program details" : "Configure your new program details"}
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
              <Label>Program Name <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Enter program name" required />
            </div>
            <div>
              <Label>Code <span className="text-red-500">*</span></Label>
              <Input 
                value={formData.code} 
                onChange={(e) => handleChange("code", e.target.value)} 
                placeholder="Enter program code" 
                required 
                disabled={!!editingProgram}
              />
            </div>
          </div>

          <div>
            <Label>Duration (months)</Label>
            <Input type="number" value={formData.duration_months} onChange={(e) => handleChange("duration_months", parseInt(e.target.value) || 0)} placeholder="0" />
          </div>

          <div>
            <Label>Description</Label>
            <textarea value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Enter description (optional)" rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This program will be available for use throughout the system.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This program will be hidden from general use.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-2 pt-2">
          <button type="button" className="px-6 py-2 border border-gray-300 text-black rounded-xl" onClick={closeModal} disabled={loading}>Cancel</button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>{loading ? "Saving..." : editingProgram ? "Update Program" : "Save Program"}</button>
        </div>
      </form>
    </Modal>
  );
}
