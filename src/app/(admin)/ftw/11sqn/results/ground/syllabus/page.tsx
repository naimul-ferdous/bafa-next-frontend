"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Ftw11sqnGroundSyllabus } from "@/libs/types/ftw11sqnFlying";
import { Icon } from "@iconify/react";
import { ftw11sqnGroundSyllabusService } from "@/libs/services/ftw11sqnGroundSyllabusService";
import FullLogo from "@/components/ui/fulllogo";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

// Table row type
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
    syllabus: Ftw11sqnGroundSyllabus;
}

export default function Ftw11sqnGroundSyllabusPage() {
    const router = useRouter();
    const [syllabusData, setSyllabusData] = useState<Ftw11sqnGroundSyllabus[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingSyllabus, setDeletingSyllabus] = useState<SyllabusTableRow | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
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
            const response = await ftw11sqnGroundSyllabusService.getAll({
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
            console.error("Failed to load ground syllabus:", error);
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
                syllabus: syllabus,
            };
        }).sort((a, b) => a.ground_sort - b.ground_sort);
    }, [syllabusData]);

    const handleAddSyllabus = () => router.push("/ftw/11sqn/results/ground/syllabus/create");
    const handleEditSyllabus = (row: SyllabusTableRow) => {
        router.push(`/ftw/11sqn/results/ground/syllabus/${row.id}/edit`);
    };
    const handleViewSyllabus = (row: SyllabusTableRow) => {
        router.push(`/ftw/11sqn/results/ground/syllabus/${row.id}`);
    };
    const handleDeleteSyllabus = (row: SyllabusTableRow) => {
        setDeletingSyllabus(row);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingSyllabus) return;
        try {
            setDeleteLoading(true);
            await ftw11sqnGroundSyllabusService.delete(deletingSyllabus.id);
            await loadSyllabus();
            setDeleteModalOpen(false);
            setDeletingSyllabus(null);
        } catch (error) {
            console.error("Failed to delete ground syllabus:", error);
            alert("Failed to delete ground syllabus");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const currentRow = tableData[index];
        const prevRow = tableData[index - 1];

        try {
            await ftw11sqnGroundSyllabusService.update(currentRow.id, { ground_sort: prevRow.ground_sort });
            await ftw11sqnGroundSyllabusService.update(prevRow.id, { ground_sort: currentRow.ground_sort });
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
            await ftw11sqnGroundSyllabusService.update(currentRow.id, { ground_sort: nextRow.ground_sort });
            await ftw11sqnGroundSyllabusService.update(nextRow.id, { ground_sort: currentRow.ground_sort });
            await loadSyllabus();
        } catch (error) {
            console.error("Failed to reorder:", error);
        }
    };

    const handleExport = () => console.log("Export ground syllabus");
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
                <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 11 SQN Ground Syllabus</h2>
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
                                <th className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">#</th>
                                <th className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">SL</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-black">GROUND SUBJECT</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-black">SHORT NAME</th>
                                <th className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">SYMBOL</th>
                                <th className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">NO OF TEST</th>
                                <th className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">HIGHEST MARK</th>
                                <th className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">EXERCISES</th>
                                <th className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">TOTAL MAX MARK</th>
                                <th className="px-3 py-3 text-center font-semibold text-gray-700">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                        No ground syllabus found
                                    </td>
                                </tr>
                            ) : (
                                tableData.map((row, index) => (
                                    <tr key={row.id} className={`hover:bg-gray-50 ${index !== tableData.length - 1 ? "border-b border-black" : ""}`}>
                                        <td className="px-2 py-2 text-center border-r border-black">
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
                                            {row.ground_full_name}
                                        </td>
                                        <td className="px-4 py-2 text-gray-700 border-r border-black">
                                            {row.ground_shortname}
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-700 border-r border-black">
                                            {row.ground_symbol || "-"}
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-700 border-r border-black">
                                            {row.no_of_test}
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-700 border-r border-black">
                                            {row.highest_mark}
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-700 border-r border-black">
                                            {row.exercise_count}
                                        </td>
                                        <td className="px-3 py-2 text-center font-semibold text-green-700 border-r border-black">
                                            {row.total_max_mark}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleViewSyllabus(row)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="View"
                                                >
                                                    <Icon icon="hugeicons:view" className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditSyllabus(row)}
                                                    className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                                                    title="Edit"
                                                >
                                                    <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSyllabus(row)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="Delete"
                                                >
                                                    <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                                                </button>
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
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Ground Syllabus"
                message={`Are you sure you want to delete "${deletingSyllabus?.ground_full_name}"? This will delete all associated exercises. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                loading={deleteLoading}
                variant="danger"
            />
        </div>
    );
}
