/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/libs/hooks/useAuth";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import { atwInstructorAssignSubjectService } from "@/libs/services/atwInstructorAssignSubjectService";
import { cadetService } from "@/libs/services/cadetService";
import type { AtwInstructorAssignSubject } from "@/libs/types/user";

export default function AtwInstructorCoursesPage() {
    const router = useRouter();
    const { user, userIsInstructor } = useAuth();

    const isInstructor = userIsInstructor;

    const [assignments, setAssignments] = useState<AtwInstructorAssignSubject[]>([]);
    const [cadetCounts, setCadetCounts] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);
    const [loadingCadets, setLoadingCadets] = useState(false);

    useEffect(() => {
        if (!user?.id || !isInstructor) {
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            try {
                const subjectData = await atwInstructorAssignSubjectService.getByInstructor(user.id);
                setAssignments(subjectData.filter(a => a.is_active));

                // Fetch cadet counts
                setLoadingCadets(true);
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
                        per_page: 1
                    });
                    counts.set(ctx, response.total);
                }));

                setCadetCounts(counts);
                setLoadingCadets(false);
            } catch (error) {
                console.error("Failed to fetch instructor course data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.id, isInstructor]);

    // Build tree: course > semester > program > subjects
    interface ProgNode {
        program_name: string;
        program_id: number;
        subjects: AtwInstructorAssignSubject[];
        totalPds: number;
        totalCredit: number;
        cadetCount: number;
        course_id: number;
        semester_id: number;
    }
    interface SemNode { semester_name: string; programs: ProgNode[]; rowSpan: number }
    interface CourseNode { course_name: string; semesters: SemNode[]; rowSpan: number }

    const courseMap: Record<string, any> = {};
    assignments.forEach((a) => {
        const cKey = String(a.course_id);
        if (!courseMap[cKey]) courseMap[cKey] = { course_name: a.course?.name || "—", semMap: {} };
        const sKey = String(a.semester_id);
        if (!courseMap[cKey].semMap[sKey]) courseMap[cKey].semMap[sKey] = { semester_name: a.semester?.name || "—", progMap: {} };
        const pKey = String(a.program_id);
        if (!courseMap[cKey].semMap[sKey].progMap[pKey]) courseMap[cKey].semMap[sKey].progMap[pKey] = {
            program_name: a.program?.name || "—",
            program_id: a.program_id,
            course_id: a.course_id,
            semester_id: a.semester_id,
            subjects: []
        };
        courseMap[cKey].semMap[sKey].progMap[pKey].subjects.push(a);
    });

    const tree: CourseNode[] = Object.values(courseMap).map((c: any) => {
        const semesters: SemNode[] = Object.values(c.semMap).map((s: any) => {
            const programs: ProgNode[] = Object.values(s.progMap).map((p: any) => {
                const ctxKey = `${p.course_id}-${p.semester_id}-${p.program_id}`;
                return {
                    program_name: p.program_name,
                    program_id: p.program_id,
                    course_id: p.course_id,
                    semester_id: p.semester_id,
                    subjects: p.subjects,
                    totalPds: p.subjects.reduce((sum: number, a: any) => sum + (Number(a.subject?.subject_period) || 0), 0),
                    totalCredit: p.subjects.reduce((sum: number, a: any) => sum + (Number(a.subject?.subjects_credit) || 0), 0),
                    cadetCount: cadetCounts.get(ctxKey) ?? 0,
                };
            });
            const rowSpan = programs.reduce((sum, p) => sum + p.subjects.length, 0);
            return { semester_name: s.semester_name, programs, rowSpan };
        });
        const rowSpan = semesters.reduce((sum, s) => sum + s.rowSpan, 0);
        return { course_name: c.course_name, semesters, rowSpan };
    });

    if (!isInstructor) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col items-center justify-center min-h-[40vh] gap-3 text-gray-500">
                <Icon icon="hugeicons:alert-circle" className="w-12 h-12 text-orange-400" />
                <p className="text-lg font-semibold">Access Restricted</p>
                <p className="text-sm">This page is only accessible to instructors.</p>
            </div>
        );
    }

    let globalIdx = 0;

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
            {/* Action bar */}
            <div className="p-4 flex items-center justify-between no-print">
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                    Back
                </button>
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:printer" className="w-4 h-4" />
                    Print
                </button>
            </div>

            <div className="p-8 cv-content">
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
                    <p className="font-medium text-gray-900 uppercase tracking-wider pb-2">
                        Course Detailment - {user?.name || "Instructor"}
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                        <Icon icon="hugeicons:book-02" className="w-12 h-12" />
                        <p className="text-sm font-medium">No subjects assigned yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-black text-sm text-left">
                            <thead className="uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 border border-black text-center">SL.</th>
                                    <th className="px-4 py-3 border border-black">Course</th>
                                    <th className="px-4 py-3 border border-black">Semester</th>
                                    <th className="px-4 py-3 border border-black">Program</th>
                                    <th className="px-4 py-3 border border-black">Subject</th>
                                    <th className="px-4 py-3 border border-black text-center">Subject PD</th>
                                    <th className="px-4 py-3 border border-black text-center">Credit Hour</th>
                                    <th className="px-4 py-3 border border-black text-center">Total PDS</th>
                                    <th className="px-4 py-3 border border-black text-center">Total Credit</th>
                                    <th className="px-4 py-3 border border-black text-center">Cadets</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {tree.map((courseNode) =>
                                    courseNode.semesters.map((semNode, sIdx) =>
                                        semNode.programs.map((progNode, pIdx) =>
                                            progNode.subjects.map((a, mIdx) => {
                                                globalIdx++;
                                                const isFirstInCourse = sIdx === 0 && pIdx === 0 && mIdx === 0;
                                                const isFirstInSem = pIdx === 0 && mIdx === 0;
                                                const isFirstInProg = mIdx === 0;

                                                return (
                                                    <tr key={a.id} className="hover:bg-blue-50/30 transition-colors">
                                                        <td className="px-4 py-3 border border-black text-center font-medium text-gray-500">{globalIdx}</td>

                                                        {isFirstInCourse && (
                                                            <td rowSpan={courseNode.rowSpan} className="px-4 py-3 border border-black text-gray-900 font-bold align-middle">
                                                                {courseNode.course_name}
                                                            </td>
                                                        )}

                                                        {isFirstInSem && (
                                                            <td rowSpan={semNode.rowSpan} className="px-4 py-3 border border-black text-gray-700 font-medium align-middle">
                                                                {semNode.semester_name}
                                                            </td>
                                                        )}

                                                        {isFirstInProg && (
                                                            <td rowSpan={progNode.subjects.length} className="px-4 py-3 border border-black text-gray-900 font-bold align-middle">
                                                                {progNode.program_name}
                                                            </td>
                                                        )}

                                                        <td
                                                            className="px-4 py-3 border border-black cursor-pointer hover:bg-blue-50"
                                                            onClick={() => router.push(`/atw/course/${a.subject_id}/cadets?course_id=${progNode.course_id}&semester_id=${progNode.semester_id}&program_id=${progNode.program_id}`)}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-gray-900">{a.subject?.subject_name || "N/A"}</span>
                                                                <span className="text-xs text-gray-500 font-mono">{a.subject?.subject_code || "N/A"}</span>
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-3 border border-black text-center font-medium">
                                                            {a.subject?.subject_period || "—"}
                                                        </td>

                                                        <td className="px-4 py-3 border border-black text-center font-medium">
                                                            {a.subject?.subjects_credit || "—"}
                                                        </td>

                                                        {isFirstInProg && (
                                                            <>
                                                                <td rowSpan={progNode.subjects.length} className="px-4 py-3 border border-black text-center font-bold text-blue-700 align-middle">
                                                                    {progNode.totalPds}
                                                                </td>
                                                                <td rowSpan={progNode.subjects.length} className="px-4 py-3 border border-black text-center font-bold text-blue-700 align-middle">
                                                                    {progNode.totalCredit}
                                                                </td>
                                                                <td rowSpan={progNode.subjects.length} className="px-4 py-3 border border-black text-center font-bold text-blue-700 align-middle">
                                                                    {loadingCadets ? (
                                                                        <Icon icon="hugeicons:fan-01" className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
                                                                    ) : progNode.cadetCount}
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                );
                                            })
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
