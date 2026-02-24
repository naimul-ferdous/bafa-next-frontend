/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { menuService } from "@/libs/services/menuService";
import { useAuth } from "@/context/AuthContext";
import FullLogo from "@/components/ui/fulllogo";
import MenuForm from "@/components/menus/MenuForm";
import type { MenuCreateData } from "@/libs/types/menu";

export default function CreateMenuPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: MenuCreateData, permissionIds: number[]) => {
    setLoading(true);
    try {
      const newMenu = await menuService.createMenu(data);
      if (!newMenu) throw new Error("Failed to create menu");
      await menuService.assignPermissions(newMenu.id, permissionIds);
      await refreshUser();
      window.dispatchEvent(new CustomEvent("menuUpdated"));
      router.push("/settings/menus");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/settings/menus");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Add New Menu</h2>
      </div>

      <MenuForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
