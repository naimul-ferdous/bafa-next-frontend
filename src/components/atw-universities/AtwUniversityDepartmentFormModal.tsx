/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { atwUniversityDepartmentService } from "@/libs/services/atwUniversityDepartmentService";
import { useAtwUniversityDepartmentModal } from "@/context/AtwUniversityDepartmentModalContext";
import { universityService } from "@/libs/services/universityService";
import type { SystemUniversity } from "@/libs/types/system";
import FullLogo from "@/components/ui/fulllogo";

export default function AtwUniversityDepartmentFormModal() {
  const { isOpen, editingDepartment, closeModal } = useAtwUniversityDepartmentModal();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    university_id: 0,
    is_current: false,
    is_active: true,
  });
  const [universities, setUniversities] = useState<SystemUniversity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    universityService.getAllUniversities({ per_page: 100 }).then(res => setUniversities(res.data));
  }, []);

  useEffect(() => {
    if (editingDepartment) {
      setFormData({
        name: editingDepartment.name,
        code: editingDepartment.code,
        university_id: editingDepartment.university_id,
        is_current: editingDepartment.is_current || false,
        is_active: editingDepartment.is_active !== false,
      });
    } else {
      setFormData({ name: "", code: "", university_id: 0, is_current: false, is_active: true });
    }
    setError("");
  }, [editingDepartment, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.university_id) {
      setError("Please select a university.");
      return;
    }
    setLoading(true);
    try {
      if (editingDepartment) {
        await atwUniversityDepartmentService.updateDepartment(editingDepartment.id, formData);
      } else {
        await atwUniversityDepartmentService.createDepartment({ ...formData, university_id: Number(formData.university_id) });
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('departmentUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save department");
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
            {editingDepartment ? "Edit Department" : "Add a New Department"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingDepartment ? "Update department details" : "Configure your new university department"}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>University <span className="text-red-500">*</span></Label>
            <select
              value={formData.university_id}
              onChange={(e) => handleChange("university_id", Number(e.target.value))}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              required
            >
              <option value={0}>-- Select University --</option>
              {universities.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}{u.short_name ? ` (${u.short_name})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Department Name <span className="text-red-500">*</span></Label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Computer Science & Engineering"
              required
            />
          </div>

          <div>
            <Label>Department Code <span className="text-red-500">*</span></Label>
            <Input
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              placeholder="e.g. CSE"
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="dept_is_current"
              checked={formData.is_current}
              onChange={(e) => handleChange("is_current", e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="dept_is_current" className="font-medium text-gray-900 dark:text-white cursor-pointer">
              Current Department
            </label>
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="dept_is_active"
                  checked={formData.is_active === true}
                  onChange={() => handleChange("is_active", true)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This department will be available for use.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="dept_is_active"
                  checked={formData.is_active === false}
                  onChange={() => handleChange("is_active", false)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This department will be hidden from general use.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-black rounded-xl"
            onClick={closeModal}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-xl"
            disabled={loading}
          >
            {loading ? "Saving..." : editingDepartment ? "Update Department" : "Save Department"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
