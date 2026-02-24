/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Menu } from "@/libs/types";
import { Icon } from "@iconify/react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { menuService } from "@/libs/services/menuService";
import { permissionService } from "@/libs/services/permissionService";
import { useMenuModal } from "@/context/MenuModalContext";
import { useAuth } from "@/context/AuthContext";
import FullLogo from "@/components/ui/fulllogo";
import type { Permission } from "@/libs/types/menu";

export default function MenuFormModal() {
  const { isOpen, editingMenu, closeModal } = useMenuModal();
  const { refreshUser } = useAuth();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "",
    route: "",
    parent_id: null as number | null,
    order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Permissions state
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  // Load all menus for parent dropdown
  useEffect(() => {
    if (isOpen) {
      loadMenus();
      loadPermissions();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editingMenu) {
      setFormData({
        name: editingMenu.name,
        slug: editingMenu.slug,
        icon: editingMenu.icon || "",
        route: editingMenu.route || "",
        parent_id: editingMenu.parent_id || null,
        order: editingMenu.order,
        is_active: editingMenu.is_active,
      });
      // Set selected permissions from the menu
      const permIds = editingMenu.permissions?.map(p => p.id) || [];
      setSelectedPermissions(permIds);
    } else {
      // Reset form for new menu
      setFormData({
        name: "",
        slug: "",
        icon: "",
        route: "",
        parent_id: null,
        order: 0,
        is_active: true,
      });
      setSelectedPermissions([]);
    }
    setError("");
  }, [editingMenu, isOpen]);

  const loadMenus = async () => {
    try {
      const response = await menuService.getAllMenus({ per_page: 1000 });
      setMenus(response.data);
    } catch (error) {
      console.error("Failed to load menus:", error);
    }
  };

  const loadPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const response = await permissionService.getAllPermissions({ per_page: 1000 });
      setPermissions(response.data.filter(p => p.is_active));
    } catch (error) {
      console.error("Failed to load permissions:", error);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate slug from name
    if (field === "name" && !editingMenu) {
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
    const modulePermissionIds = permissions
      .filter(p => p.module === module)
      .map(p => p.id);

    if (checked) {
      setSelectedPermissions(prev => [...new Set([...prev, ...modulePermissionIds])]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => !modulePermissionIds.includes(id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let menuId: number;

      if (editingMenu) {
        await menuService.updateMenu(editingMenu.id, formData);
        menuId = editingMenu.id;
      } else {
        const newMenu = await menuService.createMenu(formData);
        if (!newMenu) throw new Error("Failed to create menu");
        menuId = newMenu.id;
      }

      // Assign permissions to menu
      await menuService.assignPermissions(menuId, selectedPermissions);

      await refreshUser();
      closeModal();
      // Trigger a custom event to reload menu list
      window.dispatchEvent(new CustomEvent('menuUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save menu");
    } finally {
      setLoading(false);
    }
  };

  const flattenMenus = (items: Menu[], level: number = 0): Array<{ menu: Menu; level: number }> => {
    let result: Array<{ menu: Menu; level: number }> = [];
    items.forEach(item => {
      // Skip the current menu being edited to prevent circular reference
      if (editingMenu && item.id === editingMenu.id) return;

      const { children, ...menuWithoutChildren } = item;
      result.push({ menu: menuWithoutChildren as Menu, level });
      if (children && children.length > 0) {
        result = result.concat(flattenMenus(children, level + 1));
      }
    });
    return result;
  };

  const parentOptions = flattenMenus(menus);

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const permModule = permission.module || 'other';
    if (!acc[permModule]) {
      acc[permModule] = [];
    }
    acc[permModule].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const isModuleFullySelected = (moduleName: string) => {
    const modulePermissions = groupedPermissions[moduleName] || [];
    return modulePermissions.length > 0 && modulePermissions.every(p => selectedPermissions.includes(p.id));
  };

  const isModulePartiallySelected = (module: string) => {
    const modulePermissions = groupedPermissions[module] || [];
    const selectedCount = modulePermissions.filter(p => selectedPermissions.includes(p.id)).length;
    return selectedCount > 0 && selectedCount < modulePermissions.length;
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-4xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-6">
          <div>
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingMenu ? "Edit Menu" : "Add a New Menu"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingMenu ? "Update menu details and permissions" : "Configure your new menu details and permissions"}
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
              <Label>
                Menu Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Dashboard"
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
                placeholder="dashboard"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Icon</Label>
              <Input
                value={formData.icon}
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
                value={formData.route}
                onChange={(e) => handleChange("route", e.target.value)}
                placeholder="/dashboard"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Parent Menu</Label>
              <select
                value={formData.parent_id || ""}
                onChange={(e) => handleChange("parent_id", e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">None (Root Menu)</option>
                {parentOptions.map(({ menu, level }) => (
                  <option key={menu.id} value={menu.id}>
                    {"  ".repeat(level)}
                    {menu.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>
                Order <span className="text-red-500">*</span>
              </Label>
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
                <span className="text-gray-900 dark:text-white">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="is_active"
                  checked={formData.is_active === false}
                  onChange={() => handleChange("is_active", false)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-900 dark:text-white">Inactive</span>
              </label>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="border-t pt-4 mt-4">
            <Label className="mb-3 text-lg font-semibold">
              Required Permissions
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({selectedPermissions.length} selected)
              </span>
            </Label>
            <p className="text-sm text-gray-500 mb-3">
              Users need at least one of these permissions to see this menu
            </p>

            {permissionsLoading ? (
              <div className="text-center py-4 text-gray-500">Loading permissions...</div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No permissions available</div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                  <div key={module} className="space-y-2">
                    {/* Module Header */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isModuleFullySelected(module)}
                        ref={(el) => {
                          if (el) el.indeterminate = isModulePartiallySelected(module);
                        }}
                        onChange={(e) => handleSelectAllModule(module, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {module.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({modulePermissions.filter(p => selectedPermissions.includes(p.id)).length}/{modulePermissions.length})
                      </span>
                    </label>

                    {/* Module Permissions */}
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
                          <span className="text-gray-700 dark:text-gray-300 truncate">
                            {permission.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-4">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-black rounded-xl"
            onClick={closeModal}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>
            {loading ? "Saving..." : editingMenu ? "Update Menu" : "Save Menu"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
