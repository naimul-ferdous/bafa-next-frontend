"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function Ftw11sqnDetailedFlyingSyllabusPage() {
    const router = useRouter();
    const params = useParams();
    const semesterId = parseInt(params.semesterId as string);

    const [syllabusData, setSyllabusData] = useState<Ftw11sqnFlyingSyllabus[]>([]);
    const [loading, setLoading] = useState(true);
    const [semesterName, setSemesterName] = useState("");

    // Status modal state
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusSyllabus, setStatusSyllabus] = useState<SyllabusTableRow | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const loadSyllabus = useCallback(async () => {
        try {
            setLoading(true);
            const data = await ftw11sqnFlyingSyllabusService.getSemesterGrouped({ semester_id: semesterId });

            const currentSemester = data.find((s: { semester_id: number }) => s.semester_id === semesterId);
            if (currentSemester) {
                setSemesterName(currentSemester.semester_name);
                setSyllabusData(currentSemester.syllabus);
            }
        } catch (error) {
            console.error("Failed to load detailed flying syllabus:", error);
        } finally {
            setLoading(false);
        }
    }, [semesterId]);

    useEffect(() => {
        if (semesterId) {
            loadSyllabus();
        }
    }, [semesterId, loadSyllabus]);

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

    const handleEditSyllabus = (row: SyllabusTableRow) => {
        router.push(`/ftw/11sqn/results/flying/syllabus/${row.id}/edit`);
    };
    const handleViewSyllabus = (row: SyllabusTableRow) => {
        router.push(`/ftw/11sqn/results/flying/syllabus/${row.id}`);
    };

    const handlePrint = () => {
        window.print();
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

        // When sort values are equal, push the other row down; otherwise swap
        const currentSort = currentRow.phase_sort;
        const prevSort = prevRow.phase_sort;
        const newCurrentSort = prevSort === currentSort ? currentSort : prevSort;
        const newPrevSort = prevSort === currentSort ? currentSort + 1 : currentSort;

        try {
            await Promise.all([
                ftw11sqnFlyingSyllabusService.update(currentRow.id, { phase_sort: newCurrentSort }),
                ftw11sqnFlyingSyllabusService.update(prevRow.id, { phase_sort: newPrevSort }),
            ]);
            await loadSyllabus();
        } catch (error) {
            console.error("Failed to reorder:", error);
        }
    };

    const handleMoveDown = async (index: number) => {
        if (index === tableData.length - 1) return;
        const currentRow = tableData[index];
        const nextRow = tableData[index + 1];

        const currentSort = currentRow.phase_sort;
        const nextSort = nextRow.phase_sort;
        const newCurrentSort = nextSort === currentSort ? currentSort + 1 : nextSort;
        const newNextSort = nextSort === currentSort ? currentSort : currentSort;

        try {
            await Promise.all([
                ftw11sqnFlyingSyllabusService.update(currentRow.id, { phase_sort: newCurrentSort }),
                ftw11sqnFlyingSyllabusService.update(nextRow.id, { phase_sort: newNextSort }),
            ]);
            await loadSyllabus();
        } catch (error) {
            console.error("Failed to reorder:", error);
        }
    };

    const TableLoading = () => (
        <div className="w-full min-h-[20vh] flex items-center justify-center">
            <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
        </div>
    );

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
            <div className="p-4 flex items-center justify-between no-print">
                <button
                    onClick={() => history.back()}
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
                </div>
            </div>

            <div className="p-4">
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 text-center">
                        <div className="flex justify-center mb-4"><FullLogo /></div>
                        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
                            FTW 11 SQN Flying Syllabus - {semesterName}
                        </h2>
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
                                            No flying syllabus found for this semester
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
