"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { permissionService } from "@/libs/services/permissionService";
import FullLogo from "@/components/ui/fulllogo";
import PermissionForm from "@/components/permissions/PermissionForm";
import type { PermissionAction } from "@/libs/types/menu";

export default function CreatePermissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any, selectedActions?: PermissionAction[]) => {
    setLoading(true);
    try {
      if (selectedActions && selectedActions.length > 0) {
        // Bulk create permissions
        const promises = selectedActions.map(action => {
          const permissionData = {
            ...formData,
            name: `${formData.name} ${action.name}`,
            slug: `${formData.code}-${action.code}`,
            code: formData.code,
            permission_action_id: action.id,
          };
          return permissionService.createPermission(permissionData);
        });
        
        await Promise.all(promises);
      } else {
        // Single create
        await permissionService.createPermission(formData);
      }
      
      window.dispatchEvent(new CustomEvent("permissionUpdated"));
      router.push("/settings/permissions");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/settings/permissions");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <FullLogo />
        </div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">
          Bangladesh Air Force Academy
        </h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
          Add New Permission
        </h2>
      </div>

      <PermissionForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
