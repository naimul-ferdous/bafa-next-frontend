/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { roleService } from "@/libs/services/roleService";
import { permissionService } from "@/libs/services/permissionService";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import type { Permission } from "@/libs/types/menu";
import type { Role } from "@/libs/types/user";

interface RoleFormProps {
    initialData?: Role | null;
    onSubmit: (formData: any, selectedPermissions: number[]) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
    isEdit: boolean;
}

export default function RoleForm({
    initialData,
    onSubmit,
    onCancel,
    loading,
    isEdit,
}: RoleFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        is_active: true,
    });
    const [error, setError] = useState("");

    // Permissions state
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [permissionSearch, setPermissionSearch] = useState("");

    // Load all permissions
    useEffect(() => {
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
        loadPermissions();
    }, []);

    // Populate form when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                slug: initialData.slug || "",
                description: initialData.description || "",
                is_active: initialData.is_active !== false,
            });
            // Set selected permissions from the role
            const permIds = initialData.permissions?.map(p => p.id) || [];
            setSelectedPermissions(permIds);
        } else {
            // Reset form for new role
            setFormData({
                name: "",
                slug: "",
                description: "",
                is_active: true,
            });
            setSelectedPermissions([]);
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
        try {
            await onSubmit(formData, selectedPermissions);
        } catch (err: any) {
            setError(err.message || "Failed to save role");
        }
    };

    // Group permissions by module and filter by search term
    const filteredPermissions = permissions.filter(p => 
        p.name.toLowerCase().includes(permissionSearch.toLowerCase()) || 
        (p.module && p.module.toLowerCase().includes(permissionSearch.toLowerCase()))
    );

    const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
        const permModule = permission.module || 'other';
        if (!acc[permModule]) {
            acc[permModule] = [];
        }
        acc[permModule].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    const isModuleFullySelected = (moduleName: string) => {
        const modulePermissions = permissions.filter(p => p.module === moduleName);
        return modulePermissions.length > 0 && modulePermissions.every(p => selectedPermissions.includes(p.id));
    };

    const isModulePartiallySelected = (moduleName: string) => {
        const modulePermissions = permissions.filter(p => p.module === moduleName);
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

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>
                        Role Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Enter role name"
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
                        placeholder="Enter role slug"
                        required
                    />
                </div>
            </div>

            <div>
                <Label>Description</Label>
                <textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Enter description (optional)"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>

            <div className="space-y-4 flex flex-col h-full pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Label className="flex items-center gap-2">
                        <span className="text-lg font-semibold">Assign Permissions</span>
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {selectedPermissions.length} selected
                        </span>
                    </Label>
                    <div className="relative w-full sm:w-64">
                        <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search permissions..."
                            value={permissionSearch}
                            onChange={(e) => setPermissionSearch(e.target.value)}
                            className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {permissionsLoading ? (
                    <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50 py-10">
                        <div className="flex flex-col items-center gap-2">
                            <Icon icon="hugeicons:loading-03" className="w-8 h-8 animate-spin text-blue-500" />
                            <span className="text-sm text-gray-500">Loading permissions...</span>
                        </div>
                    </div>
                ) : filteredPermissions.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50 py-10 italic text-gray-500">
                        No permissions found matching "{permissionSearch}"
                    </div>
                ) : (
                    <div className="flex-1 rounded-lg space-y-4">
                        {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                            <div key={module} className="bg-white border border-gray-200 rounded-md p-3">
                                {/* Module Header */}
                                <label className="flex items-center gap-2 cursor-pointer mb-2 pb-2 border-b border-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={isModuleFullySelected(module)}
                                        ref={(el) => {
                                            if (el) el.indeterminate = isModulePartiallySelected(module);
                                        }}
                                        onChange={(e) => handleSelectAllModule(module, e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="font-bold text-gray-800 capitalize text-sm">
                                        {module.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-normal">
                                        ({permissions.filter(p => p.module === module && selectedPermissions.includes(p.id)).length}/{permissions.filter(p => p.module === module).length})
                                    </span>
                                </label>

                                {/* Module Permissions */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                                    {modulePermissions.map((permission) => (
                                        <label
                                            key={permission.id}
                                            className="flex items-center gap-2 cursor-pointer group"
                                            title={permission.description || permission.name}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes(permission.id)}
                                                onChange={() => handlePermissionToggle(permission.id)}
                                                className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors truncate">
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

            <div className=" pt-6">
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
                        <span className="text-gray-700 group-hover:text-gray-900">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="radio"
                            name="is_active"
                            checked={formData.is_active === false}
                            onChange={() => handleChange("is_active", false)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900">Inactive</span>
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
                    {isEdit ? "Update Role" : "Save Role"}
                </button>
            </div>
        </form>
    );
}
