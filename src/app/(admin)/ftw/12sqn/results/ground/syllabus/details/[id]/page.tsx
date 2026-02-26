"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnGroundSyllabusService } from "@/libs/services/ftw12sqnGroundSyllabusService";
import FullLogo from "@/components/ui/fulllogo";

export default function Ftw12sqnCourseDetailedGroundSyllabusPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = parseInt(params.id as string);

    const [courseData, setCourseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadCourseData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await ftw12sqnGroundSyllabusService.getCourseGrouped({ course_id: courseId });
            const currentCourse = data.find(c => c.course_id === courseId);
            if (currentCourse) {
                setCourseData(currentCourse);
            }
        } catch (error) {
            console.error("Failed to load 12sqn course detailed ground syllabus:", error);
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
                    onClick={() => router.push("/ftw/12sqn/results/ground/syllabus")}
                    className="mt-4 text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                    Back to Summary
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-lg border border-gray-200 space-y-10 min-h-screen">
            {/* Action Bar */}
            <div className="flex items-center justify-between no-print border-b border-gray-100 pb-4">
                <button 
                    onClick={() => router.push("/ftw/12sqn/results/ground/syllabus")}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 flex items-center gap-2 transition-colors"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-5 h-5" />
                    Back to Summary
                </button>
                <button
                    onClick={handlePrint}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all"
                >
                    <Icon icon="hugeicons:printer" className="w-5 h-5" />
                    Print Official Syllabus
                </button>
            </div>

            {/* Document Header */}
            <div className="text-center space-y-4">
                <div className="flex justify-center"><FullLogo /></div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
                    <h2 className="text-xl font-bold text-blue-900 mt-2 uppercase">Official Ground Training Syllabus</h2>
                    <div className="inline-block mt-4 px-6 py-2 bg-gray-100 rounded-full text-gray-800 font-bold text-lg uppercase border border-gray-200">
                        Course: {courseData.course_name}
                    </div>
                </div>
            </div>

            {/* Course Content */}
            <div className="space-y-16">
                {courseData.semesters.map((semesterGroup: any) => (
                    <div key={semesterGroup.semester_id || 'no-semester'} className="page-break-before-always space-y-8">
                        {/* Semester Title */}
                        <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl border-l-8 border-blue-600 shadow-sm">
                            <Icon icon="hugeicons:calendar-03" className="w-8 h-8 text-blue-700" />
                            <h3 className="text-2xl font-black text-blue-900 uppercase">
                                {semesterGroup.semester_name}
                            </h3>
                        </div>

                        {/* Subjects in Semester */}
                        <div className="space-y-12">
                            {semesterGroup.syllabus.sort((a: any, b: any) => a.ground_sort - b.ground_sort).map((subject: any) => (
                                <div key={subject.id} className="space-y-4">
                                    {/* Subject Title */}
                                    <div className="flex flex-col justify-center items-center py-2">
                                        <p className="text-center font-bold text-gray-900 uppercase tracking-wider underline">
                                            {subject.ground_full_name} ({subject.ground_symbol || "S"}) Subject
                                        </p>
                                        <p className="text-center font-bold text-gray-900 uppercase tracking-wider underline">
                                            Total Marks: {subject.highest_mark} (Tests: {subject.no_of_test})
                                        </p>
                                    </div>

                                    {/* Exercises Table */}
                                    <div className="overflow-x-auto border-2 border-black rounded-lg shadow-sm">
                                        <table className="w-full text-[12px] border-collapse table-fixed">
                                            <thead>
                                                <tr className="bg-gray-100 border-b-2 border-black">
                                                    <th className="px-1 py-3 text-center font-bold text-black border-r-2 border-black w-[5%]">SL</th>
                                                    <th className="px-3 py-3 text-left font-bold text-black border-r-2 border-black w-[25%]">Topic / Exercise</th>
                                                    <th className="px-2 py-3 text-center font-bold text-black border-r-2 border-black w-[10%]">Symbol</th>
                                                    <th className="px-3 py-3 text-left font-bold text-black border-r-2 border-black w-[35%]">Content / Objectives</th>
                                                    <th className="px-2 py-3 text-center font-bold text-black border-r-2 border-black w-[10%]">Max Mark</th>
                                                    <th className="px-3 py-3 text-left font-bold text-black w-[15%]">Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-black">
                                                {(!subject.exercises || subject.exercises.length === 0) ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500 italic font-medium">
                                                            No exercises defined for this ground subject.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    subject.exercises.sort((a: any, b: any) => a.exercise_sort - b.exercise_sort).map((ex: any, idx: number) => (
                                                        <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-1 py-3 text-center font-bold border-r-2 border-black break-words">
                                                                {(idx + 1).toString().padStart(2, '0')}
                                                            </td>
                                                            <td className="px-3 py-3 font-bold uppercase border-r-2 border-black break-words">
                                                                {ex.exercise_name}
                                                            </td>
                                                            <td className="px-2 py-3 text-center border-r-2 border-black break-words font-mono">
                                                                {ex.exercise_shortname}
                                                            </td>
                                                            <td className="px-3 py-3 border-r-2 border-black text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                                                                {ex.exercise_content || "Theoretical and practical training as per syllabus."}
                                                            </td>
                                                            <td className="px-2 py-3 text-center border-r-2 border-black font-bold">
                                                                {ex.max_mark}
                                                            </td>
                                                            <td className="px-3 py-3 text-gray-600 italic break-words whitespace-pre-wrap">
                                                                {ex.exercise_remarks || "-"}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                            {subject.exercises && subject.exercises.length > 0 && (
                                                <tfoot>
                                                    <tr className="bg-gray-50 border-t-2 border-black">
                                                        <td colSpan={4} className="px-3 py-3 text-right font-black uppercase border-r-2 border-black">Subject Totals:</td>
                                                        <td className="px-2 py-3 text-center font-black border-r-2 border-black text-blue-900 bg-blue-50">
                                                            {subject.exercises.reduce((sum: number, ex: any) => sum + parseFloat(String(ex.max_mark || 0)), 0)}
                                                        </td>
                                                        <td className="border-r-2 border-black"></td>
                                                    </tr>
                                                </tfoot>
                                            )}
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
                        <div className="text-[10px] font-bold text-black uppercase tracking-widest">Syllabus Prepared By</div>
                    </div>
                    <div className="space-y-12">
                        <div className="h-0.5 w-40 bg-black mx-auto"></div>
                        <div className="text-[10px] font-bold text-black uppercase tracking-widest">Officer Commanding</div>
                    </div>
                    <div className="space-y-12">
                        <div className="h-0.5 w-40 bg-black mx-auto"></div>
                        <div className="text-[10px] font-bold text-black uppercase tracking-widest">Chief Instructor</div>
                    </div>
                </div>
                
                <div className="text-xs text-gray-500 uppercase font-bold tracking-[0.2em]">
                    Bangladesh Air Force Academy • Flight Training Wing • 12 SQN
                </div>
                <div className="text-[10px] text-gray-400 mt-3 font-medium">
                    RESTRICTED • OFFICIAL GROUND SYLLABUS • FOR INTERNAL USE ONLY
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { 
                        size: A4 portrait;
                        margin: 1.5cm; 
                    }
                    .no-print { display: none !important; }
                    .page-break-before-always { page-break-before: always; }
                    body { background: white !important; -webkit-print-color-adjust: exact; }
                    .bg-white { border: none !important; box-shadow: none !important; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                }
            `}</style>
        </div>
    );
}
