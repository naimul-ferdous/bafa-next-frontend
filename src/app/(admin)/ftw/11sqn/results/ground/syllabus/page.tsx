"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Ftw11sqnGroundSyllabus } from "@/libs/types/ftw11sqnFlying";
import { Icon } from "@iconify/react";
import { ftw11sqnGroundSyllabusService } from "@/libs/services/ftw11sqnGroundSyllabusService";
import FullLogo from "@/components/ui/fulllogo";

interface GroundSyllabusSummaryRow {
    semester_id: number | null;
    semester_name: string;
    total_subjects: number;
    total_tests: number;
    total_marks: number;
}

interface SemesterGroup {
    semester_id: number | null;
    semester_name: string;
    semester_details: any;
    syllabus: Ftw11sqnGroundSyllabus[];
}

export default function Ftw11sqnGroundSyllabusPage() {
    const router = useRouter();
    const [groupedData, setGroupedData] = useState<SemesterGroup[]>([]);
    const [loading, setLoading] = useState(true);

    const loadSyllabus = useCallback(async () => {
        try {
            setLoading(true);
            const data = await ftw11sqnGroundSyllabusService.getCourseGrouped();
            setGroupedData(data);
        } catch (error) {
            console.error("Failed to load grouped ground syllabus:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSyllabus();
    }, [loadSyllabus]);

    const summaryData = useMemo((): GroundSyllabusSummaryRow[] => {
        const rows: GroundSyllabusSummaryRow[] = [];

        groupedData.forEach(semesterGroup => {
            let totalTests = 0;
            let totalMarks = 0;

            semesterGroup.syllabus.forEach(s => {
                totalTests += parseFloat(String(s.no_of_test || 0));
                totalMarks += parseFloat(String(s.highest_mark || 0));
            });

            rows.push({
                semester_id: semesterGroup.semester_id,
                semester_name: semesterGroup.semester_name,
                total_subjects: semesterGroup.syllabus.length,
                total_tests: totalTests,
                total_marks: totalMarks,
            });
        });

        return rows;
    }, [groupedData]);

    const handleAddSyllabus = () => router.push("/ftw/11sqn/results/ground/syllabus/create");
    const handlePrint = () => window.print();
    const handleExport = () => console.log("Export ground summary");

    const goToDetailedSyllabus = (semesterId: number | null) => {
        router.push(`/ftw/11sqn/results/ground/syllabus/semester/${semesterId || 0}`);
    };

    const TableLoading = () => (
        <div className="w-full min-h-[20vh] flex items-center justify-center">
            <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
        </div>
    );

    return (
        <div className="bg-white rounded-lg border border-gray-200 space-y-6">
            <div className="p-4 flex items-center justify-end no-print">
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
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                    <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 11 SQN Ground Syllabus Summary</h2>
                </div>

                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="text-gray-500 text-sm italic">
                        * Click a semester to view subjects.
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleAddSyllabus} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
                            <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Syllabus
                        </button>
                        <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700">
                            <Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export
                        </button>
                    </div>
                </div>

                {loading ? (
                    <TableLoading />
                ) : (
                    <div className="bg-white rounded-lg border border-black overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="border-b border-black">
                                    <tr>
                                        <th className="px-4 py-2 text-center text-sm font-bold text-gray-900 border-r border-black">SL</th>
                                        <th className="px-4 py-2 text-center text-sm font-bold text-gray-900 border-r border-black">Semester</th>
                                        <th className="px-4 py-2 text-center text-sm font-bold text-gray-900 border-r border-black">Subjects</th>
                                        <th className="px-4 py-2 text-center text-sm font-bold text-gray-900 border-r border-black">Tests</th>
                                        <th className="px-4 py-2 text-center text-sm font-bold text-gray-900 border-r border-black">Total Marks</th>
                                        <th className="px-4 py-2 text-center text-sm font-bold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black">
                                    {summaryData.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No data found</td>
                                        </tr>
                                    ) : (
                                        summaryData.map((row, index) => (
                                            <tr 
                                                key={row.semester_id}
                                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => goToDetailedSyllabus(row.semester_id)}
                                            >
                                                <td className="px-4 py-2 text-sm text-center text-gray-700 border-r border-black font-medium">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-center text-gray-700 border-r border-black">{row.semester_name}</td>
                                                <td className="px-4 py-2 text-sm text-center text-gray-700 border-r border-black font-medium">{row.total_subjects}</td>
                                                <td className="px-4 py-2 text-sm text-center text-gray-700 border-r border-black">{row.total_tests}</td>
                                                <td className="px-4 py-2 text-sm text-center font-bold text-green-700 border-r border-black">
                                                    {row.total_marks}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            goToDetailedSyllabus(row.semester_id);
                                                        }}
                                                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                        title="View Semester Details"
                                                    >
                                                        <Icon icon="hugeicons:view" className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
