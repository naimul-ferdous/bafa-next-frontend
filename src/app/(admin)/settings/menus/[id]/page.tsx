"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { menuService } from "@/libs/services/menuService";
import FullLogo from "@/components/ui/fulllogo";
import type { Menu } from "@/libs/types/menu";

export default function MenuDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const menuId = params?.id as string;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoading(true);
        const data = await menuService.getMenu(parseInt(menuId));
        if (data) {
          setMenu(data);
        } else {
          setError("Menu not found");
        }
      } catch (err) {
        console.error("Failed to load menu:", err);
        setError("Failed to load menu data");
      } finally {
        setLoading(false);
      }
    };

    if (menuId) {
      loadMenu();
    }
  }, [menuId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "Menu not found"}</p>
          <button
            onClick={() => router.push("/settings/menus")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to Menus
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      {/* Action Bar */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/settings/menus")}
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
            onClick={() => router.push(`/settings/menus/${menu.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Menu
          </button>
        </div>
      </div>

      <div className="p-8 cv-content">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
            Menu Details
          </p>
        </div>

        {/* Menu Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Menu Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-40 text-gray-900 font-medium">Menu Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{menu.name}</span>
            </div>
            <div className="flex">
              <span className="w-40 text-gray-900 font-medium">Slug</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-mono text-sm">{menu.slug}</span>
            </div>
            <div className="flex">
              <span className="w-40 text-gray-900 font-medium">Route</span>
              <span className="mr-4">:</span>
              <span className="text-blue-600 flex-1 font-mono text-sm">{menu.route || "—"}</span>
            </div>
            <div className="flex items-center">
              <span className="w-40 text-gray-900 font-medium">Icon</span>
              <span className="mr-4">:</span>
              {menu.icon ? (
                <span className="flex items-center gap-2 flex-1">
                  <Icon icon={menu.icon} className="w-5 h-5" />
                  <code className="text-xs text-gray-500">{menu.icon}</code>
                </span>
              ) : (
                <span className="text-gray-400 flex-1">—</span>
              )}
            </div>
            <div className="flex">
              <span className="w-40 text-gray-900 font-medium">Parent Menu</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{menu.parent?.name || "Root Menu"}</span>
            </div>
            <div className="flex">
              <span className="w-40 text-gray-900 font-medium">Order</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{menu.order}</span>
            </div>
            <div className="flex">
              <span className="w-40 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className={`flex-1 font-medium ${menu.is_active ? "text-green-600" : "text-red-600"}`}>
                {menu.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Required Permissions
          </h2>
          {menu.permissions && menu.permissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {menu.permissions.map((permission) => (
                <span
                  key={permission.id}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800"
                  title={permission.description || permission.name}
                >
                  {permission.name}
                  <span className="ml-2 text-xs text-blue-500 capitalize">({permission.module})</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No permissions required (Public menu)</p>
          )}
        </div>

        {/* System Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            System Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-40 text-gray-900 font-medium">Created At</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {menu.created_at ? new Date(menu.created_at).toLocaleString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-40 text-gray-900 font-medium">Last Updated</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {menu.updated_at ? new Date(menu.updated_at).toLocaleString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}
