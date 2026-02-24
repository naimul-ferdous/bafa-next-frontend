"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Rank } from "@/libs/types";
import { Icon } from "@iconify/react";
import { rankService } from "@/libs/services/rankService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { RankModalProvider, useRankModal } from "@/context/RankModalContext";
import RankFormModal from "@/components/ranks/RankFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

function RanksPageContent() {
    const { openModal } = useRankModal();
    const [ranks, setRanks] = useState<Rank[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Status toggle modal state
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusRank, setStatusRank] = useState<Rank | null>(null);
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

    const loadRanks = useCallback(async () => {
        try {
            setLoading(true);
            const response = await rankService.getAllRanks({
                page: currentPage,
                per_page: perPage,
                search: searchTerm || undefined,
            });
            setRanks(response.data);
            setPagination({
                current_page: response.current_page,
                last_page: response.last_page,
                per_page: response.per_page,
                total: response.total,
                from: response.from,
                to: response.to,
            });
        } catch (error) {
            console.error("Failed to load ranks:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, perPage, searchTerm]);

    useEffect(() => {
        loadRanks();
    }, [loadRanks]);

    // Listen for rank updates
    useEffect(() => {
        const handleRankUpdate = () => loadRanks();
        window.addEventListener('rankUpdated', handleRankUpdate);
        return () => window.removeEventListener('rankUpdated', handleRankUpdate);
    }, [loadRanks]);

    const handleAddRank = () => {
        openModal();
    };

    const handleEditRank = (rank: Rank) => {
        openModal(rank);
    };

    const handleViewRank = (rank: Rank) => {
        openModal(rank); // Assuming modal also has a view mode or we just open for edit
    };

    const handleToggleStatus = (rank: Rank) => {
        setStatusRank(rank);
        setStatusModalOpen(true);
    };

    const confirmToggleStatus = async () => {
        if (!statusRank) return;

        try {
            setStatusLoading(true);
            await rankService.updateRank(statusRank.id, {
                name: statusRank.name,
                short_name: statusRank.short_name,
                hierarchy_level: statusRank.hierarchy_level,
                is_active: !statusRank.is_active
            });
            await loadRanks();
            setStatusModalOpen(false);
            setStatusRank(null);
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status");
        } finally {
            setStatusLoading(false);
        }
    };

    const handleExport = () => {
        console.log("Export ranks");
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
    const columns: Column<Rank>[] = [
        {
            key: "id",
            header: "SL. No.",
            className: "text-gray-900",
            render: (rank, index) => (pagination.from || 0) + index,
        },
        {
            key: "name",
            header: "Rank Name",
            className: "font-medium text-gray-900",
        },
        {
            key: "short_name",
            header: "Short Name",
            className: "text-gray-700 font-medium",
        },
        {
            key: "is_active",
            header: "Status",
            className: "text-center",
            headerAlign: "center",
            render: (rank) => (
                <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full ${
                    rank.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                }`}>
                    {rank.is_active ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            key: "hierarchy_level",
            header: "Hierarchy Level",
            className: "text-center",
            headerAlign: "center",
            render: (rank) => (
                <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                    {rank.hierarchy_level}
                </span>
            ),
        },
        {
            key: "created_at",
            header: "Created At",
            className: "text-gray-700",
            render: (rank) =>
                new Date(rank.created_at).toLocaleDateString("en-GB", {
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
            render: (rank) => (
                <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => handleEditRank(rank)}
                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                        title="Edit"
                    >
                        <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                    </button>
                    {rank.is_active ? (
                        <button
                            onClick={() => handleToggleStatus(rank)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Deactivate"
                        >
                            <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => handleToggleStatus(rank)}
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
                    All Ranks List
                </h2>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="relative w-80">
                    <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by rank name..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleAddRank} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
                        <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
                        Add Rank
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
                    data={ranks}
                    keyExtractor={(rank) => rank.id.toString()}
                    emptyMessage="No ranks found"
                    onRowClick={handleViewRank}
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

            <RankFormModal />
            <ConfirmationModal
                isOpen={statusModalOpen}
                onClose={() => setStatusModalOpen(false)}
                onConfirm={confirmToggleStatus}
                title={statusRank?.is_active ? "Deactivate Rank" : "Activate Rank"}
                message={`Are you sure you want to ${statusRank?.is_active ? "deactivate" : "activate"} the rank "${statusRank?.name}"?`}
                confirmText={statusRank?.is_active ? "Deactivate" : "Activate"}
                cancelText="Cancel"
                loading={statusLoading}
                variant={statusRank?.is_active ? "danger" : "success"}
            />
        </div>
    );
}

export default function RanksPage() {
    return (
        <RankModalProvider>
            <RanksPageContent />
        </RankModalProvider>
    );
}
