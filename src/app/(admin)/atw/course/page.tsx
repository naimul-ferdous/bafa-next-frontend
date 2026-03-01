/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/libs/hooks/useAuth";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { atwInstructorAssignSubjectService } from "@/libs/services/atwInstructorAssignSubjectService";
import { atwInstructorAssignCadetService } from "@/libs/services/atwInstructorAssignCadetService";
import type { AtwInstructorAssignSubject } from "@/libs/types/user";

interface SubjectRow {
    assignment_id: number;
    subject_id: number;
    course_name: string;
    course_code: string;
    semester_name: string;
    program_name: string;
    branch_name: string;
    subject_name: string;
    subject_code: string;
    cadet_count: number;
}

export default function AtwInstructorCoursesPage() {
    const router = useRouter();
    const { user } = useAuth();

    const isInstructor = !!user?.instructor_biodata;

    const [assignments, setAssignments] = useState<AtwInstructorAssignSubject[]>([]);
    const [cadetCounts, setCadetCounts] = useState<Map<number, number>>(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id || !isInstructor) {
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            const [subjectData, cadetData] = await Promise.all([
                atwInstructorAssignSubjectService.getByInstructor(user.id),
                atwInstructorAssignCadetService.getAll({ instructor_id: user.id, per_page: 1000 }),
            ]);

            setAssignments(subjectData);

            // Count unique cadets per subject_id
            const counts = new Map<number, Set<number>>();
            cadetData.data.forEach((c: any) => {
                if (!counts.has(c.subject_id)) counts.set(c.subject_id, new Set());
                counts.get(c.subject_id)!.add(c.cadet_id);
            });
            const finalCounts = new Map<number, number>();
            counts.forEach((set, subjectId) => finalCounts.set(subjectId, set.size));
            setCadetCounts(finalCounts);

            setLoading(false);
        };
        fetchData();
    }, [user?.id, isInstructor]);

    const subjectRows = useMemo<SubjectRow[]>(() => {
        return assignments.map((a: any) => ({
            assignment_id: a.id,
            subject_id: a.subject_id,
            course_name: a.course?.name ?? "—",
            course_code: a.course?.code ?? "",
            semester_name: a.semester?.name ?? "—",
            program_name: a.program?.name ?? "—",
            branch_name: a.branch?.name ?? "—",
            subject_name: a.subject?.module?.subject_name ?? a.subject?.subject_name ?? "—",
            subject_code: a.subject?.module?.subject_code ?? "",
            cadet_count: cadetCounts.get(a.subject_id) ?? 0,
        }));
    }, [assignments, cadetCounts]);

    const columns: Column<SubjectRow>[] = [
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
            className: "text-gray-800",
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
            key: "branch",
            header: "Branch",
            className: "text-gray-800",
            render: (row) => row.branch_name,
        },
        {
            key: "cadet_count",
            header: "No of Cadets",
            headerAlign: "center",
            className: "text-center text-gray-800",
            render: (row) => row.cadet_count,
        },
        {
            key: "subject",
            header: "Subject",
            className: "text-gray-800",
            render: (row) => (
                <div>{row.subject_name} ({row.subject_code})</div>
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
                <div className="text-center mb-4">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
                    <p className="font-medium text-gray-900 uppercase tracking-wider pb-2">My Assigned Subjects</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                ) : subjectRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                        <Icon icon="hugeicons:book-02" className="w-12 h-12" />
                        <p className="text-sm font-medium">No subjects assigned yet.</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={subjectRows}
                        keyExtractor={(row) => row.assignment_id.toString()}
                        onRowClick={(row) => router.push(`/atw/subjects/course/${row.subject_id}/cadets`)}
                        emptyMessage="No assigned subjects found"
                    />
                )}
            </div>
        </div>
    );
}
