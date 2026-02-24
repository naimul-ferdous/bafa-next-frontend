"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { permissionService } from "@/libs/services/permissionService";
import FullLogo from "@/components/ui/fulllogo";
import type { Permission } from "@/libs/types/menu";

export default function ViewPermissionPage() {
  const router = useRouter();
  const params = useParams();
  const permissionId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<Permission | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPermission = async () => {
      try {
        setLoading(true);
        const data = await permissionService.getPermission(parseInt(permissionId));
        if (data) {
          setPermission(data);
        } else {
          setError("Permission not found");
        }
      } catch (err) {
        console.error("Failed to load permission:", err);
        setError("Failed to load permission data.");
      } finally {
        setLoading(false);
      }
    };

    if (permissionId) {
      loadPermission();
    }
  }, [permissionId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
          <p className="text-gray-600">Loading permission details...</p>
        </div>
      </div>
    );
  }

  if (error || !permission) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "Permission not found"}</p>
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
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-8">
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/settings/permissions")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/settings/permissions/${permission.id}/edit`)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 transition-all shadow-sm"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Permission
          </button>
        </div>
      </div>

      <div className="text-center">
        <div className="flex justify-center mb-4">
          <FullLogo />
        </div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
          Bangladesh Air Force Academy
        </h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">
          Permission Details
        </h2>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-inner">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Permission Name</h3>
            <p className="text-lg font-bold text-gray-900">{permission.name}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Slug</h3>
            <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-gray-200 text-blue-600">
              {permission.slug}
            </code>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Module</h3>
            <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase">
              {permission.module}
            </span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</h3>
            <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full ${
              permission.is_active
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}>
              {permission.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Description</h3>
            <p className="text-gray-700 bg-white p-4 rounded-xl border border-gray-100 italic shadow-sm">
              {permission.description || "No description provided."}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Created At</h3>
            <p className="text-sm text-gray-600">
              {new Date(permission.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Last Updated</h3>
            <p className="text-sm text-gray-600">
              {new Date(permission.updated_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
