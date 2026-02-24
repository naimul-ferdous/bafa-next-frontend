"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { roleService } from "@/libs/services/roleService";
import FullLogo from "@/components/ui/fulllogo";
import RoleForm from "@/components/roles/RoleForm";
import type { Role } from "@/libs/types/user";

export default function EditRolePage() {
    const router = useRouter();
    const params = useParams();
    const roleId = params?.id as string;

    const [loading, setLoading] = useState(false);
    const [loadingRole, setLoadingRole] = useState(true);
    const [role, setRole] = useState<Role | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadRole = async () => {
            try {
                setLoadingRole(true);
                const data = await roleService.getRole(parseInt(roleId));
                if (data) {
                    setRole(data);
                } else {
                    setError("Role not found");
                }
            } catch (err) {
                console.error("Failed to load role:", err);
                setError("Failed to load role data. Please refresh the page.");
            } finally {
                setLoadingRole(false);
            }
        };

        if (roleId) {
            loadRole();
        }
    }, [roleId]);

    const handleSubmit = async (formData: any, permissionIds: number[]) => {
        setLoading(true);
        try {
            await roleService.updateRole(parseInt(roleId), formData);
            await roleService.assignPermissions(parseInt(roleId), permissionIds);
            
            window.dispatchEvent(new CustomEvent('roleUpdated'));
            router.push("/settings/roles");
        } catch (err: any) {
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push("/settings/roles");
    };

    if (loadingRole) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-center py-12">
                    <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-center py-12">
                    <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
                    <p className="text-red-600">{error}</p>
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
        <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                    <FullLogo />
                </div>
                <h1 className="text-xl font-bold text-gray-900 uppercase">
                    Bangladesh Air Force Academy
                </h1>
                <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
                    Edit Role
                </h2>
            </div>

            <RoleForm
                initialData={role}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={true}
            />
        </div>
    );
}
