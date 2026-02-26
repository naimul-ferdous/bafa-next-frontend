"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw11sqnGroundSyllabusService } from "@/libs/services/ftw11sqnGroundSyllabusService";
import FullLogo from "@/components/ui/fulllogo";

export default function Ftw11sqnCourseDetailedGroundSyllabusPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = parseInt(params.id as string);

    const [courseData, setCourseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadCourseData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await ftw11sqnGroundSyllabusService.getCourseGrouped({ course_id: courseId });
            const currentCourse = data.find(c => c.course_id === courseId);
            if (currentCourse) {
                setCourseData(currentCourse);
            }
        } catch (error) {
            console.error("Failed to load course detailed ground syllabus:", error);
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
                    onClick={() => router.push("/ftw/11sqn/results/ground/syllabus")}
                    className="mt-4 text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                    Back to Summary
                </button>
            </div>
        );
    }

    let documentProgMarks = 0;

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
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
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
                {/* Header with Logo */}
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-4">
                        <FullLogo />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">
                        Bangladesh Air Force Academy
                    </h1>
                    <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
                        Official Ground Training Syllabus
                    </p>
                    <div className="inline-block mt-2 px-6 py-1 bg-gray-100 rounded-full text-gray-800 font-bold uppercase text-sm border border-gray-200">
                        Course: {courseData.course_name}
                    </div>
                </div>

                {/* Course Content */}
                <div className="space-y-8">
                    {courseData.semesters.map((semesterGroup: any, index: number) => (
                        <div key={index} className="page-break-before-always space-y-8">
                            <div className="space-y-12">
                                {semesterGroup.syllabus.sort((a: any, b: any) => a.ground_sort - b.ground_sort).map((subject: any) => (
                                    <div key={subject.id} className="space-y-4">
                                        {/* Subject Title */}
                                        <div className="flex flex-col justify-center items-center">
                                            <p className="text-center font-medium text-gray-900 uppercase tracking-wider underline">
                                                {subject.ground_full_name} ({subject.ground_symbol || "S"}) Subject
                                            </p>
                                            <p className="text-center font-medium text-gray-900 uppercase tracking-wider underline">
                                                Total Marks: {subject.highest_mark} (Tests: {subject.no_of_test})
                                            </p>
                                        </div>

                                        {/* Exercises Table */}
                                        <div className="overflow-x-auto border border-black rounded-lg">
                                            <table className="w-full border-collapse table-fixed">
                                                <thead>
                                                    <tr className="border-b border-black">
                                                        <th className="px-1 py-3 text-center font-bold text-black border-r border-black w-[4%]">SL</th>
                                                        <th className="px-2 py-3 text-left font-bold text-black border-r border-black w-[18%]">Topic / Exercise</th>
                                                        <th className="px-1 py-3 text-center font-bold text-black border-r border-black w-[8%]">Symbol</th>
                                                        <th className="px-2 py-3 text-left font-bold text-black border-r border-black w-[30%]">Content / Objectives</th>
                                                        <th className="px-1 py-3 text-center font-bold text-black border-r border-black w-[10%]">Max Mark</th>
                                                        <th className="px-1 py-3 text-center font-bold text-black border-r border-black w-[12%]">Prog Total</th>
                                                        <th className="px-2 py-3 text-left font-bold text-black w-[18%]">Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-black">
                                                    {(!subject.exercises || subject.exercises.length === 0) ? (
                                                        <tr>
                                                            <td colSpan={7} className="px-4 py-6 text-center text-gray-500 italic font-medium">
                                                                No exercises defined for this ground subject.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        subject.exercises.sort((a: any, b: any) => a.exercise_sort - b.exercise_sort).map((ex: any, idx: number) => {
                                                            const marks = parseFloat(String(ex.max_mark || 0));
                                                            documentProgMarks += marks;

                                                            return (
                                                                <tr key={ex.id} className="hover:bg-gray-50 transition-colors text-[13px]">
                                                                    <td className="px-1 py-3 text-center border-r border-black break-words">
                                                                        {(idx + 1).toString().padStart(2, '0')}
                                                                    </td>
                                                                    <td className="px-2 py-3 border-r border-black break-words font-bold">
                                                                        {ex.exercise_name}
                                                                    </td>
                                                                    <td className="px-1 py-3 text-center border-r border-black break-words font-mono">
                                                                        {ex.exercise_shortname}
                                                                    </td>
                                                                    <td className="px-2 py-3 border-r border-black text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                                                                        {ex.exercise_content || "Theoretical and practical training as per syllabus."}
                                                                    </td>
                                                                    <td className="px-1 py-3 text-center border-r border-black break-words font-bold">
                                                                        {ex.max_mark}
                                                                    </td>
                                                                    <td className="px-1 py-3 text-center border-r border-black break-words font-bold text-blue-700">
                                                                        {documentProgMarks}
                                                                    </td>
                                                                    <td className="px-2 py-3 text-gray-600 italic break-words whitespace-pre-wrap">
                                                                        {ex.exercise_remarks || "-"}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="pt-20 text-center border-t border-gray-100">
                    <div className="grid grid-cols-3 text-center mb-16 no-print">
                        <div className="space-y-12">
                            <div className="h-0.5 w-40 bg-black mx-auto"></div>
                            <div className="font-bold text-black uppercase text-xs">Syllabus Prepared By</div>
                        </div>
                        <div className="space-y-12">
                            <div className="h-0.5 w-40 bg-black mx-auto"></div>
                            <div className="font-bold text-black uppercase text-xs">Officer Commanding</div>
                        </div>
                        <div className="space-y-12">
                            <div className="h-0.5 w-40 bg-black mx-auto"></div>
                            <div className="font-bold text-black uppercase text-xs">Chief Ground Instructor</div>
                        </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-[0.2em]">
                        Bangladesh Air Force Academy • Flight Training Wing • 11 SQN
                    </div>
                    <div className="text-[10px] text-gray-400 mt-3 font-medium">
                        RESTRICTED • OFFICIAL GROUND SYLLABUS • FOR INTERNAL USE ONLY
                    </div>
                </div>
            </div>
        </div>
    );
}
