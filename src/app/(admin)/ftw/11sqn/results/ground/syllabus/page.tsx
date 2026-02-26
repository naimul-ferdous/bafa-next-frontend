"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Ftw11sqnGroundSyllabus } from "@/libs/types/ftw11sqnFlying";
import { Icon } from "@iconify/react";
import { ftw11sqnGroundSyllabusService } from "@/libs/services/ftw11sqnGroundSyllabusService";
import FullLogo from "@/components/ui/fulllogo";
import Link from "next/link";

interface GroundSyllabusSummaryRow {
    course_id: number | null;
    course_name: string;
    semester_id: number | null;
    semester_name: string;
    total_subjects: number;
    total_tests: number;
    total_marks: number;
    isFirstInCourse: boolean;
    courseRowSpan: number;
}

interface SemesterGroup {
    semester_id: number | null;
    semester_name: string;
    semester_details: any;
    syllabus: Ftw11sqnGroundSyllabus[];
}

interface CourseGroup {
    course_id: number | null;
    course_name: string;
    course_details: any;
    semesters: SemesterGroup[];
}

export default function Ftw11sqnGroundSyllabusPage() {
    const router = useRouter();
    const [groupedData, setGroupedData] = useState<CourseGroup[]>([]);
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

        groupedData.forEach(courseGroup => {
            courseGroup.semesters.forEach((semesterGroup, semIndex) => {
                let totalTests = 0;
                let totalMarks = 0;

                semesterGroup.syllabus.forEach(s => {
                    totalTests += parseFloat(String(s.no_of_test || 0));
                    totalMarks += parseFloat(String(s.highest_mark || 0));
                });

                rows.push({
                    course_id: courseGroup.course_id,
                    course_name: courseGroup.course_name,
                    semester_id: semesterGroup.semester_id,
                    semester_name: semesterGroup.semester_name,
                    total_subjects: semesterGroup.syllabus.length,
                    total_tests: totalTests,
                    total_marks: totalMarks,
                    isFirstInCourse: semIndex === 0,
                    courseRowSpan: courseGroup.semesters.length
                });
            });
        });

        return rows;
    }, [groupedData]);

    const handleAddSyllabus = () => router.push("/ftw/11sqn/results/ground/syllabus/create");
    const handlePrint = () => window.print();
    const handleExport = () => console.log("Export ground summary");

    const goToDetailedSyllabus = (courseId: number | null, semesterId: number | null) => {
        router.push(`/ftw/11sqn/results/ground/syllabus/course/${courseId || 0}/semester/${semesterId || 0}`);
    };

    const goToFullCourseDetails = (courseId: number | null) => {
        router.push(`/ftw/11sqn/results/ground/syllabus/details/${courseId || 0}`);
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
                        * Use "Details" button to see full course ground syllabus or click a semester for specific subjects.
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
                                        <th className="px-4 py-2 text-center text-sm font-bold text-gray-900 border-r border-black">Course Name</th>
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
                                                key={`${row.course_id}-${row.semester_id}`} 
                                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => goToDetailedSyllabus(row.course_id, row.semester_id)}
                                            >
                                                {row.isFirstInCourse && (
                                                    <td 
                                                        rowSpan={row.courseRowSpan} 
                                                        className="px-4 py-2 border-r border-black align-center bg-white cursor-default"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Link href={`/ftw/11sqn/results/ground/syllabus/details/${row.course_id}`} className="flex items-center flex-col gap-2 group">
                                                            <span className="font-bold text-gray-900 group-hover:underline">{row.course_name}</span>
                                                        </Link>
                                                    </td>
                                                )}
                                                <td className="px-4 py-2 text-sm text-center text-gray-700 border-r border-black">{row.semester_name}</td>
                                                <td className="px-4 py-2 text-sm text-center text-gray-700 border-r border-black font-medium">{row.total_subjects}</td>
                                                <td className="px-4 py-2 text-sm text-center text-gray-700 border-r border-black">{row.total_tests}</td>
                                                <td className="px-4 py-2 text-sm text-center font-bold text-green-700 border-r border-black">
                                                    {row.total_marks}
                                                </td>
                                                <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => goToDetailedSyllabus(row.course_id, row.semester_id)}
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
