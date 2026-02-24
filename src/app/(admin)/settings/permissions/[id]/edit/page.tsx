"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { permissionService } from "@/libs/services/permissionService";
import FullLogo from "@/components/ui/fulllogo";
import PermissionForm from "@/components/permissions/PermissionForm";
import type { Permission } from "@/libs/types/menu";

export default function EditPermissionPage() {
  const router = useRouter();
  const params = useParams();
  const permissionId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingPermission, setLoadingPermission] = useState(true);
  const [permission, setPermission] = useState<Permission | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPermission = async () => {
      try {
        setLoadingPermission(true);
        const data = await permissionService.getPermission(parseInt(permissionId));
        if (data) {
          setPermission(data);
        } else {
          setError("Permission not found");
        }
      } catch (err) {
        console.error("Failed to load permission:", err);
        setError("Failed to load permission data. Please refresh the page.");
      } finally {
        setLoadingPermission(false);
      }
    };

    if (permissionId) {
      loadPermission();
    }
  }, [permissionId]);

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      await permissionService.updatePermission(parseInt(permissionId), formData);
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

  if (loadingPermission) {
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
            onClick={() => router.push("/settings/permissions")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Back to Permissions
          </button>
        </div>
      </div>
    );
  }

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
          Edit Permission
        </h2>
      </div>

      <PermissionForm
        initialData={permission}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
