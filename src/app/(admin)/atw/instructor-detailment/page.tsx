/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import { atwInstructorAssignSubjectService } from "@/libs/services/atwInstructorAssignSubjectService";

interface DetailedAssignment {
    id: number;
    instructor_name: string;
    instructor_rank: string;
    instructor_service_number: string;
    subject_name: string;
    subject_legend: string;
    subject_period: number;
    is_active: boolean;
}

interface ProgramDetail {
    program_id: number;
    program_name: string;
    program_code: string;
    assignments: DetailedAssignment[];
    total_periods: number;
    total_assignments: number;
}

interface GroupedDetailment {
    course_id: number;
    semester_id: number;
    course_name: string;
    semester_name: string;
    programs: ProgramDetail[];
    total_course_assignments: number;
    total_course_periods: number;
}

export default function AtwInstructorDetailmentPage() {
    const [groupedData, setGroupedData] = useState<GroupedDetailment[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");

    const fetchGroupedData = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (searchTerm) params.search = searchTerm;

            const data = await atwInstructorAssignSubjectService.getGrouped(params);
            setGroupedData(data || []);
        } catch (error) {
            console.error("Failed to fetch instructor detailment data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroupedData();
    }, [searchTerm]);

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4"><FullLogo /></div>
                <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                <h2 className="text-md font-semibold text-gray-700 uppercase">Academic Training Wing</h2>
                <h2 className="text-md font-semibold text-gray-700 mb-2 uppercase">Instructor Detailment : Summer (Jan-Jun) 2026</h2>
            </div>
            <div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Icon icon="hugeicons:fan-01" className="w-12 h-12 animate-spin text-blue-600" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Generating Detailment Report...</span>
                    </div>
                ) : groupedData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-300 gap-4">
                        <Icon icon="hugeicons:search-list-01" className="w-20 h-20 opacity-20" />
                        <div className="text-center">
                            <p className="text-sm font-bold uppercase tracking-widest">No detailment data found</p>
                            <p className="text-[10px] font-medium mt-1">Try adjusting your filters or search term</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto report-table">
                        <div className="flex justify-end">
                            <p className="underline">{new Date().toDateString()}</p>
                        </div>
                        <table className="w-full text-sm border-collapse border border-black">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="border border-black px-2 py-3 text-center font-bold w-20" colSpan={2}>Course No</th>
                                    <th className="border border-black px-2 py-3 text-center font-bold w-10">SL</th>
                                    <th className="border border-black px-3 py-3 text-left font-bold">Subject</th>
                                    <th className="border border-black px-2 py-3 text-center font-bold w-20">Legend</th>
                                    <th className="border border-black px-3 py-3 text-center font-bold">Name of Instructor</th>
                                    <th className="border border-black px-2 py-3 text-center font-bold w-20">No of Period</th>
                                    <th className="border border-black px-2 py-3 text-center font-bold w-24">Total Period</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedData.map((courseGroup, cgIdx) => (
                                    <React.Fragment key={cgIdx}>
                                        {courseGroup.programs.map((program, pIdx) => (
                                            <React.Fragment key={pIdx}>
                                                {program.assignments.map((assignment, aIdx) => (
                                                    <tr key={assignment.id} className="border-b border-black hover:bg-gray-50/50 transition-colors">
                                                        {pIdx === 0 && aIdx === 0 ? (
                                                            <td className="border border-black px-1 py-4 align-middle font-bold bg-white text-center" rowSpan={courseGroup.total_course_assignments}>
                                                                <div className="flex items-center justify-center min-h-[10px]">
                                                                    <span className="[writing-mode:vertical-rl] rotate-180">
                                                                        {courseGroup.course_name} ({courseGroup.semester_name})
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        ) : null}
                                                        {aIdx === 0 ? (
                                                            <td className="border border-black px-1 py-4 align-middle bg-white text-center" rowSpan={program.total_assignments}>
                                                                <div className="flex items-center justify-center min-h-[10px]">
                                                                    <span className="[writing-mode:vertical-rl] rotate-180">
                                                                        {program.program_name}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        ) : null}
                                                        <td className="border border-black px-2 py-3 text-center align-middle">
                                                            {aIdx + 1}
                                                        </td>
                                                        <td className="border border-black px-3 py-3 text-gray-900 align-middle">
                                                            {assignment.subject_name}
                                                        </td>
                                                        <td className="border border-black px-2 py-3 text-center text-gray-600 align-middle font-medium">
                                                            {assignment.subject_legend}
                                                        </td>

                                                        {/* Instructor Column */}
                                                        <td className="border border-black px-3 py-3 align-middle text-center">
                                                            <span className="text-gray-900">
                                                                {assignment.instructor_rank} {assignment.instructor_name}
                                                            </span>
                                                        </td>

                                                        {/* No of Period Column */}
                                                        <td className="border border-black px-2 py-3 text-center text-gray-800 align-middle">
                                                            {assignment.subject_period}
                                                        </td>

                                                        {/* Total Period Column (RowSpan for program) */}
                                                        {aIdx === 0 ? (
                                                            <td className="border border-black px-2 py-3 text-center bg-gray-50/30 align-middle" rowSpan={program.total_assignments}>
                                                                <div className="flex flex-col items-center justify-center gap-1">
                                                                    <span className="text-base text-gray-900">{program.total_periods}</span>
                                                                </div>
                                                            </td>
                                                        ) : null}
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer for print */}
                <div className="mt-12 pt-8 border-t border-dashed border-gray-200 hidden print:flex justify-between items-end px-4">
                    <div className="text-[10px] text-gray-400 italic">
                        Report Generated on: {new Date().toLocaleString()}<br />
                        System Generated - Bangladesh Air Force Academy
                    </div>
                    <div className="flex flex-col items-center gap-12">
                        <div className="w-48 border-b border-gray-900" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Authorized Signature</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
