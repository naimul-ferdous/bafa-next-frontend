"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "@/libs/types";
import type { Permission } from "@/libs/types/menu";
import { Icon } from "@iconify/react";
import { menuService } from "@/libs/services/menuService";
import { useAuth } from "@/context/AuthContext";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

export default function MenusPage() {
  const router = useRouter();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Status modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusMenu, setStatusMenu] = useState<Menu | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  });
  const { refreshUser } = useAuth();

  const loadMenus = useCallback(async () => {
    // Flatten nested menu structure for table display
    const flattenMenus = (menuList: Menu[]): Menu[] => {
      let result: Menu[] = [];
      menuList.forEach(menu => {
        const { children, ...menuWithoutChildren } = menu;
        result.push(menuWithoutChildren as Menu);
        if (children && children.length > 0) {
          result = result.concat(flattenMenus(children));
        }
      });
      return result;
    };

    try {
      setLoading(true);
      const response = await menuService.getAllMenus({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });
      const flatMenus = flattenMenus(response.data);
      setMenus(flatMenus);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load menus:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadMenus();

    // Listen for menu updates from the modal
    const handleMenuUpdate = () => {
      loadMenus();
    };
    window.addEventListener('menuUpdated', handleMenuUpdate);

    return () => {
      window.removeEventListener('menuUpdated', handleMenuUpdate);
    };
  }, [loadMenus]);

  const handleAddMenu = () => router.push("/settings/menus/create");
  const handleEditMenu = (menu: Menu) => router.push(`/settings/menus/${menu.id}/edit`);
  const handleViewMenu = (menu: Menu) => router.push(`/settings/menus/${menu.id}`);

  const handleToggleStatus = (menu: Menu) => {
    setStatusMenu(menu);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusMenu) return;

    try {
      setStatusLoading(true);
      await menuService.updateMenu(statusMenu.id, {
        name: statusMenu.name,
        slug: statusMenu.slug,
        is_active: !statusMenu.is_active
      });
      await loadMenus();
      await refreshUser();
      setStatusModalOpen(false);
      setStatusMenu(null);
    } catch (error) {
      console.error("Failed to update menu status:", error);
      alert("Failed to update menu status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExport = () => {
    console.log("Export menus");
  };

  const getParentMenuName = (parentId: number | null | undefined) => {
    if (!parentId) return "Root Menu";
    const parent = menus.find(m => m.id === parentId);
    return parent?.name || "Unknown";
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Table skeleton loader
  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div>
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
      </div>
    </div>
  );

  // Define table columns
  const columns: Column<Menu>[] = [
    {
      key: "id",
      header: "SL. No.",
      className: "text-gray-900",
      render: (menu, index) => (pagination.from || 0) + index,
    },
    {
      key: "name",
      header: "Menu Name",
      className: "font-medium text-gray-900",
      render: (menu) => (
        <>
          {menu.name}
          {!menu.is_active && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
              Inactive
            </span>
          )}
        </>
      ),
    },
    {
      key: "parent_id",
      header: "Parent Menu",
      className: "text-gray-700",
      render: (menu) => getParentMenuName(menu.parent_id),
    },
    {
      key: "route",
      header: "Route Path",
      render: (menu) =>
        menu.route ? (
          <span className="text-blue-600 font-mono">{menu.route}</span>
        ) : (
          <span className="text-gray-400">N/A</span>
        ),
    },
    {
      key: "icon",
      header: "Icon",
      render: (menu) =>
        menu.icon ? (
          <div className="flex items-center gap-2">
            <Icon icon={menu.icon} className="w-5 h-5" />
            <code className="text-xs text-gray-500">{menu.icon}</code>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: "order",
      header: "Sorting",
      className: "text-gray-900",
    },
    {
      key: "permissions",
      header: "Required Permissions",
      className: "text-gray-700",
      render: (menu) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {menu.permissions && menu.permissions.length > 0 ? (
            menu.permissions.slice(0, 3).map((permission: Permission) => (
              <span
                key={permission.id}
                className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700"
                title={permission.description || permission.name}
              >
                {permission.name}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-xs">Public</span>
          )}
          {menu.permissions && menu.permissions.length > 3 && (
            <span className="text-xs text-gray-500">+{menu.permissions.length - 3} more</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (menu) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${menu.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {menu.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (menu) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEditMenu(menu)}
            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
            title="Edit"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
          </button>
          {menu.is_active ? (
            <button
              onClick={() => handleToggleStatus(menu)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Deactivate"
            >
              <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleToggleStatus(menu)}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Activate"
            >
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <FullLogo />
        </div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">
          Bangladesh Air Force Academy
        </h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
          All Menus List
        </h2>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by menu name, route..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0"
          />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleAddMenu} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
            <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
            Add Menu
          </button>
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700">
            <Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableLoading />
      ) : (
        <DataTable
          columns={columns}
          data={menus}
          keyExtractor={(menu) => menu.id.toString()}
          emptyMessage="No menus found"
          onRowClick={handleViewMenu}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        lastPage={pagination.last_page}
        total={pagination.total}
        from={pagination.from}
        to={pagination.to}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={handlePerPageChange}
      />

      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusMenu?.is_active ? "Deactivate Menu" : "Activate Menu"}
        message={`Are you sure you want to ${statusMenu?.is_active ? "deactivate" : "activate"} the menu "${statusMenu?.name}"?`}
        confirmText={statusMenu?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusMenu?.is_active ? "danger" : "success"}
      />
    </div>
  );
}
