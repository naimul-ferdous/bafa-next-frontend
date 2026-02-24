/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { menuService } from "@/libs/services/menuService";
import { useAuth } from "@/context/AuthContext";
import FullLogo from "@/components/ui/fulllogo";
import MenuForm from "@/components/menus/MenuForm";
import type { Menu, MenuCreateData } from "@/libs/types/menu";

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const menuId = params?.id as string;
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoadingMenu(true);
        const data = await menuService.getMenu(parseInt(menuId));
        if (data) {
          setMenu(data);
        } else {
          setError("Menu not found");
        }
      } catch (err) {
        console.error("Failed to load menu:", err);
        setError("Failed to load menu data. Please refresh the page.");
      } finally {
        setLoadingMenu(false);
      }
    };

    if (menuId) {
      loadMenu();
    }
  }, [menuId]);

  const handleSubmit = async (data: MenuCreateData, permissionIds: number[]) => {
    setLoading(true);
    try {
      await menuService.updateMenu(parseInt(menuId), data);
      await menuService.assignPermissions(parseInt(menuId), permissionIds);
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

  if (loadingMenu) {
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
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit Menu</h2>
      </div>

      <MenuForm
        initialData={menu}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
