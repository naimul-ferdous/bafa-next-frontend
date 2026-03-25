/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { universityService } from "@/libs/services/universityService";
import type { UniversityDepartmentInput } from "@/libs/services/universityService";
import { useUniversityModal } from "@/context/UniversityModalContext";
import FullLogo from "@/components/ui/fulllogo";
import { Icon } from "@iconify/react";

const generateCode = (shortName: string): string =>
  shortName.trim().toLowerCase().replace(/\s+/g, '-');

interface DeptRow extends UniversityDepartmentInput {
  ui_id: string;
}

const newDeptRow = (): DeptRow => ({
  ui_id: Math.random().toString(36).substring(2, 9),
  name: "",
  code: "",
  is_current: false,
  is_active: true,
});

export default function UniversityFormModal() {
  const { isOpen, editingUniversity, closeModal } = useUniversityModal();
  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    is_current: false,
    is_active: true,
  });
  const [departments, setDepartments] = useState<DeptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingUniversity) {
      setFormData({
        name: editingUniversity.name,
        short_name: editingUniversity.short_name || "",
        is_current: editingUniversity.is_current || false,
        is_active: editingUniversity.is_active !== false,
      });
      // Load existing departments from the university object (loaded via show)
      universityService.getUniversity(editingUniversity.id).then(u => {
        if (u?.departments && u.departments.length > 0) {
          setDepartments(u.departments.map(d => ({
            ui_id: Math.random().toString(36).substring(2, 9),
            name: d.name,
            code: d.code,
            is_current: d.is_current ?? false,
            is_active: d.is_active !== false,
          })));
        } else {
          setDepartments([]);
        }
      });
    } else {
      setFormData({ name: "", short_name: "", is_current: false, is_active: true });
      setDepartments([]);
    }
    setError("");
  }, [editingUniversity, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateDept = (ui_id: string, field: keyof UniversityDepartmentInput, value: any) => {
    setDepartments(prev => prev.map(d => d.ui_id === ui_id ? { ...d, [field]: value } : d));
  };

  const removeDept = (ui_id: string) => {
    setDepartments(prev => prev.filter(d => d.ui_id !== ui_id));
  };

  const previewCode = useMemo(() => generateCode(formData.short_name), [formData.short_name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        departments: departments.map(({ ui_id: _ui_id, ...rest }) => rest),
      };
      if (editingUniversity) {
        await universityService.updateUniversity(editingUniversity.id, payload);
      } else {
        await universityService.createUniversity(payload);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('universityUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save university");
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
            {editingUniversity ? "Edit University" : "Add a New University"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingUniversity ? "Update university details" : "Configure your new university details"}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>University Name <span className="text-red-500">*</span></Label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Bangladesh University of Engineering and Technology"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Short Name <span className="text-red-500">*</span></Label>
              <Input
                value={formData.short_name}
                onChange={(e) => handleChange("short_name", e.target.value)}
                placeholder="e.g. BUET"
                required
              />
            </div>
          </div>

          {/* Is Current */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_current"
              checked={formData.is_current}
              onChange={(e) => handleChange("is_current", e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_current" className="font-medium text-gray-900 dark:text-white cursor-pointer">
              Current University
            </label>
          </div>

          {/* Departments */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Departments
                {departments.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {departments.length}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setDepartments(prev => [...prev, newDeptRow()])}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                Add Department
              </button>
            </div>

            {departments.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-2">No departments added yet.</p>
            ) : (
              <div className="space-y-2">
                {departments.map((dept) => (
                  <div key={dept.ui_id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <input
                      type="text"
                      value={dept.name}
                      onChange={(e) => updateDept(dept.ui_id, "name", e.target.value)}
                      placeholder="Department Name"
                      required
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={dept.code}
                      onChange={(e) => updateDept(dept.ui_id, "code", e.target.value)}
                      placeholder="Code"
                      required
                      className="w-24 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={dept.is_current ?? false}
                        onChange={(e) => updateDept(dept.ui_id, "is_current", e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded"
                      />
                      Current
                    </label>
                    <button
                      type="button"
                      onClick={() => removeDept(dept.ui_id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Remove"
                    >
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <Label className="mb-3">Status</Label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="is_active"
                  checked={formData.is_active === true}
                  onChange={() => handleChange("is_active", true)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This university will be available for use throughout the system.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="is_active"
                  checked={formData.is_active === false}
                  onChange={() => handleChange("is_active", false)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This university will be hidden from general use.</div>
                </div>
              </label>
            </div>
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
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-xl"
            disabled={loading}
          >
            {loading ? "Saving..." : editingUniversity ? "Update University" : "Save University"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
