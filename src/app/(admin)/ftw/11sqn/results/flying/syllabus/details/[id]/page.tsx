"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Ftw11sqnFlyingSyllabusGroupedCourse } from "@/libs/types/ftw11sqnFlying";
import { Icon } from "@iconify/react";
import { ftw11sqnFlyingSyllabusService } from "@/libs/services/ftw11sqnFlyingSyllabusService";
import FullLogo from "@/components/ui/fulllogo";

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

export default function Ftw11sqnCourseDetailedSyllabusPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = parseInt(params.id as string);

    const [courseData, setCourseData] = useState<Ftw11sqnFlyingSyllabusGroupedCourse | null>(null);
    const [loading, setLoading] = useState(true);

    const loadCourseData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await ftw11sqnFlyingSyllabusService.getCourseGrouped({ course_id: courseId });
            const currentCourse = data.find(c => c.course_id === courseId);
            if (currentCourse) {
                setCourseData(currentCourse);
            }
        } catch (error) {
            console.error("Failed to load course detailed syllabus:", error);
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        if (courseId) {
            loadCourseData();
        }
    }, [courseId, loadCourseData]);

    const handlePrint = () => window.print();

    if (loading) {
        return (
            <div className="w-full min-h-[40vh] flex items-center justify-center">
                <Icon icon="hugeicons:fan-01" className="w-12 h-12 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!courseData) {
        return (
            <div className="bg-white p-12 text-center rounded-lg border border-dashed border-gray-300">
                <Icon icon="hugeicons:alert-circle" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Course Not Found</h3>
                <button
                    onClick={() => router.push("/ftw/11sqn/results/flying/syllabus")}
                    className="mt-4 text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                    Back to Summary
                </button>
            </div>
        );
    }

    let documentProgHours = 0;

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
            <style>{`
                @media print {
                    @page {
                        size: A3 portrait;
                        margin: 15mm 12mm;
                    }

                    html, body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .print-no-border {
                        border: none !important;
                    }

                    table {
                        border-collapse: collapse !important;
                    }

                

                    .report-block {
                        page-break-before: always;
                        break-before: page;
                    }

                    .report-block:first-child {
                        page-break-before: avoid;
                        break-before: avoid;
                    }

                    tr {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
            `}</style>
            {/* Action Bar */}
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

            <div className="p-8 cv-content">
                <div className="mb-8">
                    <div className="flex justify-center mb-4">
                        <FullLogo />
                    </div>
                    <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
                        Bangladesh Air Force Academy
                    </h1>
                    <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
                        Official Flying Training Syllabus
                    </p>
                </div>
                <div className="space-y-8">
                    {courseData.semesters.map((semesterGroup, index) => (
                        <div key={index} className="page-break-before-always space-y-8">
                            <div className="space-y-12">
                                {semesterGroup.syllabus.sort((a, b) => a.phase_sort - b.phase_sort).map((phase) => {
                                    // Flatten exercises from all types (Dual, Solo) for this phase
                                    const allExercises: any[] = [];
                                    phase.syllabus_types?.forEach(type => {
                                        type.exercises?.forEach(ex => {
                                            allExercises.push({
                                                ...ex,
                                                typeName: type.phase_type?.type_name || '',
                                                typeCode: type.phase_type?.type_code?.toLowerCase() || ''
                                            });
                                        });
                                    });
                                    
                                    // Pre-calculate total phase hours for the header
                                    const totalPhaseHours = allExercises.reduce((sum, ex) => sum + parseFloat(String(ex.take_time_hours || 0)), 0);
                                    
                                    let phaseProgHours = 0;

                                    // Sort exercises within phase
                                    allExercises.sort((a, b) => a.exercise_sort - b.exercise_sort);

                                    return (
                                        <div key={phase.id} className="space-y-4">
                                            <div className="flex flex-col justify-center items-center">
                                                <p className="text-center font-medium text-gray-900 uppercase tracking-wider underline">{phase.phase_full_name} ({phase.phase_symbol || "P"}) Phase</p>
                                                <p className="text-center font-medium text-gray-900 uppercase tracking-wider underline">Total {formatHoursToHHMM(totalPhaseHours)} Hrs</p>
                                            </div>

                                            <div className="overflow-x-auto border border-black rounded-lg">
                                                <table className="w-full border-collapse table-fixed">
                                                    <thead>
                                                        <tr className="border-b border-black">
                                                            <th className="px-1 py-3 text-center font-bold text-black border-r border-black w-[4%]">SL</th>
                                                            <th className="px-2 py-3 text-left font-bold text-black border-r border-black w-[18%]">Exercise</th>
                                                            <th className="px-1 py-3 text-center font-bold text-black border-r border-black w-[8%]">Symbol</th>
                                                            <th className="px-2 py-3 text-left font-bold text-black border-r border-black w-[28%]">Content</th>
                                                            <th className="px-1 py-3 text-center font-bold text-black border-r border-black w-[8%]">Dual</th>
                                                            <th className="px-1 py-3 text-center font-bold text-black border-r border-black w-[8%]">Solo</th>
                                                            <th className="px-1 py-3 text-center font-bold text-black border-r border-black w-[10%]">Prog Total</th>
                                                            <th className="px-2 py-3 text-left font-bold text-black w-[16%]">Remarks</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-black">
                                                        {allExercises.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={8} className="px-4 py-6 text-center text-gray-500 italic">
                                                                    No exercises defined for this syllabus phase.
                                                                </td>
                                                            </tr>
                                                        ) : (() => {
                                                            let phaseDualHours = 0;
                                                            let phaseSoloHours = 0;

                                                            const rows = allExercises.map((ex, idx) => {
                                                                const hours = parseFloat(String(ex.take_time_hours || 0));
                                                                phaseProgHours += hours;
                                                                documentProgHours += hours;

                                                                if (ex.typeCode === 'dual') phaseDualHours += hours;
                                                                if (ex.typeCode === 'solo') phaseSoloHours += hours;

                                                                return (
                                                                    <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                                                                        <td className="px-1 py-3 text-center border-r border-black break-words">
                                                                            {(idx + 1).toString().padStart(2, '0')}
                                                                        </td>
                                                                        <td className="px-2 py-3 border-r border-black break-words">
                                                                            {ex.exercise_name}
                                                                        </td>
                                                                        <td className="px-1 py-3 text-center border-r border-black break-words">
                                                                            {ex.exercise_shortname}
                                                                        </td>
                                                                        <td className="px-2 py-3 border-r border-black text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                                                                            {ex.exercise_content || "-"}
                                                                        </td>
                                                                        <td className="px-1 py-3 text-center border-r border-black break-words">
                                                                            {ex.typeCode === 'dual' ? formatHoursToHHMM(hours) : "-"}
                                                                        </td>
                                                                        <td className="px-1 py-3 text-center border-r border-black break-words">
                                                                            {ex.typeCode === 'solo' ? formatHoursToHHMM(hours) : "-"}
                                                                        </td>
                                                                        <td className="px-1 py-3 text-center border-r border-black break-words">
                                                                            {formatHoursToHHMM(documentProgHours)}
                                                                        </td>
                                                                        <td className="px-2 py-3 text-gray-600 italic break-words whitespace-pre-wrap">
                                                                            {ex.remarks || "-"}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            });
                                                            return rows;
                                                        })()}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="pt-20 text-center border-t border-gray-100">
                    <div className="grid grid-cols-3 text-center mb-16 no-print">
                        <div className="space-y-12">
                            <div className="h-0.5 w-40 bg-black mx-auto"></div>
                            <div className="font-bold text-black">Syllabus Prepared By</div>
                        </div>
                        <div className="space-y-12">
                            <div className="h-0.5 w-40 bg-black mx-auto"></div>
                            <div className="font-bold text-black">Officer Commanding</div>
                        </div>
                        <div className="space-y-12">
                            <div className="h-0.5 w-40 bg-black mx-auto"></div>
                            <div className="font-bold text-black">Chief Flying Instructor</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
