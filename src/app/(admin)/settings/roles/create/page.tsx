"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { roleService } from "@/libs/services/roleService";
import FullLogo from "@/components/ui/fulllogo";
import RoleForm from "@/components/roles/RoleForm";

export default function CreateRolePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: any, permissionIds: number[]) => {
        setLoading(true);
        try {
            const newRole = await roleService.createRole(formData);
            if (!newRole) throw new Error("Failed to create role");
            
            // Assign permissions to role
            await roleService.assignPermissions(newRole.id, permissionIds);
            
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
                    Add New Role
                </h2>
            </div>

            <RoleForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={false}
            />
        </div>
    );
}
