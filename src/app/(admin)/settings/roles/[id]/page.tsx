"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { roleService } from "@/libs/services/roleService";
import FullLogo from "@/components/ui/fulllogo";
import type { Role } from "@/libs/types/user";

export default function ViewRolePage() {
    const router = useRouter();
    const params = useParams();
    const roleId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<Role | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadRole = async () => {
            try {
                setLoading(true);
                const data = await roleService.getRole(parseInt(roleId));
                if (data) {
                    setRole(data);
                } else {
                    setError("Role not found");
                }
            } catch (err) {
                console.error("Failed to load role:", err);
                setError("Failed to load role data.");
            } finally {
                setLoading(false);
            }
        };

        if (roleId) {
            loadRole();
        }
    }, [roleId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-center py-12">
                    <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-600">Loading role details...</p>
                </div>
            </div>
        );
    }

    if (error || !role) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-center py-12">
                    <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
                    <p className="text-red-600">{error || "Role not found"}</p>
                    <button
                        onClick={() => router.push("/settings/roles")}
                        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                    >
                        Back to Roles
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
            {/* Action Buttons - Hidden on print */}
            <div className="p-4 flex items-center justify-between no-print">
                <button
                    onClick={() => router.push("/settings/roles")}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                    Back to List
                </button>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Icon icon="hugeicons:printer" className="w-4 h-4" />
                        Print
                    </button>
                    <button
                        onClick={() => router.push(`/settings/roles/${role.id}/edit`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                        Edit Role
                    </button>
                </div>
            </div>

            {/* CV Content */}
            <div className="p-8 cv-content">
                {/* Header with Logo */}
                <div className="mb-8">
                    <div className="flex justify-center mb-4">
                        <FullLogo />
                    </div>
                    <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
                        Bangladesh Air Force Academy
                    </h1>
                    <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
                        Role Details - {role.name}
                    </p>
                </div>

                {/* Basic Information Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Role Information
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Role Name</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{role.name}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Role Slug</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1 font-mono">{role.slug}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Super Admin</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{role.is_super_admin ? "Yes" : "No"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Status</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{role.is_active !== false ? "Active" : "Inactive"}</span>
                        </div>
                        <div className="flex col-span-2">
                            <span className="w-48 text-gray-900 font-medium">Description</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1 italic">{role.description || "N/A"}</span>
                        </div>
                    </div>
                </div>

                {/* Permissions Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Assigned Permissions ({role.permissions?.length || 0})
                    </h2>
                    
                    {role.permissions && role.permissions.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
                            {role.permissions.map((permission, index) => (
                                <div key={permission.id} className="flex text-sm items-baseline">
                                    <span className="w-8 text-gray-400 flex-shrink-0">{index + 1}.</span>
                                    <div className="flex flex-col">
                                        <span className="text-gray-900 font-medium leading-tight">{permission.name}</span>
                                        <span className="text-gray-400 font-mono text-[9px] uppercase tracking-tighter">({permission.module})</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No permissions assigned to this role.</p>
                    )}
                </div>

                {/* System Information Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        System Information
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Created At</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">
                                {role.created_at ? new Date(role.created_at).toLocaleString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                }) : "N/A"}
                            </span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Last Updated</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">
                                {role.updated_at ? new Date(role.updated_at).toLocaleString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                }) : "N/A"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer with date */}
                <div className="mt-12 text-center text-sm text-gray-600">
                    <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
            </div>
        </div>
    );
}
