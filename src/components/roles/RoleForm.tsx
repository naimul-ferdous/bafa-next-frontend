/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { permissionService } from "@/libs/services/permissionService";
import { wingService } from "@/libs/services/wingService";
import { subWingService } from "@/libs/services/subWingService";
import { useAuth } from "@/context/AuthContext";
import type { Role, Wing, SubWing } from "@/libs/types/user";
import type { Permission } from "@/libs/types/menu";

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
    const { user, userIsSuperAdmin } = useAuth();
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        wing_id: null as number | null,
        subwing_id: null as number | null,
        is_active: true,
        is_role_switch: true,
        is_manage: true,
        is_marge_role: false,
        extension: "",
    });
    const [error, setError] = useState("");

    // Entity state
    const [wings, setWings] = useState<Wing[]>([]);
    const [subWings, setSubWings] = useState<SubWing[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Determine the wing/subwing context for the current user
    const userContext = useMemo(() => {
        if (!user || userIsSuperAdmin) return null;
        
        // Find assignment from roles array or singular role property
        const primaryAssignment = user.roles?.find((r: any) => r.pivot?.is_primary) || 
                                user.roles?.[0] || 
                                (user as any).role;
                                
        if (!primaryAssignment) return null;

        // Extract IDs from pivot (roles array) or direct property (singular role)
        const wing_id = primaryAssignment.pivot?.wing_id || primaryAssignment.wing_id;
        const sub_wing_id = primaryAssignment.pivot?.sub_wing_id || primaryAssignment.subwing_id;
        
        if (!wing_id && !sub_wing_id) return null;

        // Map wing_id to module prefix (based on seeders)
        let prefix = "";
        if (wing_id === 1) prefix = "atw";
        else if (wing_id === 2) prefix = "ctw";
        else if (wing_id === 3) prefix = "ftw";

        // Handle subwing specific squadron modules
        if (sub_wing_id === 1) prefix = "ftw-11sqn"; 
        else if (sub_wing_id === 2) prefix = "ftw-12sqn"; 

        const roleSlug = primaryAssignment.slug || "";
        if (roleSlug.includes("atw")) prefix = "atw";
        else if (roleSlug.includes("ctw")) prefix = "ctw";
        else if (roleSlug.includes("11sqn")) prefix = "ftw-11sqn";
        else if (roleSlug.includes("12sqn")) prefix = "ftw-12sqn";
        else if (roleSlug.includes("ftw")) prefix = "ftw";

        return { wing_id, sub_wing_id, prefix };
    }, [user, userIsSuperAdmin]);

    useEffect(() => {
        loadInitialData();
    }, [userContext]);

    // Populate form when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                slug: initialData.slug || "",
                description: initialData.description || "",
                wing_id: initialData.wing_id || null,
                subwing_id: initialData.subwing_id || null,
                is_active: initialData.is_active !== false,
                is_role_switch: initialData.is_role_switch !== false,
                is_manage: (initialData as any).is_manage !== false,
                is_marge_role: !!(initialData as any).is_marge_role,
                extension: (initialData as any).extension || "",
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
                wing_id: userContext?.wing_id || null,
                subwing_id: userContext?.sub_wing_id || null,
                is_active: true,
                is_role_switch: true,
                is_manage: true,
                is_marge_role: false,
                extension: "",
            });
            setSelectedPermissions([]);
        }
        setError("");
    }, [initialData, userContext]);

    const loadInitialData = async () => {
        try {
            setPermissionsLoading(true);
            
            // 1. Load Wings
            const wingsData = await wingService.getAllWings({ allData: true, is_active: true });
            setWings(wingsData.data || []);

            // 2. Load SubWings
            const subWingsData = await subWingService.getAllSubWings({ allData: true, is_active: true });
            setSubWings(subWingsData.data || []);

            // 3. Load Permissions (filtered by wing/subwing if selected)
            await loadPermissions(formData.wing_id, formData.subwing_id);

        } catch (error) {
            console.error("Failed to load initial data:", error);
        } finally {
            setPermissionsLoading(false);
        }
    };

    const loadPermissions = async (wingId?: number | null, subwingId?: number | null) => {
        try {
            setPermissionsLoading(true);
            
            // Priority: provided arguments OR formData OR userContext
            let targetWingId: number | undefined;
            let targetSubwingId: number | undefined;

            if (wingId !== undefined) {
                // If explicitly provided (could be null for Global)
                targetWingId = wingId || undefined;
                targetSubwingId = subwingId || undefined;
            } else {
                // Initial load or from formData
                targetWingId = (formData.wing_id || userContext?.wing_id) || undefined;
                targetSubwingId = (formData.subwing_id || userContext?.sub_wing_id) || undefined;
            }

            const response = await permissionService.getPermissions({ 
                per_page: 1000,
                wing_id: targetWingId,
                subwing_id: targetSubwingId
            });
            
            let allPermissions = response.data.filter((p: Permission) => p.is_active);

            // Additional module-based filtering for userContext if applicable (fallback)
            if (userContext?.prefix) {
                const prefix = userContext.prefix.toLowerCase();
                allPermissions = allPermissions.filter(p => {
                    const module = (p.module || "").toLowerCase();
                    return module.startsWith(prefix) || module === "dashboard" || module === "users";
                });
            }
            setPermissions(allPermissions);
        } catch (error) {
            console.error("Failed to load permissions:", error);
        } finally {
            setPermissionsLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };
            
            // If wing or subwing changes, reload permissions
            if (field === "wing_id") {
                next.subwing_id = null; // Reset subwing
                loadPermissions(value, null);
            } else if (field === "subwing_id") {
                loadPermissions(prev.wing_id, value);
            }
            
            return next;
        });

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
            setError(err.message || "Failed to save role");
        }
    };

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

    const wingOptions = useMemo(() => [
        { label: "None / Global", value: "" },
        ...wings.map(w => ({ label: w.name, value: w.id.toString() }))
    ], [wings]);

    const filteredSubWings = useMemo(() => {
        if (!formData.wing_id) return [];
        return subWings.filter(sw => sw.wing_id === formData.wing_id);
    }, [subWings, formData.wing_id]);

    const subWingOptions = useMemo(() => [
        { label: "None / All Sub-Wings", value: "" },
        ...filteredSubWings.map(sw => ({ label: sw.name, value: sw.id.toString() }))
    ], [filteredSubWings]);

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

                {userIsSuperAdmin && (
                    <>
                        <div>
                            <Label>Wing Assignment (Optional)</Label>
                            <Select
                                value={formData.wing_id?.toString() || ""}
                                onChange={(val) => handleChange("wing_id", val ? parseInt(val) : null)}
                                options={wingOptions}
                            />
                        </div>

                        <div>
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
                <textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Enter description (optional)"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>

            <div>
                <Label>Extension</Label>
                <Input
                    value={formData.extension}
                    onChange={(e) => handleChange("extension", e.target.value)}
                    placeholder="Enter extension (optional)"
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <Label className="flex items-center gap-2 mb-0">
                        <span className="text-lg font-semibold text-gray-800 tracking-tight">Permissions</span>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                            {selectedPermissions.length} permissions assigned
                        </span>
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

                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    {permissionsLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading permissions...</div>
                    ) : permissions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No permissions available</div>
                    ) : (
                        <div className="h-[500px] overflow-y-auto p-4 space-y-4">
                            {Object.entries(filteredGroupedPermissions).length > 0 ? (
                                Object.entries(filteredGroupedPermissions).map(([module, modulePermissions]) => (
                                <div key={module} className="space-y-2 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <label className="flex items-center gap-2 cursor-pointer pb-2 border-b border-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={isModuleFullySelected(module)}
                                            ref={(el) => { if (el) el.indeterminate = isModulePartiallySelected(module); }}
                                            onChange={(e) => handleSelectAllModule(module, e.target.checked)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="font-semibold text-gray-800 capitalize">{module.replace(/_/g, " ")}</span>
                                        <span className="text-xs text-gray-500">
                                            ({modulePermissions.filter(p => selectedPermissions.includes(p.id)).length}/{modulePermissions.length})
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                                        {modulePermissions.map((permission) => (
                                            <label
                                                key={permission.id}
                                                className="flex items-start gap-2 cursor-pointer text-sm p-1.5 rounded hover:bg-gray-50 transition-colors"
                                                title={permission.description || permission.name}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPermissions.includes(permission.id)}
                                                    onChange={() => handlePermissionToggle(permission.id)}
                                                    className="w-3.5 h-3.5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                                                />
                                                <span className="text-gray-700 leading-snug">{permission.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No permissions found matching "{searchTerm}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-6 pt-6 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-3">
                        <Label className="text-xs text-gray-500 uppercase tracking-wider">Role Status</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="is_active"
                                    checked={formData.is_active === true}
                                    onChange={() => handleChange("is_active", true)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Active</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="is_active"
                                    checked={formData.is_active === false}
                                    onChange={() => handleChange("is_active", false)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Inactive</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs text-gray-500 uppercase tracking-wider">Role Switching</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="is_role_switch"
                                    checked={formData.is_role_switch === true}
                                    onChange={() => handleChange("is_role_switch", true)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Allow Switch</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="is_role_switch"
                                    checked={formData.is_role_switch === false}
                                    onChange={() => handleChange("is_role_switch", false)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">No Switch</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs text-gray-500 uppercase tracking-wider">Management</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="is_manage"
                                    checked={formData.is_manage === true}
                                    onChange={() => handleChange("is_manage", true)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="is_manage"
                                    checked={formData.is_manage === false}
                                    onChange={() => handleChange("is_manage", false)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">No</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs text-gray-500 uppercase tracking-wider">Merge Role Permissions</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="is_marge_role"
                                    checked={formData.is_marge_role === true}
                                    onChange={() => handleChange("is_marge_role", true)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="is_marge_role"
                                    checked={formData.is_marge_role === false}
                                    onChange={() => handleChange("is_marge_role", false)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">No</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4">
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
                        className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm font-medium"
                        disabled={loading}
                    >
                        {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
                        {isEdit ? "Update Role Configuration" : "Save Role Configuration"}
                    </button>
                </div>
            </div>
        </form>
    );
}
