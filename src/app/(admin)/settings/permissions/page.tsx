"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Permission } from "@/libs/types/menu";
import { Icon } from "@iconify/react";
import { permissionService } from "@/libs/services/permissionService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

export default function PermissionsPage() {
    const router = useRouter();
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Status toggle modal state
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusPermission, setStatusPermission] = useState<Permission | null>(null);
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

    const loadPermissions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await permissionService.getAllPermissions({
                page: currentPage,
                per_page: perPage,
                search: searchTerm || undefined,
            });
            setPermissions(response.data);
            setPagination({
                current_page: response.current_page,
                last_page: response.last_page,
                per_page: response.per_page,
                total: response.total,
                from: response.from,
                to: response.to,
            });
        } catch (error) {
            console.error("Failed to load permissions:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, perPage, searchTerm]);

    useEffect(() => {
        loadPermissions();
    }, [loadPermissions]);

    // Listen for permission updates
    useEffect(() => {
        const handlePermissionUpdate = () => loadPermissions();
        window.addEventListener('permissionUpdated', handlePermissionUpdate);
        return () => window.removeEventListener('permissionUpdated', handlePermissionUpdate);
    }, [loadPermissions]);

    const handleAddPermission = () => {
        router.push("/settings/permissions/create");
    };

    const handleEditPermission = (permission: Permission) => {
        router.push(`/settings/permissions/${permission.id}/edit`);
    };

    const handleViewPermission = (permission: Permission) => {
        router.push(`/settings/permissions/${permission.id}`);
    };

    const handleToggleStatus = (permission: Permission) => {
        setStatusPermission(permission);
        setStatusModalOpen(true);
    };

    const confirmToggleStatus = async () => {
        if (!statusPermission) return;

        try {
            setStatusLoading(true);
            await permissionService.updatePermission(statusPermission.id, {
                name: statusPermission.name,
                slug: statusPermission.slug,
                module: statusPermission.module,
                is_active: !statusPermission.is_active
            });
            await loadPermissions();
            setStatusModalOpen(false);
            setStatusPermission(null);
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status");
        } finally {
            setStatusLoading(false);
        }
    };

    const handleExport = () => {
        console.log("Export permissions");
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
    const columns: Column<Permission>[] = [
        {
            key: "id",
            header: "SL.",
            className: "text-center text-gray-900",
            render: (permission, index) => (pagination.from || 0) + (index + 1),
        },
        {
            key: "name",
            header: "Permission Name",
            className: "font-medium text-gray-900",
        },
        {
            key: "slug",
            header: "Slug",
            className: "text-gray-700 font-mono text-sm",
        },
        {
            key: "module",
            header: "Module",
            className: "text-gray-700",
            render: (permission) => (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-tighter">
                    {permission.module}
                </span>
            ),
        },
        {
            key: "description",
            header: "Description",
            className: "text-gray-700",
            render: (permission) => (
                <span className="line-clamp-2">
                    {permission.description || "—"}
                </span>
            ),
        },
        {
            key: "is_active",
            header: "Status",
            className: "text-center",
            headerAlign: "center",
            render: (permission) => (
                <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full ${
                    permission.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                }`}>
                    {permission.is_active ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            key: "created_at",
            header: "Created At",
            className: "text-gray-700 whitespace-nowrap",
            render: (permission) =>
                new Date(permission.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }),
        },
        {
            key: "actions",
            header: "Actions",
            headerAlign: "center",
            className: "text-center no-print",
            render: (permission) => (
                <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => handleViewPermission(permission)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View"
                    >
                        <Icon icon="hugeicons:view" className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleEditPermission(permission)}
                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                        title="Edit"
                    >
                        <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                    </button>
                    {permission.is_active ? (
                        <button
                            onClick={() => handleToggleStatus(permission)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Deactivate"
                        >
                            <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => handleToggleStatus(permission)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
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
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                    <FullLogo />
                </div>
                <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
                    Bangladesh Air Force Academy
                </h1>
                <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">
                    All Permissions List
                </h2>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="relative w-80">
                    <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by permission name..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleAddPermission} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95">
                        <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
                        Add Permission
                    </button>
                    <button onClick={handleExport} className="px-4 py-2 rounded-lg text-gray-700 flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
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
                    data={permissions}
                    keyExtractor={(permission) => permission.id.toString()}
                    emptyMessage="No permissions found"
                    onRowClick={handleViewPermission}
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
                title={statusPermission?.is_active ? "Deactivate Permission" : "Activate Permission"}
                message={`Are you sure you want to ${statusPermission?.is_active ? "deactivate" : "activate"} the permission "${statusPermission?.name}"?`}
                confirmText={statusPermission?.is_active ? "Deactivate" : "Activate"}
                cancelText="Cancel"
                loading={statusLoading}
                variant={statusPermission?.is_active ? "danger" : "success"}
            />
        </div>
    );
}
