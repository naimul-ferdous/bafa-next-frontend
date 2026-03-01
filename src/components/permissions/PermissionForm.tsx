/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { Icon } from "@iconify/react";
import { permissionService } from "@/libs/services/permissionService";
import { wingService } from "@/libs/services/wingService";
import { subWingService } from "@/libs/services/subWingService";
import { useAuth } from "@/context/AuthContext";
import type { Permission, PermissionAction } from "@/libs/types/menu";
import type { Wing, SubWing } from "@/libs/types/user";

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
  const { user, userIsSuperAdmin } = useAuth();
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    slug: string;
    description: string;
    module: string;
    wing_id: number | null;
    subwing_id: number | null;
    is_active: boolean;
    permission_action_id: number | null;
  }>({
    name: "",
    code: "",
    slug: "",
    description: "",
    module: "",
    wing_id: null,
    subwing_id: null,
    is_active: true,
    permission_action_id: null,
  });
  const [error, setError] = useState("");
  
  // Actions state
  const [availableActions, setAvailableActions] = useState<PermissionAction[]>([]);
  const [selectedActionCodes, setSelectedActionCodes] = useState<string[]>([]);

  // Entity state
  const [wings, setWings] = useState<Wing[]>([]);
  const [subWings, setSubWings] = useState<SubWing[]>([]);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [isCustomModule, setIsCustomModule] = useState(false);

  // Determine the wing/subwing context for the current user
  const userContext = useMemo(() => {
    if (!user || userIsSuperAdmin) return null;
    const primaryAssignment = user.roles?.find((r: any) => r.pivot?.is_primary) || user.roles?.[0];
    if (!primaryAssignment?.pivot) return null;
    return { 
        wing_id: primaryAssignment.pivot.wing_id, 
        sub_wing_id: primaryAssignment.pivot.sub_wing_id 
    };
  }, [user, userIsSuperAdmin]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [actions, modules, wingsRes, subWingsRes] = await Promise.all([
          permissionService.getAvailableActions(),
          permissionService.getModules(),
          wingService.getAllWings({ allData: true, is_active: true }),
          subWingService.getAllSubWings({ allData: true, is_active: true })
        ]);
        
        setAvailableActions(actions);
        setAvailableModules(modules);
        setWings(wingsRes.data || []);
        setSubWings(subWingsRes.data || []);
        
        if (!isEdit) {
          setSelectedActionCodes(actions.map((a) => a.code)); // default all checked
        }
      } catch (err) {
        console.error("Failed to fetch form data:", err);
      }
    };

    fetchInitialData();
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
        wing_id: initialData.wing_id || null,
        subwing_id: initialData.subwing_id || null,
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
        wing_id: userContext?.wing_id || null,
        subwing_id: userContext?.sub_wing_id || null,
        is_active: true,
        permission_action_id: null,
      });
      setSelectedActionCodes(availableActions.map((a) => a.code));
    }
    setError("");
  }, [initialData, userContext, availableActions, availableModules]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
        const next = { ...prev, [field]: value };
        if (field === "wing_id") next.subwing_id = null;
        return next;
    });

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

  const wingOptions = useMemo(() => [
    { label: "Global / Common", value: "" },
    ...wings.map(w => ({ label: w.name, value: w.id.toString() }))
  ], [wings]);

  const filteredSubWings = useMemo(() => {
    if (!formData.wing_id) return [];
    return subWings.filter(sw => sw.wing_id === formData.wing_id);
  }, [subWings, formData.wing_id]);

  const subWingOptions = useMemo(() => [
    { label: "All Sub-Wings", value: "" },
    ...filteredSubWings.map(sw => ({ label: sw.name, value: sw.id.toString() }))
  ], [filteredSubWings]);

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

        {userIsSuperAdmin && (
            <>
                <div className="md:col-span-2">
                    <Label>Wing Assignment (Optional)</Label>
                    <Select
                        value={formData.wing_id?.toString() || ""}
                        onChange={(val) => handleChange("wing_id", val ? parseInt(val) : null)}
                        options={wingOptions}
                    />
                </div>

                <div className="md:col-span-2">
                    <Label>Sub-Wing Assignment (Optional)</Label>
                    <Select
                        value={formData.subwing_id?.toString() || ""}
                        onChange={(val) => handleChange("subwing_id", val ? parseInt(val) : null)}
                        options={subWingOptions}
                        disabled={!formData.wing_id}
                    />
                </div>
            </>
        )}
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
