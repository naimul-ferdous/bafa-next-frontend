/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { menuService } from "@/libs/services/menuService";
import { permissionService } from "@/libs/services/permissionService";
import { commonService } from "@/libs/services/commonService";
import type { Menu, MenuCreateData, Permission } from "@/libs/types/menu";
import type { Wing, SubWing } from "@/libs/types/user";

interface MenuFormProps {
  initialData?: Menu | null;
  onSubmit: (data: MenuCreateData, permissionIds: number[]) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit: boolean;
}

export default function MenuForm({ initialData, onSubmit, onCancel, loading, isEdit }: MenuFormProps) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [wings, setWings] = useState<Wing[]>([]);
  const [allSubWings, setAllSubWings] = useState<SubWing[]>([]);
  const [subWings, setSubWings] = useState<SubWing[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [formData, setFormData] = useState<MenuCreateData>({
    name: "",
    slug: "",
    icon: "",
    route: "",
    parent_id: null,
    wing_id: null,
    subwing_id: null,
    order: 0,
    is_active: true,
  });
  const [error, setError] = useState("");

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadMenus();
    loadPermissions();
    loadOptions();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        slug: initialData.slug,
        icon: initialData.icon || "",
        route: initialData.route || "",
        parent_id: initialData.parent_id || null,
        wing_id: initialData.wing_id || null,
        subwing_id: initialData.subwing_id || null,
        order: initialData.order,
        is_active: initialData.is_active,
      });
      setSelectedPermissions(initialData.permissions?.map(p => p.id) || []);
    }
  }, [initialData]);

  // Effect to filter sub-wings when wing_id or allSubWings change
  useEffect(() => {
    if (formData.wing_id) {
      const filtered = allSubWings.filter(sw => sw.wing_id === formData.wing_id);
      setSubWings(filtered);
    } else {
      setSubWings([]);
    }
  }, [formData.wing_id, allSubWings]);

  const loadMenus = async () => {
    try {
      const response = await menuService.getAllMenus({ per_page: 1000 });
      setMenus(response.data);
    } catch (error) {
      console.error("Failed to load menus:", error);
    }
  };

  const loadOptions = async () => {
    try {
      setOptionsLoading(true);
      const data = await commonService.getResultOptions();
      if (data) {
        setWings(data.wings || []);
        setAllSubWings(data.sub_wings || []);
      }
    } catch (error) {
      console.error("Failed to load options:", error);
    } finally {
      setOptionsLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const response = await permissionService.getPermissions({ per_page: 1000 });
      setPermissions(response.data.filter((p: Permission) => p.is_active));
    } catch (error) {
      console.error("Failed to load permissions:", error);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === "wing_id") {
      setFormData(prev => ({ ...prev, subwing_id: null }));
    }

    if (field === "name" && !isEdit) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAllModule = (module: string, checked: boolean) => {
    const visiblePermissionsInModule = filteredGroupedPermissions[module] || [];
    const modulePermissionIds = visiblePermissionsInModule.map(p => p.id);
    if (checked) {
      setSelectedPermissions(prev => [...new Set([...prev, ...modulePermissionIds])]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => !modulePermissionIds.includes(id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await onSubmit(formData, selectedPermissions);
    } catch (err: any) {
      setError(err.message || "Failed to save menu");
    }
  };

  const flattenMenus = (items: Menu[], level: number = 0): Array<{ menu: Menu; level: number }> => {
    let result: Array<{ menu: Menu; level: number }> = [];
    items.forEach(item => {
      if (initialData && item.id === initialData.id) return;
      const { children, ...menuWithoutChildren } = item;
      result.push({ menu: menuWithoutChildren as Menu, level });
      if (children && children.length > 0) {
        result = result.concat(flattenMenus(children, level + 1));
      }
    });
    return result;
  };

  const parentOptions = flattenMenus(menus);

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const permModule = permission.module || "other";
    if (!acc[permModule]) acc[permModule] = [];
    acc[permModule].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const filteredGroupedPermissions = Object.entries(groupedPermissions).reduce((acc, [module, modulePermissions]) => {
    const matchesModule = module.toLowerCase().includes(searchTerm.toLowerCase());
    const matchingPermissions = modulePermissions.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (matchesModule) {
      acc[module] = modulePermissions;
    } else if (matchingPermissions.length > 0) {
      acc[module] = matchingPermissions;
    }
    return acc;
  }, {} as Record<string, Permission[]>);

  const isModuleFullySelected = (moduleName: string) => {
    const modulePermissions = filteredGroupedPermissions[moduleName] || [];
    return modulePermissions.length > 0 && modulePermissions.every(p => selectedPermissions.includes(p.id));
  };

  const isModulePartiallySelected = (module: string) => {
    const modulePermissions = filteredGroupedPermissions[module] || [];
    const selectedCount = modulePermissions.filter(p => selectedPermissions.includes(p.id)).length;
    return selectedCount > 0 && selectedCount < modulePermissions.length;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div>
          <Label>Menu Name <span className="text-red-500">*</span></Label>
          <Input
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Dashboard"
            required
          />
        </div>
        <div>
          <Label>Slug <span className="text-red-500">*</span></Label>
          <Input
            value={formData.slug}
            onChange={(e) => handleChange("slug", e.target.value)}
            placeholder="dashboard"
            required
          />
        </div>
        <div>
          <Label>Icon</Label>
          <Input
            value={formData.icon || ""}
            onChange={(e) => handleChange("icon", e.target.value)}
            placeholder="hugeicons:home-01"
          />
          {formData.icon && (
            <div className="mt-2 flex items-center gap-2">
              <Icon icon={formData.icon} className="w-5 h-5" />
              <span className="text-xs text-gray-500">Preview</span>
            </div>
          )}
        </div>
        <div>
          <Label>Route</Label>
          <Input
            value={formData.route || ""}
            onChange={(e) => handleChange("route", e.target.value)}
            placeholder="/dashboard"
          />
        </div>
        <div>
          <Label>Parent Menu</Label>
          <select
            value={formData.parent_id || ""}
            onChange={(e) => handleChange("parent_id", e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
          >
            <option value="">None (Root Menu)</option>
            {parentOptions.map(({ menu, level }) => (
              <option key={menu.id} value={menu.id}>
                {"  ".repeat(level)}{menu.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Wing</Label>
          <select
            value={formData.wing_id || ""}
            onChange={(e) => handleChange("wing_id", e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            disabled={optionsLoading}
          >
            <option value="">All Wings</option>
            {wings.map((wing) => (
              <option key={wing.id} value={wing.id}>
                {wing.name} {wing.code ? `(${wing.code})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Sub Wing</Label>
          <select
            value={formData.subwing_id || ""}
            onChange={(e) => handleChange("subwing_id", e.target.value ? parseInt(e.target.value) : null)}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 ${
              (!formData.wing_id || subWings.length === 0) && !optionsLoading ? "bg-gray-50 cursor-not-allowed" : ""
            }`}
            disabled={optionsLoading || !formData.wing_id || (subWings.length === 0 && !optionsLoading)}
          >
            {optionsLoading ? (
              <option value="">Loading...</option>
            ) : !formData.wing_id ? (
              <option value="">Select Wing First</option>
            ) : subWings.length === 0 ? (
              <option value="">No Sub Wings Available</option>
            ) : (
              <>
                <option value="">All Sub Wings</option>
                {subWings.map((subWing) => (
                  <option key={subWing.id} value={subWing.id}>
                    {subWing.name} {subWing.code ? `(${subWing.code})` : ""}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
        <div>
          <Label>Order <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            value={formData.order}
            onChange={(e) => handleChange("order", parseInt(e.target.value))}
            placeholder="0"
            required
          />
        </div>
      </div>

      <div>
        <Label className="mb-3">Status</Label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="is_active"
              checked={formData.is_active === true}
              onChange={() => handleChange("is_active", true)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-900">Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="is_active"
              checked={formData.is_active === false}
              onChange={() => handleChange("is_active", false)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-900">Inactive</span>
          </label>
        </div>
      </div>

      {/* Permissions Section */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="mb-0 text-base font-semibold">
            Required Permissions
            <span className="ml-2 text-sm font-normal text-gray-500">({selectedPermissions.length} selected)</span>
          </Label>
          
          <div className="relative w-64">
            <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search permissions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-3">Users need at least one of these permissions to see this menu</p>

        {permissionsLoading ? (
          <div className="text-center py-4 text-gray-500 text-sm">Loading permissions...</div>
        ) : permissions.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">No permissions available</div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            {Object.entries(filteredGroupedPermissions).length > 0 ? (
              Object.entries(filteredGroupedPermissions).map(([module, modulePermissions]) => (
                <div key={module} className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={isModuleFullySelected(module)}
                      ref={(el) => { if (el) el.indeterminate = isModulePartiallySelected(module); }}
                      onChange={(e) => handleSelectAllModule(module, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900 capitalize">{module.replace(/_/g, " ")}</span>
                    <span className="text-xs text-gray-500">
                      ({modulePermissions.filter(p => selectedPermissions.includes(p.id)).length}/{modulePermissions.length})
                    </span>
                  </label>
                  <div className="ml-6 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {modulePermissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center gap-2 cursor-pointer text-sm"
                        title={permission.description || permission.name}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700 truncate">{permission.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No permissions found matching {searchTerm}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
          {loading ? "Saving..." : isEdit ? "Update Menu" : "Save Menu"}
        </button>
      </div>
    </form>
  );
}
