/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import type { CtwResultsModule } from "@/libs/types/ctw";

interface CtwModuleFormProps {
  initialData?: CtwResultsModule | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

const ASSESSMENT_OPTIONS = [
  { value: 'dt', label: 'DT' },
  { value: 'pf', label: 'PF' },
  { value: 'ao', label: 'AO' },
  { value: 'gsk', label: 'GSK' },
  { value: 'bma', label: 'BMA' },
];

export default function CtwModuleForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: CtwModuleFormProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    short_name: "",
    code: "",
    assessment: "dt" as string,
    instructor_count: 1 as string | number,
    total_mark: 100 as string | number,
    is_active: true,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name ?? "",
        short_name: initialData.short_name ?? "",
        code: initialData.code ?? "",
        assessment: initialData.assessment ?? "dt",
        instructor_count: initialData.instructor_count ?? 1,
        total_mark: initialData.total_mark ?? 100,
        is_active: initialData.is_active !== false,
      });
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? "update" : "create"} CTW module`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto">
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
           <div>
          <Label>Module Full Name <span className="text-red-500">*</span></Label>
          <Input value={formData.full_name} onChange={(e) => handleChange("full_name", e.target.value)} placeholder="Enter full name" required />
        </div>
          <div>
            <Label>Short Name <span className="text-red-500">*</span></Label>
            <Input value={formData.short_name} onChange={(e) => handleChange("short_name", e.target.value)} placeholder="Enter short name" required />
          </div>
          <div>
            <Label>Code <span className="text-red-500">*</span></Label>
            <Input value={formData.code} onChange={(e) => handleChange("code", e.target.value)} placeholder="Enter module code" required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Total Mark <span className="text-red-500">*</span></Label>
            <Input type="number" value={formData.total_mark} onChange={(e) => handleChange("total_mark", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="Enter total mark" required />
          </div>
          <div>
            <Label>Instructor Count</Label>
            <Input type="number" value={formData.instructor_count} onChange={(e) => handleChange("instructor_count", e.target.value === "" ? "" : parseInt(e.target.value))} placeholder="Enter count" />
          </div>
          <div>
            <Label>Assessment</Label>
            <select
              value={formData.assessment}
              onChange={(e) => handleChange("assessment", e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {ASSESSMENT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label className="mb-3">Status</Label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
              <div>
                <div className="font-medium text-gray-900">Active:</div>
                <div className="text-sm text-gray-500">This module will be available for use throughout the system.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
              <div>
                <div className="font-medium text-gray-900">Inactive:</div>
                <div className="text-sm text-gray-500">This module will be hidden from general use.</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-50" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2" disabled={loading}>
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Module" : "Save Module")}
        </button>
      </div>
    </form>
  );
}
