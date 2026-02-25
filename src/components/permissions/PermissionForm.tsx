/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import { permissionService } from "@/libs/services/permissionService";
import type { Permission, PermissionAction } from "@/libs/types/menu";

interface PermissionFormProps {
  initialData?: Permission | null;
  onSubmit: (formData: any, selectedActions?: PermissionAction[]) => Promise<void>;
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
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    slug: string;
    description: string;
    module: string;
    is_active: boolean;
    permission_action_id: number | null;
  }>({
    name: "",
    code: "",
    slug: "",
    description: "",
    module: "",
    is_active: true,
    permission_action_id: null,
  });
  const [error, setError] = useState("");
  
  // Actions state
  const [availableActions, setAvailableActions] = useState<PermissionAction[]>([]);
  const [selectedActionCodes, setSelectedActionCodes] = useState<string[]>([]);

  // Module select state
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [isCustomModule, setIsCustomModule] = useState(false);

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const actions = await permissionService.getAvailableActions();
        setAvailableActions(actions);
        setSelectedActionCodes(actions.map((a) => a.code)); // default all checked
      } catch (err) {
        console.error("Failed to fetch permission actions:", err);
      }
    };

    const fetchModules = async () => {
      try {
        const modules = await permissionService.getModules();
        setAvailableModules(modules);
      } catch (err) {
        console.error("Failed to fetch modules:", err);
      }
    };

    fetchModules();
    fetchActions();
  }, [isEdit]);

  // Populate form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        code: initialData.code || "",
        slug: initialData.slug || "",
        description: initialData.description || "",
        module: initialData.module || "",
        is_active: initialData.is_active !== false,
        permission_action_id: initialData.permission_action_id ?? null,
      });
      // If the existing module is not in the list, open custom input
      if (initialData.module && availableModules.length > 0 && !availableModules.includes(initialData.module)) {
        setIsCustomModule(true);
      }
    } else {
      // Reset form for new permission
      setFormData({
        name: "",
        code: "",
        slug: "",
        description: "",
        module: "",
        is_active: true,
        permission_action_id: null,
      });
      setSelectedActionCodes([]);
    }
    setError("");
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate code and slug from name when creating
    if (field === "name" && !isEdit) {
      const auto = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setFormData(prev => ({ ...prev, code: auto, slug: auto }));
    }
  };

  const handleActionToggle = (actionCode: string) => {
    setSelectedActionCodes(prev => 
      prev.includes(actionCode)
        ? prev.filter(code => code !== actionCode)
        : [...prev, actionCode]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      // Map codes back to full action objects
      const selectedActions = availableActions.filter(a => selectedActionCodes.includes(a.code));
      await onSubmit(formData, selectedActions);
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label>
            Permission Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter permission name (e.g. User)"
            required
          />
        </div>

        <div>
          <Label>
            Code <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.code}
            onChange={(e) => handleChange("code", e.target.value)}
            placeholder="Enter code (e.g. user)"
            required
          />
          {selectedActionCodes.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">Used as prefix for generated slugs (e.g. {formData.code || 'user'}-view)</p>
          )}
        </div>
        <div>
          <Label>
            Slug <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.slug}
            onChange={(e) => handleChange("slug", e.target.value)}
            placeholder="Enter permission slug"
            required={selectedActionCodes.length === 0}
            disabled={selectedActionCodes.length > 0} 
            className={selectedActionCodes.length > 0 ? "bg-gray-100 text-gray-500" : ""}
          />
          {selectedActionCodes.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">Slug will be auto-generated based on Code + Action</p>
          )}
        </div>

        <div>
          <Label>
            Module <span className="text-red-500">*</span>
          </Label>
          {isCustomModule ? (
            <div className="flex gap-2">
              <Input
                value={formData.module}
                onChange={(e) => handleChange("module", e.target.value)}
                placeholder="Enter custom module name"
                required
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => { setIsCustomModule(false); handleChange("module", ""); }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center gap-1"
              >
                <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                Back
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={formData.module}
                onChange={(e) => handleChange("module", e.target.value)}
                required
                className="flex-1 h-11 px-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a module...</option>
                {availableModules.map((mod) => (
                  <option key={mod} value={mod}>{mod}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => { setIsCustomModule(true); handleChange("module", ""); }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center gap-1"
              >
                <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                Custom
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Input
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Enter description (optional)"
        />
      </div>

      {isEdit ? (
        <div>
          <Label>Permission Action</Label>
          <select
            value={formData.permission_action_id ?? ""}
            onChange={(e) =>
              handleChange(
                "permission_action_id",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">None (no action)</option>
            {availableActions.map((action) => (
              <option key={action.id} value={action.id}>
                {action.name} ({action.code})
              </option>
            ))}
          </select>
        </div>
      ) : (
        availableActions.length > 0 && (
          <div>
            <Label className="mb-3 block">
              Generate Permissions for Actions
              <span className="ml-2 text-xs font-normal text-gray-500">
                (Optional: Select actions to bulk create permissions)
              </span>
            </Label>
            <div className="flex flex-wrap gap-4">
              {availableActions.map((action) => (
                <label
                  key={action.id}
                  className={`flex items-center gap-2 cursor-pointer transition-all ${
                    selectedActionCodes.includes(action.code)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedActionCodes.includes(action.code)}
                    onChange={() => handleActionToggle(action.code)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="font-medium">{action.name}</span>
                </label>
              ))}
            </div>
          </div>
        )
      )}

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
              <div className="font-medium text-gray-900">Active:</div>
              <div className="text-sm text-gray-500">
                This permission will be available for use throughout the system.
              </div>
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
              <div className="font-medium text-gray-900">Inactive:</div>
              <div className="text-sm text-gray-500">
                This permission will be hidden and unavailable across the system.
              </div>
            </div>
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
          {isEdit ? "Update Permission" : selectedActionCodes.length > 0 ? `Create ${selectedActionCodes.length} Permissions` : "Save Permission"}
        </button>
      </div>
    </form>
  );
}
