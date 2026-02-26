"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnGroundSyllabusService } from "@/libs/services/ftw12sqnGroundSyllabusService";
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
    is_active: boolean;
    syllabus: any;
}

export default function Ftw12sqnDetailedGroundSyllabusPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = parseInt(params.courseId as string);
    const semesterId = parseInt(params.semesterId as string);

    const [syllabusData, setSyllabusData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [courseName, setCourseName] = useState("");
    const [semesterName, setSemesterName] = useState("");
    
    // Status modal state
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusSyllabus, setStatusSyllabus] = useState<SyllabusTableRow | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const loadSyllabus = useCallback(async () => {
        try {
            setLoading(true);
            const data = await ftw12sqnGroundSyllabusService.getCourseGrouped({ 
                course_id: courseId,
                include_inactive: true 
            });
            
            const currentCourse = data.find(c => c.course_id === courseId);
            if (currentCourse) {
                setCourseName(currentCourse.course_name);
                const currentSemester = currentCourse.semesters.find((s: any) => s.semester_id === semesterId);
                if (currentSemester) {
                    setSemesterName(currentSemester.semester_name);
                    setSyllabusData(currentSemester.syllabus);
                }
            }
        } catch (error) {
            console.error("Failed to load detailed 12sqn ground syllabus:", error);
        } finally {
            setLoading(false);
        }
    }, [courseId, semesterId]);

    useEffect(() => {
        if (courseId && semesterId) {
            loadSyllabus();
        }
    }, [courseId, semesterId, loadSyllabus]);

    // Transform syllabus data for table display
    const tableData = useMemo((): SyllabusTableRow[] => {
        return syllabusData.map((syllabus) => {
            const exercises = syllabus.exercises || [];
            const totalMaxMark = exercises.reduce((sum: number, ex: any) => sum + parseFloat(String(ex.max_mark || 0)), 0);

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
        router.push(`/ftw/12sqn/results/ground/syllabus/${row.id}/edit`);
    };
    
    const handleViewSyllabus = (row: SyllabusTableRow) => {
        router.push(`/ftw/12sqn/results/ground/syllabus/${row.id}`);
    };
    
    const handleToggleStatus = (row: SyllabusTableRow) => {
        setStatusSyllabus(row);
        setStatusModalOpen(true);
    };

    const confirmToggleStatus = async () => {
        if (!statusSyllabus) return;

        try {
            setStatusLoading(true);
            await ftw12sqnGroundSyllabusService.update(statusSyllabus.id, {
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
            await ftw12sqnGroundSyllabusService.update(currentRow.id, { ground_sort: prevRow.ground_sort });
            await ftw12sqnGroundSyllabusService.update(prevRow.id, { ground_sort: currentRow.ground_sort });
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
            await ftw12sqnGroundSyllabusService.update(currentRow.id, { ground_sort: nextRow.ground_sort });
            await ftw12sqnGroundSyllabusService.update(nextRow.id, { ground_sort: currentRow.ground_sort });
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
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => router.push("/ftw/12sqn/results/ground/syllabus")}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-5 h-5" />
                </button>
                <div className="flex-1 text-center">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
                    <h2 className="text-md font-bold text-blue-800 mt-2 uppercase">
                        Ground Syllabus - {courseName} ({semesterName})
                    </h2>
                </div>
            </div>

            {loading ? (
                <TableLoading />
            ) : (
                <div className="overflow-x-auto border-2 border-black rounded-lg shadow-sm">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b-2 border-black">
                                <th className="px-2 py-3 text-center font-bold text-gray-700 border-r-2 border-black w-16">#</th>
                                <th className="px-2 py-3 text-center font-bold text-gray-700 border-r-2 border-black w-16">SL</th>
                                <th className="px-4 py-3 text-left font-bold text-gray-700 border-r-2 border-black">GROUND SUBJECT</th>
                                <th className="px-4 py-3 text-left font-bold text-gray-700 border-r-2 border-black">SHORT NAME</th>
                                <th className="px-3 py-3 text-center font-bold text-gray-700 border-r-2 border-black">SYMBOL</th>
                                <th className="px-3 py-3 text-center font-bold text-gray-700 border-r-2 border-black">NO OF TEST</th>
                                <th className="px-3 py-3 text-center font-bold text-gray-700 border-r-2 border-black">HIGHEST MARK</th>
                                <th className="px-3 py-3 text-center font-bold text-gray-700 border-r-2 border-black">STATUS</th>
                                <th className="px-3 py-3 text-center font-bold text-gray-700">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black">
                            {tableData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500 italic">
                                        No subjects found for this course and semester
                                    </td>
                                </tr>
                            ) : (
                                tableData.map((row, index) => (
                                    <tr 
                                        key={row.id} 
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleViewSyllabus(row)}
                                    >
                                        <td className="px-2 py-3 text-center border-r-2 border-black" onClick={(e) => e.stopPropagation()}>
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
                                        <td className="px-2 py-3 text-center font-bold text-gray-900 border-r-2 border-black">
                                            {(index + 1).toString().padStart(2, '0')}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-gray-900 border-r-2 border-black uppercase">
                                            {row.ground_full_name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 border-r-2 border-black font-medium">
                                            {row.ground_shortname}
                                        </td>
                                        <td className="px-3 py-3 text-center text-gray-700 border-r-2 border-black font-mono">
                                            {row.ground_symbol || "-"}
                                        </td>
                                        <td className="px-3 py-3 text-center text-gray-700 border-r-2 border-black font-bold">
                                            {row.no_of_test}
                                        </td>
                                        <td className="px-3 py-3 text-center text-gray-700 border-r-2 border-black font-bold">
                                            {row.highest_mark}
                                        </td>
                                        <td className="px-3 py-3 text-center border-r-2 border-black" onClick={(e) => e.stopPropagation()}>
                                            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ${row.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                {row.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleEditSyllabus(row)}
                                                    className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors border border-transparent hover:border-yellow-200"
                                                    title="Edit"
                                                >
                                                    <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                                                </button>
                                                {row.is_active ? (
                                                    <button
                                                        onClick={() => handleToggleStatus(row)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                                        title="Deactivate"
                                                    >
                                                        <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleToggleStatus(row)}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-200"
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
