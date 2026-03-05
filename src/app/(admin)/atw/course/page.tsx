/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/libs/hooks/useAuth";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { atwInstructorAssignSubjectService } from "@/libs/services/atwInstructorAssignSubjectService";
import { cadetService } from "@/libs/services/cadetService";
import type { AtwInstructorAssignSubject } from "@/libs/types/user";

interface GroupedCourseRow {
    id: string; // Unique key: course-semester-program
    course_id: number;
    semester_id: number;
    program_id: number;
    course_name: string;
    course_code: string;
    semester_name: string;
    program_name: string;
    subjects: {
        id: number;
        name: string;
        code: string;
    }[];
    cadet_count: number;
}

export default function AtwInstructorCoursesPage() {
    const router = useRouter();
    const { user, userIsInstructor } = useAuth();

    const isInstructor = userIsInstructor;

    const [assignments, setAssignments] = useState<AtwInstructorAssignSubject[]>([]);
    const [cadetCounts, setCadetCounts] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id || !isInstructor) {
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            try {
                const subjectData = await atwInstructorAssignSubjectService.getByInstructor(user.id);
                setAssignments(subjectData);

                // Fetch cadet counts for each unique Course/Semester/Program combination
                const uniqueContexts = new Set<string>();
                subjectData.forEach(a => {
                    uniqueContexts.add(`${a.course_id}-${a.semester_id}-${a.program_id}`);
                });

                const counts = new Map<string, number>();
                await Promise.all(Array.from(uniqueContexts).map(async (ctx) => {
                    const [courseId, semesterId, programId] = ctx.split('-').map(Number);
                    const response = await cadetService.getAllCadets({
                        course_id: courseId,
                        semester_id: semesterId,
                        program_id: programId,
                        is_current: 1,
                        per_page: 1 // We only need the total
                    });
                    counts.set(ctx, response.total);
                }));
                
                setCadetCounts(counts);
            } catch (error) {
                console.error("Failed to fetch instructor course data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.id, isInstructor]);

    const groupedRows = useMemo<GroupedCourseRow[]>(() => {
        const groups = new Map<string, GroupedCourseRow>();

        assignments.forEach((a: any) => {
            const ctxKey = `${a.course_id}-${a.semester_id}-${a.program_id}`;
            
            if (!groups.has(ctxKey)) {
                groups.set(ctxKey, {
                    id: ctxKey,
                    course_id: a.course_id,
                    semester_id: a.semester_id,
                    program_id: a.program_id,
                    course_name: a.course?.name ?? "—",
                    course_code: a.course?.code ?? "",
                    semester_name: a.semester?.name ?? "—",
                    program_name: a.program?.name ?? "—",
                    subjects: [],
                    cadet_count: cadetCounts.get(ctxKey) ?? 0,
                });
            }

            const group = groups.get(ctxKey)!;
            group.subjects.push({
                id: a.subject_id,
                name: a.subject?.subject_name ?? "—",
                code: a.subject?.subject_code ?? "",
            });
        });

        return Array.from(groups.values());
    }, [assignments, cadetCounts]);

    const columns: Column<GroupedCourseRow>[] = [
        {
            key: "sl",
            header: "SL.",
            headerAlign: "center",
            className: "text-center w-12 text-gray-800",
            render: (_, index) => index + 1,
        },
        {
            key: "course",
            header: "Course",
            className: "text-gray-800 font-medium",
            render: (row) => row.course_name,
        },
        {
            key: "semester",
            header: "Semester",
            className: "text-gray-800",
            render: (row) => row.semester_name,
        },
        {
            key: "program",
            header: "Program",
            className: "text-gray-800",
            render: (row) => row.program_name,
        },
        {
            key: "cadet_count",
            header: "No of Cadets",
            headerAlign: "center",
            className: "text-center text-gray-800",
            render: (row) => (
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-bold text-xs">
                    {row.cadet_count}
                </span>
            ),
        },
        {
            key: "subjects",
            header: "Subjects",
            className: "text-gray-800 max-w-md",
            render: (row) => (
                <div className="flex flex-wrap gap-2 py-1">
                    {row.subjects.map((s, idx) => (
                        <div 
                            key={idx} 
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/atw/course/${s.id}/cadets`);
                            }}
                            className="bg-gray-50 border border-gray-200 hover:border-blue-400 hover:text-blue-600 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                        >
                            {s.name} ({s.code})
                        </div>
                    ))}
                </div>
            ),
        },
    ];

    if (!isInstructor) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col items-center justify-center min-h-[40vh] gap-3 text-gray-500">
                <Icon icon="hugeicons:alert-circle" className="w-12 h-12 text-orange-400" />
                <p className="text-lg font-semibold">Access Restricted</p>
                <p className="text-sm">This page is only accessible to instructors.</p>
            </div>
        );
    }

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">

            {/* Action bar — hidden on print */}
            <div className="p-4 flex items-center justify-between no-print">
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                    Back to List
                </button>
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:printer" className="w-4 h-4" />
                    Print
                </button>
            </div>

            <div className="p-4">
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
                    <p className="font-medium text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100 inline-block px-8">My Assigned Courses</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                ) : groupedRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                        <Icon icon="hugeicons:book-02" className="w-12 h-12" />
                        <p className="text-sm font-medium">No subjects assigned yet.</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={groupedRows}
                        keyExtractor={(row) => row.id}
                        emptyMessage="No assigned courses found"
                    />
                )}
            </div>
        </div>
    );
}
