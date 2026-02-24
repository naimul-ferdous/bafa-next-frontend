/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import type { Permission } from "@/libs/types/menu";

interface PermissionFormProps {
  initialData?: Permission | null;
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit: boolean;
}

export default function PermissionForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  isEdit,
}: PermissionFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    module: "",
    is_active: true,
  });
  const [error, setError] = useState("");

  // Populate form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        slug: initialData.slug || "",
        description: initialData.description || "",
        module: initialData.module || "",
        is_active: initialData.is_active !== false,
      });
    } else {
      // Reset form for new permission
      setFormData({
        name: "",
        slug: "",
        description: "",
        module: "",
        is_active: true,
      });
    }
    setError("");
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate slug from name if not editing
    if (field === "name" && !isEdit) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || "Failed to save permission");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>
            Permission Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter permission name"
            required
          />
        </div>

        <div>
          <Label>
            Slug <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.slug}
            onChange={(e) => handleChange("slug", e.target.value)}
            placeholder="Enter permission slug"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>
            Module <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.module}
            onChange={(e) => handleChange("module", e.target.value)}
            placeholder="Enter module name"
            required
          />
        </div>

        <div>
          <Label>Description</Label>
          <Input
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Enter description (optional)"
          />
        </div>
      </div>

      <div>
        <Label className="mb-3">Status</Label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="is_active"
              checked={formData.is_active === true}
              onChange={() => handleChange("is_active", true)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700 group-hover:text-gray-900 transition-colors">Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="is_active"
              checked={formData.is_active === false}
              onChange={() => handleChange("is_active", false)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700 group-hover:text-gray-900 transition-colors">Inactive</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
        <button
          type="button"
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
          disabled={loading}
        >
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {isEdit ? "Update Permission" : "Save Permission"}
        </button>
      </div>
    </form>
  );
}
