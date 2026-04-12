"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Ftw12sqnFlyingSyllabus } from "@/libs/types/ftw12sqnFlying";
import { Icon } from "@iconify/react";
import { ftw12sqnFlyingSyllabusService } from "@/libs/services/ftw12sqnFlyingSyllabusService";
import FullLogo from "@/components/ui/fulllogo";

interface SyllabusSummaryRow {
    semester_id: number | null;
    semester_name: string;
    total_phases: number;
    dual_sorties: number;
    dual_hours: number;
    solo_sorties: number;
    solo_hours: number;
    total_sorties: number;
    total_hours: number;
}

interface SemesterGroup {
    semester_id: number | null;
    semester_name: string;
    semester_details: any;
    syllabus: Ftw12sqnFlyingSyllabus[];
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

export default function Ftw12sqnFlyingSyllabusPage() {
    const router = useRouter();
    const [groupedData, setGroupedData] = useState<SemesterGroup[]>([]);
    const [loading, setLoading] = useState(true);

    const loadSyllabus = useCallback(async () => {
        try {
            setLoading(true);
            const data = await ftw12sqnFlyingSyllabusService.getCourseGrouped();
            setGroupedData(data);
        } catch (error) {
            console.error("Failed to load grouped flying syllabus:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSyllabus();
    }, [loadSyllabus]);

    const summaryData = useMemo((): SyllabusSummaryRow[] => {
        return groupedData.map(semesterGroup => {
            let dualSorties = 0;
            let dualHours = 0;
            let soloSorties = 0;
            let soloHours = 0;

            (semesterGroup.syllabus || []).forEach(s => {
                const d = s.syllabus_types?.find(st => st.phase_type?.type_code?.toLowerCase() === "dual");
                const sl = s.syllabus_types?.find(st => st.phase_type?.type_code?.toLowerCase() === "solo");

                dualSorties += d?.sorties || 0;
                dualHours += parseFloat(String(d?.hours || 0));
                soloSorties += sl?.sorties || 0;
                soloHours += parseFloat(String(sl?.hours || 0));
            });

            return {
                semester_id: semesterGroup.semester_id,
                semester_name: semesterGroup.semester_name,
                total_phases: semesterGroup.syllabus.length,
                dual_sorties: dualSorties,
                dual_hours: dualHours,
                solo_sorties: soloSorties,
                solo_hours: soloHours,
                total_sorties: dualSorties + soloSorties,
                total_hours: dualHours + soloHours,
            };
        });
    }, [groupedData]);

    const handleAddSyllabus = () => router.push("/ftw/12sqn/results/flying/syllabus/create");
    const handlePrint = () => window.print();
    const handleExport = () => console.log("Export summary");

    const goToDetailedSyllabus = (semesterId: number | null) => {
        router.push(`/ftw/12sqn/results/flying/syllabus/semester/${semesterId || 0}`);
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
                    <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 12 SQN Flying Syllabus Summary</h2>
                </div>

                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="text-gray-500 text-sm italic">
                        * Use "Details" button to see full course syllabus or click a semester for specific phases.
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
                    <div className="bg-white rounded-lg border border-black overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="border-b border-black">
                                    <tr>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 uppercase border-r border-black">SL.</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 uppercase border-r border-black">Semester</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 uppercase border-r border-black">Phases</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 uppercase border-r border-black">Dual (S/H)</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 uppercase border-r border-black">Solo (S/H)</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 uppercase border-r border-black">Total (S/H)</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black">
                                    {summaryData.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No data found</td>
                                        </tr>
                                    ) : (
                                        summaryData.map((row, index) => (
                                            <tr
                                                key={row.semester_id}
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() => goToDetailedSyllabus(row.semester_id)}
                                            >
                                                <td className="px-4 py-3 text-sm text-center text-gray-700 border-r border-black">{index + 1}</td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-700 border-r border-black">{row.semester_name}</td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-700 border-r border-black">{row.total_phases}</td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-700 border-r border-black">
                                                    {row.dual_sorties} / {formatHoursToHHMM(row.dual_hours)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-700 border-r border-black">
                                                    {row.solo_sorties} / {formatHoursToHHMM(row.solo_hours)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center font-bold text-blue-700 border-r border-black">
                                                    {row.total_sorties} / {formatHoursToHHMM(row.total_hours)}
                                                </td>
                                                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => goToDetailedSyllabus(row.semester_id)}
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
