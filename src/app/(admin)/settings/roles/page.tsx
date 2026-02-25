"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/libs/types/user";
import { Icon } from "@iconify/react";
import { roleService } from "@/libs/services/roleService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import RolePermissionModal from "@/components/roles/RolePermissionModal";

export default function RolesPage() {
    const router = useRouter();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Status modal state
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusRole, setStatusRole] = useState<Role | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    // Permission assignment modal state
    const [permissionRole, setPermissionRole] = useState<Role | null>(null);

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

    const loadRoles = useCallback(async () => {
        try {
            setLoading(true);
            const response = await roleService.getAllRoles({
                page: currentPage,
                per_page: perPage,
                search: searchTerm || undefined,
            });
            setRoles(response.data);
            setPagination({
                current_page: response.current_page,
                last_page: response.last_page,
                per_page: response.per_page,
                total: response.total,
                from: response.from,
                to: response.to,
            });
        } catch (error) {
            console.error("Failed to load roles:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, perPage, searchTerm]);

    useEffect(() => {
        loadRoles();
    }, [loadRoles]);

    // Listen for role updates
    useEffect(() => {
        const handleRoleUpdate = () => loadRoles();
        window.addEventListener('roleUpdated', handleRoleUpdate);
        return () => window.removeEventListener('roleUpdated', handleRoleUpdate);
    }, [loadRoles]);

    const handleAddRole = () => {
        router.push("/settings/roles/create");
    };

    const handleEditRole = (role: Role) => {
        router.push(`/settings/roles/${role.id}/edit`);
    };

    const handleViewRole = (role: Role) => {
        router.push(`/settings/roles/${role.id}`);
    };

    const handleToggleStatus = (role: Role) => {
        setStatusRole(role);
        setStatusModalOpen(true);
    };

    const confirmToggleStatus = async () => {
        if (!statusRole) return;

        try {
            setStatusLoading(true);
            await roleService.updateRole(statusRole.id, {
                name: statusRole.name,
                is_active: !statusRole.is_active
            });
            await loadRoles();
            setStatusModalOpen(false);
            setStatusRole(null);
        } catch (error) {
            console.error("Failed to update role status:", error);
            alert("Failed to update role status");
        } finally {
            setStatusLoading(false);
        }
    };

    const handleExport = () => {
        console.log("Export roles");
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
    const TableSkeleton = () => (
        <div className="animate-pulse">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="h-4 bg-gray-200 rounded w-40"></div>
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="h-4 bg-gray-200 rounded w-48"></div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="h-4 bg-gray-200 rounded w-28"></div>
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {Array.from({ length: perPage }).map((_, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="h-6 bg-gray-200 rounded-full w-16 mx-auto"></div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="h-6 bg-gray-200 rounded-full w-12 mx-auto"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="h-4 bg-gray-200 rounded w-36"></div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // Define table columns
    const columns: Column<Role>[] = [
        {
            key: "id",
            header: "SL.",
            className: "text-center text-gray-900",
            render: (role, index) => (pagination.from || 0) + (index + 1),
        },
        {
            key: "name",
            header: "Role Name",
            className: "font-medium text-gray-900",
            render: (role) => (
                <>
                    {role.name}
                    {role.is_super_admin && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                            Super Admin
                        </span>
                    )}
                </>
            ),
        },
        {
            key: "description",
            header: "Description",
            className: "text-gray-700",
            render: (role) => (
                <span className="line-clamp-2">
                    {role.description || "—"}
                </span>
            ),
        },
        
        {
            key: "permissions_list",
            header: "Permissions",
            className: "text-gray-700 whitespace-nowrap",
            render: (role) => (
                <div className="flex flex-wrap items-center gap-1 max-w-md">
                    {role.permissions && role.permissions.length > 0 ? (
                        role.permissions.slice(0, 3).map((permission, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700"
                                title={permission.description || permission.name}
                            >
                                {permission.name}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 text-sm">No permissions</span>
                    )}
                    {role.permissions && role.permissions.length > 3 && (
                        <span className="text-xs text-gray-500">+{role.permissions.length - 3} more</span>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); setPermissionRole(role); }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Assign permissions"
                    >
                        <Icon icon="hugeicons:add-circle" className="w-3.5 h-3.5" />
                        Assign
                    </button>
                </div>
            ),
        },
        {
            key: "is_active",
            header: "Status",
            className: "text-center",
            headerAlign: "center",
            render: (role) => (
                <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full ${
                    role.is_active !== false
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                }`}>
                    {role.is_active !== false ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            key: "created_at",
            header: "Created At",
            className: "text-gray-700 whitespace-nowrap",
            render: (role) =>
                role.created_at ? new Date(role.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }) : "—",
        },
        {
            key: "actions",
            header: "Actions",
            headerAlign: "center",
            className: "text-center no-print",
            render: (role) => (
                <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => handleViewRole(role)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View"
                    >
                        <Icon icon="hugeicons:view" className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleEditRole(role)}
                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Edit"
                    >
                        <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                    </button>
                    {role.is_active !== false ? (
                        <button
                            onClick={() => handleToggleStatus(role)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Deactivate"
                        >
                            <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => handleToggleStatus(role)}
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
                    All Roles List
                </h2>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="relative w-80">
                    <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by role name..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleAddRole} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
                        <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
                        Add Role
                    </button>
                    <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700">
                        <Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <TableSkeleton />
            ) : (
                <DataTable
                    columns={columns}
                    data={roles}
                    keyExtractor={(role) => role.id.toString()}
                    emptyMessage="No roles found"
                    onRowClick={handleViewRole}
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
            
            <RolePermissionModal
                isOpen={!!permissionRole}
                role={permissionRole}
                onClose={() => setPermissionRole(null)}
                onSaved={loadRoles}
            />

            <ConfirmationModal
                isOpen={statusModalOpen}
                onClose={() => setStatusModalOpen(false)}
                onConfirm={confirmToggleStatus}
                title={statusRole?.is_active ? "Deactivate Role" : "Activate Role"}
                message={`Are you sure you want to ${statusRole?.is_active ? "deactivate" : "activate"} the role "${statusRole?.name}"?`}
                confirmText={statusRole?.is_active ? "Deactivate" : "Activate"}
                cancelText="Cancel"
                loading={statusLoading}
                variant={statusRole?.is_active ? "danger" : "success"}
            />
        </div>
    );
}
