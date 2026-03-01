"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Permission } from "@/libs/types/menu";
import { Wing, SubWing } from "@/libs/types/user";
import { Icon } from "@iconify/react";
import { permissionService } from "@/libs/services/permissionService";
import { wingService } from "@/libs/services/wingService";
import { subWingService } from "@/libs/services/subWingService";
import { useAuth } from "@/context/AuthContext";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";

type GroupRow = {
    code: string;
    permissions: Permission[];
};

export default function PermissionsPage() {
    const router = useRouter();
    const { user, userIsSuperAdmin } = useAuth();
    const [grouped, setGrouped] = useState<Record<string, Permission[]>>({});
    const [loading, setLoading] = useState(true);
    
    // Filter state
    const [wings, setWings] = useState<Wing[]>([]);
    const [subWings, setSubWings] = useState<SubWing[]>([]);
    const [selectedWingId, setSelectedWingId] = useState<number | null>(null);
    const [selectedSubWingId, setSelectedSubWingId] = useState<number | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
    });

    // Status toggle modal state
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusPermission, setStatusPermission] = useState<Permission | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    // Determine the wing/subwing context for the current user
    const userContext = useMemo(() => {
        if (!user || userIsSuperAdmin) return null;
        
        const primaryAssignment = user.roles?.find((r: any) => r.pivot?.is_primary) || 
                                user.roles?.[0] || 
                                (user as any).role;
                                
        if (!primaryAssignment) return null;

        const wing_id = primaryAssignment.pivot?.wing_id || primaryAssignment.wing_id;
        const sub_wing_id = primaryAssignment.pivot?.sub_wing_id || primaryAssignment.subwing_id;
        
        if (!wing_id && !sub_wing_id) return null;

        return { wing_id, sub_wing_id };
    }, [user, userIsSuperAdmin]);

    const loadPermissions = useCallback(async () => {
        try {
            setLoading(true);
            const wing_id = userContext?.wing_id || selectedWingId || undefined;
            const subwing_id = userContext?.sub_wing_id || selectedSubWingId || undefined;

            const response = await permissionService.getGroupedByCode({
                page: currentPage,
                per_page: perPage,
                search: searchTerm || undefined,
                wing_id: wing_id,
                subwing_id: subwing_id,
            });
            setGrouped(response.data);
            setPagination({
                current_page: response.current_page,
                last_page:    response.last_page,
                per_page:     response.per_page,
                total:        response.total,
                from:         response.from,
                to:           response.to,
            });
        } catch (error) {
            console.error("Failed to load permissions:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, perPage, searchTerm, userContext, selectedWingId, selectedSubWingId]);

    const loadFilters = async () => {
        if (!userIsSuperAdmin) return;
        try {
            const [wingsRes, subWingsRes] = await Promise.all([
                wingService.getAllWings({ allData: true, is_active: true }),
                subWingService.getAllSubWings({ allData: true, is_active: true })
            ]);
            setWings(wingsRes.data || []);
            setSubWings(subWingsRes.data || []);
        } catch (error) {
            console.error("Failed to load filters:", error);
        }
    };

    useEffect(() => {
        loadPermissions();
    }, [loadPermissions]);

    useEffect(() => {
        loadFilters();
    }, [userIsSuperAdmin]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handlePerPageChange = (value: number) => {
        setPerPage(value);
        setCurrentPage(1);
    };

    const handleWingFilterChange = (val: string) => {
        setSelectedWingId(val ? parseInt(val) : null);
        setSelectedSubWingId(null);
        setCurrentPage(1);
    };

    const handleSubWingFilterChange = (val: string) => {
        setSelectedSubWingId(val ? parseInt(val) : null);
        setCurrentPage(1);
    };

    const wingOptions = useMemo(() => [
        { label: "All Wings", value: "" },
        ...wings.map(w => ({ label: w.name, value: w.id.toString() }))
    ], [wings]);

    const filteredSubWings = useMemo(() => {
        if (!selectedWingId) return [];
        return subWings.filter(sw => sw.wing_id === selectedWingId);
    }, [subWings, selectedWingId]);

    const subWingOptions = useMemo(() => [
        { label: "All Sub-Wings", value: "" },
        ...filteredSubWings.map(sw => ({ label: sw.name, value: sw.id.toString() }))
    ], [filteredSubWings]);

    // Convert grouped object → flat rows for DataTable
    const rows = useMemo<GroupRow[]>(() =>
        Object.entries(grouped).map(([code, permissions]) => ({ code, permissions })),
    [grouped]);

    const handleAddPermission = () => router.push("/settings/permissions/create");
    const handleEditPermission = (p: Permission) => router.push(`/settings/permissions/${p.id}/edit`);
    const handleViewPermission = (p: Permission) => router.push(`/settings/permissions/${p.id}`);

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
                is_active: !statusPermission.is_active,
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

    const columns = useMemo(() => {
        const isWingFiltered = !!(userContext?.wing_id || selectedWingId);
        const cols: Column<GroupRow>[] = [
            {
                key: "sl",
                header: "SL.",
                className: "text-center text-gray-900 w-12",
                render: (_, index) => (pagination.from || 0) + index,
            },
            {
                key: "code",
                header: "Code",
                className: "font-semibold text-gray-800 uppercase w-32 whitespace-nowrap",
            },
            {
                key: "permissions",
                header: "Permissions",
                render: (row) => (
                    <div className="flex flex-wrap gap-2 py-1">
                        {row.permissions.map((permission) => (
                            <div
                                key={permission.id}
                                className="group relative flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-default text-sm"
                            >
                                <span className="text-gray-700 group-hover:text-blue-700 font-medium">
                                    {permission.name}
                                </span>
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                    permission.is_active ? "bg-green-500" : "bg-red-400"
                                }`} />
                                {/* Hover actions */}
                                <span className="hidden group-hover:flex items-center gap-0.5 ml-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleViewPermission(permission); }}
                                        className="p-0.5 text-blue-600 hover:bg-blue-100 rounded"
                                        title="View"
                                    >
                                        <Icon icon="hugeicons:view" className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEditPermission(permission); }}
                                        className="p-0.5 text-yellow-600 hover:bg-yellow-100 rounded"
                                        title="Edit"
                                    >
                                        <Icon icon="hugeicons:pencil-edit-01" className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(permission); }}
                                        className={`p-0.5 rounded ${
                                            permission.is_active
                                                ? "text-red-600 hover:bg-red-100"
                                                : "text-green-600 hover:bg-green-100"
                                        }`}
                                        title={permission.is_active ? "Deactivate" : "Activate"}
                                    >
                                        <Icon
                                            icon={permission.is_active ? "hugeicons:unavailable" : "hugeicons:checkmark-circle-02"}
                                            className="w-3.5 h-3.5"
                                        />
                                    </button>
                                </span>
                            </div>
                        ))}
                    </div>
                ),
            },
        ];

        if (!isWingFiltered) {
            cols.push({
                key: "dept",
                header: "Department",
                className: "text-xs text-gray-500 w-24",
                render: (row) => {
                    const p = row.permissions[0];
                    if (!p?.wing && !p?.subwing) return "Global";
                    return (
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-700">{p.wing?.name || p.wing?.code}</span>
                            {p.subwing && <span className="text-[10px] opacity-75">{p.subwing.name}</span>}
                        </div>
                    );
                }
            });
        }

        cols.push({
            key: "count",
            header: "Count",
            className: "text-center w-16",
            headerAlign: "center",
            render: (row) => (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    {row.permissions.length}
                </span>
            ),
        });

        return cols;
    }, [userContext, selectedWingId, pagination.from]);

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
                    Permission Management System
                </h2>
            </div>

            {/* Controls */}
            <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative w-80">
                            <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by code or permission name..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            />
                        </div>
                        {!loading && (
                            <span className="text-sm text-gray-500">
                                {pagination.total} group{pagination.total !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleAddPermission}
                        className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95"
                    >
                        <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
                        Add Permission
                    </button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="w-full min-h-[20vh] flex items-center justify-center">
                    <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={rows}
                    keyExtractor={(row) => row.code}
                    emptyMessage="No permissions found"
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
