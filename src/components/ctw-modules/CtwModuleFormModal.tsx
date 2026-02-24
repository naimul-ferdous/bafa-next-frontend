/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import { useCtwModuleModal } from "@/context/CtwModuleModalContext";
import FullLogo from "@/components/ui/fulllogo";

export default function CtwModuleFormModal() {
  const { isOpen, editingModule, closeModal } = useCtwModuleModal();
  const [formData, setFormData] = useState({
    full_name: "",
    short_name: "",
    code: "",
    instructor_count: 1 as string | number,
    practice_count: "" as string | number,
    convert_of_practice: "" as string | number,
    convert_of_exam: "" as string | number,
    total_mark: 100 as string | number,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (editingModule) {
      setFormData({
        full_name: editingModule.full_name ?? "",
        short_name: editingModule.short_name ?? "",
        code: editingModule.code ?? "",
        instructor_count: editingModule.instructor_count ?? 1,
        practice_count: editingModule.practice_count ?? "",
        convert_of_practice: editingModule.convert_of_practice ?? "",
        convert_of_exam: editingModule.convert_of_exam ?? "",
        total_mark: editingModule.total_mark ?? 100,
        is_active: editingModule.is_active !== false,
      });
    } else {
      // Reset form for new module
      setFormData({
        full_name: "",
        short_name: "",
        code: "",
        instructor_count: 1,
        practice_count: "",
        convert_of_practice: "",
        convert_of_exam: "",
        total_mark: 100,
        is_active: true,
      });
    }
    setError("");
  }, [editingModule, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingModule) {
        await ctwResultsModuleService.updateModule(editingModule.id, formData);
      } else {
        await ctwResultsModuleService.createModule(formData);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('ctwModuleUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save CTW module");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-2xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingModule ? "Edit CTW Module" : "Add a New CTW Module"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingModule ? "Update module details" : "Configure your new module details"}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Module Full Name <span className="text-red-500">*</span></Label>
            <Input value={formData.full_name} onChange={(e) => handleChange("full_name", e.target.value)} placeholder="Enter full name" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Short Name <span className="text-red-500">*</span></Label>
              <Input value={formData.short_name} onChange={(e) => handleChange("short_name", e.target.value)} placeholder="Enter short name" required />
            </div>
            <div>
              <Label>Code <span className="text-red-500">*</span></Label>
              <Input value={formData.code} onChange={(e) => handleChange("code", e.target.value)} placeholder="Enter module code" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Total Mark <span className="text-red-500">*</span></Label>
              <Input type="number" value={formData.total_mark} onChange={(e) => handleChange("total_mark", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="Enter total mark" required />
            </div>
            <div>
              <Label>Instructor Count</Label>
              <Input type="number" value={formData.instructor_count} onChange={(e) => handleChange("instructor_count", e.target.value === "" ? "" : parseInt(e.target.value))} placeholder="Enter count" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Practice Count</Label>
              <Input type="number" value={formData.practice_count} onChange={(e) => handleChange("practice_count", e.target.value === "" ? "" : parseInt(e.target.value))} placeholder="Prac. Count" />
            </div>
            <div>
              <Label>Prac. Conversion</Label>
              <Input type="number" step="0.01" value={formData.convert_of_practice} onChange={(e) => handleChange("convert_of_practice", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="Prac. Conv." />
            </div>
            <div>
              <Label>Exam Conversion</Label>
              <Input type="number" step="0.01" value={formData.convert_of_exam} onChange={(e) => handleChange("convert_of_exam", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="Exam Conv." />
            </div>
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This module will be available for use throughout the system.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This module will be hidden from general use.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-50 transition-colors" onClick={closeModal} disabled={loading}>Cancel</button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors" disabled={loading}>{loading ? "Saving..." : editingModule ? "Update Module" : "Save Module"}</button>
        </div>
      </form>
    </Modal>
  );
}
