/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { semesterService } from "@/libs/services/semesterService";
import { useSemesterModal } from "@/context/SemesterModalContext";
import FullLogo from "@/components/ui/fulllogo";

export default function SemesterFormModal() {
  const { isOpen, editingSemester, closeModal } = useSemesterModal();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    start_date: "",
    end_date: "",
    is_current: false,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingSemester) {
      setFormData({
        name: editingSemester.name,
        code: editingSemester.code,
        start_date: editingSemester.start_date,
        end_date: editingSemester.end_date,
        is_current: editingSemester.is_current || false,
        is_active: editingSemester.is_active !== false,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        start_date: "",
        end_date: "",
        is_current: false,
        is_active: true,
      });
    }
    setError("");
  }, [editingSemester, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingSemester) {
        await semesterService.updateSemester(editingSemester.id, formData);
      } else {
        await semesterService.createSemester(formData);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('semesterUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save semester");
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
            {editingSemester ? "Edit Semester" : "Add a New Semester"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingSemester ? "Update semester details" : "Configure your new semester details"}
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
              <Label>Semester Name <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="e.g. Spring 2024" required />
            </div>
            <div>
              <Label>Code <span className="text-red-500">*</span></Label>
              <Input 
                value={formData.code} 
                onChange={(e) => handleChange("code", e.target.value)} 
                placeholder="e.g. S24" 
                required 
                disabled={!!editingSemester}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={formData.start_date} onChange={(e) => handleChange("start_date", e.target.value)} required />
            </div>
            <div>
              <Label>End Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={formData.end_date} onChange={(e) => handleChange("end_date", e.target.value)} required />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_current" checked={formData.is_current} onChange={(e) => handleChange("is_current", e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <Label htmlFor="is_current" className="mb-0">Mark as Current Semester</Label>
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This semester will be available for use throughout the system.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This semester will be hidden from general use.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-2 pt-2">
          <button type="button" className="px-6 py-2 border border-gray-300 text-black rounded-xl" onClick={closeModal} disabled={loading}>Cancel</button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>{loading ? "Saving..." : editingSemester ? "Update Semester" : "Save Semester"}</button>
        </div>
      </form>
    </Modal>
  );
}
