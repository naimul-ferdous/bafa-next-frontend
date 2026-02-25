"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Ftw11sqnFlyingSyllabus } from "@/libs/types/ftw11sqnFlying";
import { Icon } from "@iconify/react";
import { ftw11sqnFlyingSyllabusService } from "@/libs/services/ftw11sqnFlyingSyllabusService";
import FullLogo from "@/components/ui/fulllogo";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

// Table row type with extracted Dual/Solo data
interface SyllabusTableRow {
    id: number;
    phase_full_name: string;
    phase_shortname: string;
    phase_symbol: string;
    phase_sort: number;
    dual_sorties: number;
    dual_hours: number;
    solo_sorties: number;
    solo_hours: number;
    total_sorties: number;
    total_hours: number;
    is_active: boolean;
    syllabus: Ftw11sqnFlyingSyllabus;
}

// Convert decimal hours to HH:MM format
const formatHoursToHHMM = (hours: number | string | null): string => {
    if (hours === null || hours === undefined) return "-";
    const numHours = typeof hours === "string" ? parseFloat(hours) : hours;
    if (isNaN(numHours) || numHours === 0) return "-";
    const totalMinutes = Math.round(numHours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}:${m.toString().padStart(2, "0")}`;
};

export default function Ftw11sqnFlyingSyllabusPage() {
    const router = useRouter();
    const [syllabusData, setSyllabusData] = useState<Ftw11sqnFlyingSyllabus[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Status modal state
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusSyllabus, setStatusSyllabus] = useState<SyllabusTableRow | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const [perPage, setPerPage] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 50,
        total: 0,
        from: 0,
        to: 0,
    });

    const loadSyllabus = useCallback(async () => {
        try {
            setLoading(true);
            const response = await ftw11sqnFlyingSyllabusService.getAll({
                page: currentPage,
                per_page: perPage,
            });
            setSyllabusData(response.data);
            setPagination({
                current_page: response.current_page,
                last_page: response.last_page,
                per_page: response.per_page,
                total: response.total,
                from: response.from,
                to: response.to,
            });
        } catch (error) {
            console.error("Failed to load flying syllabus:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, perPage]);

    useEffect(() => {
        loadSyllabus();
    }, [loadSyllabus]);

    // Transform syllabus data for table display
    const tableData = useMemo((): SyllabusTableRow[] => {
        return syllabusData.map((syllabus) => {
            // Extract Dual and Solo data from syllabus_types
            const dualType = syllabus.syllabus_types?.find(
                st => st.phase_type?.type_code?.toLowerCase() === "dual"
            );
            const soloType = syllabus.syllabus_types?.find(
                st => st.phase_type?.type_code?.toLowerCase() === "solo"
            );

            const dualSorties = dualType?.sorties || 0;
            const dualHours = parseFloat(String(dualType?.hours || 0));
            const soloSorties = soloType?.sorties || 0;
            const soloHours = parseFloat(String(soloType?.hours || 0));

            return {
                id: syllabus.id,
                phase_full_name: syllabus.phase_full_name,
                phase_shortname: syllabus.phase_shortname,
                phase_symbol: syllabus.phase_symbol || "",
                phase_sort: syllabus.phase_sort,
                dual_sorties: dualSorties,
                dual_hours: dualHours,
                solo_sorties: soloSorties,
                solo_hours: soloHours,
                total_sorties: dualSorties + soloSorties,
                total_hours: dualHours + soloHours,
                is_active: syllabus.is_active,
                syllabus: syllabus,
            };
        }).sort((a, b) => a.phase_sort - b.phase_sort);
    }, [syllabusData]);

    const handleAddSyllabus = () => router.push("/ftw/11sqn/results/flying/syllabus/create");
    const handleEditSyllabus = (row: SyllabusTableRow) => {
        router.push(`/ftw/11sqn/results/flying/syllabus/${row.id}/edit`);
    };
    const handleViewSyllabus = (row: SyllabusTableRow) => {
        router.push(`/ftw/11sqn/results/flying/syllabus/${row.id}`);
    };
    
    const handleToggleStatus = (row: SyllabusTableRow) => {
        setStatusSyllabus(row);
        setStatusModalOpen(true);
    };

    const confirmToggleStatus = async () => {
        if (!statusSyllabus) return;

        try {
            setStatusLoading(true);
            await ftw11sqnFlyingSyllabusService.update(statusSyllabus.id, {
                is_active: !statusSyllabus.is_active
            });
            await loadSyllabus();
            setStatusModalOpen(false);
            setStatusSyllabus(null);
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status");
        } finally {
            setStatusLoading(false);
        }
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const currentRow = tableData[index];
        const prevRow = tableData[index - 1];

        try {
            await ftw11sqnFlyingSyllabusService.update(currentRow.id, { phase_sort: prevRow.phase_sort });
            await ftw11sqnFlyingSyllabusService.update(prevRow.id, { phase_sort: currentRow.phase_sort });
            await loadSyllabus();
        } catch (error) {
            console.error("Failed to reorder:", error);
        }
    };

    const handleMoveDown = async (index: number) => {
        if (index === tableData.length - 1) return;
        const currentRow = tableData[index];
        const nextRow = tableData[index + 1];

        try {
            await ftw11sqnFlyingSyllabusService.update(currentRow.id, { phase_sort: nextRow.phase_sort });
            await ftw11sqnFlyingSyllabusService.update(nextRow.id, { phase_sort: currentRow.phase_sort });
            await loadSyllabus();
        } catch (error) {
            console.error("Failed to reorder:", error);
        }
    };

    const handleExport = () => console.log("Export flying syllabus");
    const handlePerPageChange = (value: number) => {
        setPerPage(value);
        setCurrentPage(1);
    };

    const TableLoading = () => (
        <div className="w-full min-h-[20vh] flex items-center justify-center">
            <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4"><FullLogo /></div>
                <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 11 SQN Flying Syllabus</h2>
            </div>

            <div className="flex items-center justify-end gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={handleAddSyllabus} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Syllabus</button>
                    <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
                </div>
            </div>

            {loading ? (
                <TableLoading />
            ) : (
                <div className="overflow-x-auto border border-black rounded-lg">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-black">
                                <th rowSpan={2} className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">#</th>
                                <th rowSpan={2} className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">SL</th>
                                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-black">PHASE</th>
                                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-black">SHORT NAME</th>
                                <th rowSpan={2} className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">SYMBOL</th>
                                <th colSpan={2} className="px-3 py-2 text-center font-semibold text-gray-700 border-r border-black">DUAL</th>
                                <th colSpan={2} className="px-3 py-2 text-center font-semibold text-gray-700 border-r border-black">SOLO</th>
                                <th colSpan={2} className="px-3 py-2 text-center font-semibold text-gray-700 border-r border-black">TOTAL</th>
                                <th rowSpan={2} className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">STATUS</th>
                                <th rowSpan={2} className="px-3 py-3 text-center font-semibold text-gray-700">ACTIONS</th>
                            </tr>
                            <tr className="border-b border-black">
                                <th className="px-3 py-2 text-center font-medium text-gray-600 border-r border-black">SORTIES</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-600 border-r border-black">HOURS</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-600 border-r border-black">SORTIES</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-600 border-r border-black">HOURS</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-600 border-r border-black">SORTIES</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-600 border-r border-black">HOURS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                                        No flying syllabus found
                                    </td>
                                </tr>
                            ) : (
                                tableData.map((row, index) => (
                                    <tr 
                                        key={row.id} 
                                        className={`hover:bg-gray-50 cursor-pointer ${index !== tableData.length - 1 ? "border-b border-black" : ""}`}
                                        onClick={() => handleViewSyllabus(row)}
                                    >
                                        <td className="px-2 py-2 text-center border-r border-black" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleMoveUp(index)}
                                                    disabled={index === 0}
                                                    className="p-0.5 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Move Up"
                                                >
                                                    <Icon icon="hugeicons:arrow-up-01" className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveDown(index)}
                                                    disabled={index === tableData.length - 1}
                                                    className="p-0.5 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Move Down"
                                                >
                                                    <Icon icon="hugeicons:arrow-down-01" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-center font-medium text-gray-900 border-r border-black">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-2 text-gray-900 border-r border-black">
                                            {row.phase_full_name}
                                        </td>
                                        <td className="px-4 py-2 text-gray-700 border-r border-black">
                                            {row.phase_shortname}
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-700 border-r border-black">
                                            {row.phase_symbol}
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-700 border-r border-black">
                                            {row.dual_sorties || "-"}
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-700 border-r border-black">
                                            {formatHoursToHHMM(row.dual_hours)}
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-700 border-r border-black">
                                            {row.solo_sorties || "-"}
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-700 border-r border-black">
                                            {formatHoursToHHMM(row.solo_hours)}
                                        </td>
                                        <td className="px-3 py-2 text-center font-semibold text-gray-900 border-r border-black">
                                            {row.total_sorties}
                                        </td>
                                        <td className="px-3 py-2 text-center font-semibold text-green-700 border-r border-black">
                                            {formatHoursToHHMM(row.total_hours)}
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-black" onClick={(e) => e.stopPropagation()}>
                                            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${row.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                {row.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleEditSyllabus(row)}
                                                    className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                                                    title="Edit"
                                                >
                                                    <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                                                </button>
                                                {row.is_active ? (
                                                    <button
                                                        onClick={() => handleToggleStatus(row)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Deactivate"
                                                    >
                                                        <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleToggleStatus(row)}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                        title="Activate"
                                                    >
                                                        <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-700">Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results</div>
                    <select value={perPage} onChange={(e) => handlePerPageChange(Number(e.target.value))} className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900">
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />Prev</button>
                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setCurrentPage(page)} className={`px-4 py-2 text-sm rounded-lg ${currentPage === page ? "bg-blue-600 text-white" : "border border-black hover:bg-gray-50"}`}>{page}</button>
                    ))}
                    <button onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))} disabled={currentPage === pagination.last_page} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next<Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" /></button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={statusModalOpen}
                onClose={() => setStatusModalOpen(false)}
                onConfirm={confirmToggleStatus}
                title={statusSyllabus?.is_active ? "Deactivate Syllabus" : "Activate Syllabus"}
                message={`Are you sure you want to ${statusSyllabus?.is_active ? "deactivate" : "activate"} the syllabus "${statusSyllabus?.phase_full_name}"?`}
                confirmText={statusSyllabus?.is_active ? "Deactivate" : "Activate"}
                cancelText="Cancel"
                loading={statusLoading}
                variant={statusSyllabus?.is_active ? "danger" : "success"}
            />
        </div>
    );
}
