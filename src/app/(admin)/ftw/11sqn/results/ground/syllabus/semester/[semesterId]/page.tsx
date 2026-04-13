"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Ftw11sqnGroundSyllabus } from "@/libs/types/ftw11sqnFlying";
import { Icon } from "@iconify/react";
import { ftw11sqnGroundSyllabusService } from "@/libs/services/ftw11sqnGroundSyllabusService";
import FullLogo from "@/components/ui/fulllogo";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

interface SyllabusTableRow {
    id: number;
    ground_full_name: string;
    ground_shortname: string;
    ground_symbol: string;
    ground_sort: number;
    no_of_test: number;
    highest_mark: number;
    exercise_count: number;
    total_max_mark: number;
    is_active: boolean;
    syllabus: Ftw11sqnGroundSyllabus;
}

export default function Ftw11sqnDetailedGroundSyllabusPage() {
    const router = useRouter();
    const params = useParams();
    const semesterId = parseInt(params.semesterId as string);

    const [syllabusData, setSyllabusData] = useState<Ftw11sqnGroundSyllabus[]>([]);
    const [loading, setLoading] = useState(true);
    const [semesterName, setSemesterName] = useState("");
    
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusSyllabus, setStatusSyllabus] = useState<SyllabusTableRow | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const loadSyllabus = useCallback(async () => {
        try {
            setLoading(true);
            const data = await ftw11sqnGroundSyllabusService.getCourseGrouped({ 
                include_inactive: true 
            });
            
            const currentSemester = data.find((s: any) => s.semester_id === semesterId);
            if (currentSemester) {
                setSemesterName(currentSemester.semester_name);
                setSyllabusData(currentSemester.syllabus);
            }
        } catch (error) {
            console.error("Failed to load detailed ground syllabus:", error);
        } finally {
            setLoading(false);
        }
    }, [semesterId]);

    useEffect(() => {
        if (semesterId) {
            loadSyllabus();
        }
    }, [semesterId, loadSyllabus]);

    const tableData = useMemo((): SyllabusTableRow[] => {
        return syllabusData.map((syllabus) => {
            const exercises = syllabus.exercises || [];
            const totalMaxMark = exercises.reduce((sum, ex) => sum + parseFloat(String(ex.max_mark || 0)), 0);

            return {
                id: syllabus.id,
                ground_full_name: syllabus.ground_full_name,
                ground_shortname: syllabus.ground_shortname,
                ground_symbol: syllabus.ground_symbol || "",
                ground_sort: syllabus.ground_sort,
                no_of_test: syllabus.no_of_test,
                highest_mark: parseFloat(String(syllabus.highest_mark || 0)),
                exercise_count: exercises.length,
                total_max_mark: totalMaxMark,
                is_active: syllabus.is_active,
                syllabus: syllabus,
            };
        }).sort((a, b) => a.ground_sort - b.ground_sort);
    }, [syllabusData]);

    const handleEditSyllabus = (row: SyllabusTableRow) => {
        router.push(`/ftw/11sqn/results/ground/syllabus/${row.id}/edit`);
    };
    
    const handleViewSyllabus = (row: SyllabusTableRow) => {
        router.push(`/ftw/11sqn/results/ground/syllabus/${row.id}`);
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
            await ftw11sqnGroundSyllabusService.update(statusSyllabus.id, {
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

        const currentSort = currentRow.ground_sort;
        const prevSort = prevRow.ground_sort;
        const newCurrentSort = prevSort === currentSort ? currentSort : prevSort;
        const newPrevSort = prevSort === currentSort ? currentSort + 1 : currentSort;

        try {
            await Promise.all([
                ftw11sqnGroundSyllabusService.update(currentRow.id, { ground_sort: newCurrentSort }),
                ftw11sqnGroundSyllabusService.update(prevRow.id, { ground_sort: newPrevSort }),
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

        const currentSort = currentRow.ground_sort;
        const nextSort = nextRow.ground_sort;
        const newCurrentSort = nextSort === currentSort ? currentSort + 1 : nextSort;
        const newNextSort = nextSort === currentSort ? currentSort : currentSort;

        try {
            await Promise.all([
                ftw11sqnGroundSyllabusService.update(currentRow.id, { ground_sort: newCurrentSort }),
                ftw11sqnGroundSyllabusService.update(nextRow.id, { ground_sort: newNextSort }),
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
                    onClick={() => router.push("/ftw/11sqn/results/ground/syllabus")}
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
                            FTW 11 SQN Ground Syllabus - {semesterName}
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
                                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">#</th>
                                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">SL</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-black uppercase">Ground Subject</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-black uppercase">Short Name</th>
                                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black uppercase">Symbol</th>
                                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black uppercase">No of Test</th>
                                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black uppercase">Highest Mark</th>
                                    <th className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black uppercase">Status</th>
                                    <th className="px-3 py-3 text-center font-semibold text-gray-700 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center text-gray-500 italic">
                                            No subjects found for this semester
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
                                                {(index + 1).toString().padStart(2, '0')}
                                            </td>
                                            <td className="px-4 py-2 font-bold text-gray-900 border-r border-black uppercase">
                                                {row.ground_full_name}
                                            </td>
                                            <td className="px-4 py-2 text-gray-700 border-r border-black font-medium">
                                                {row.ground_shortname}
                                            </td>
                                            <td className="px-3 py-2 text-center text-gray-700 border-r border-black font-mono">
                                                {row.ground_symbol || "-"}
                                            </td>
                                            <td className="px-3 py-2 text-center text-gray-700 border-r border-black font-bold">
                                                {row.no_of_test}
                                            </td>
                                            <td className="px-3 py-2 text-center text-gray-700 border-r border-black font-bold">
                                                {row.highest_mark}
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
                title={statusSyllabus?.is_active ? "Deactivate Subject" : "Activate Subject"}
                message={`Are you sure you want to ${statusSyllabus?.is_active ? "deactivate" : "activate"} the ground subject "${statusSyllabus?.ground_full_name}"?`}
                confirmText={statusSyllabus?.is_active ? "Deactivate" : "Activate"}
                cancelText="Cancel"
                loading={statusLoading}
                variant={statusSyllabus?.is_active ? "danger" : "success"}
            />
        </div>
    );
}