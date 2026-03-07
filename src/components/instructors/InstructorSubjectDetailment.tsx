"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { AtwInstructorAssignSubject } from "@/libs/types/user";
import { atwInstructorAssignSubjectService } from "@/libs/services/atwInstructorAssignSubjectService";

interface InstructorSubjectDetailmentProps {
  userId: number;
  userName?: string;
}

export default function InstructorSubjectDetailment({ userId, userName }: InstructorSubjectDetailmentProps) {
  const [assignments, setAssignments] = useState<AtwInstructorAssignSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await atwInstructorAssignSubjectService.getByInstructor(userId);
        setAssignments(data.filter(a => a.is_active));
      } catch (err) {
        console.error("Failed to load subject assignments:", err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) load();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon icon="hugeicons:book-02" className="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No subjects assigned{userName ? ` to ${userName}` : ""}.</p>
      </div>
    );
  }

  // Build tree: course > semester > program > subjects
  interface ProgNode { program: AtwInstructorAssignSubject["program"]; subjects: AtwInstructorAssignSubject[]; totalPds: number; totalCredit: number }
  interface SemNode { semester: AtwInstructorAssignSubject["semester"]; programs: ProgNode[]; rowSpan: number }
  interface CourseNode { course: AtwInstructorAssignSubject["course"]; semesters: SemNode[]; rowSpan: number }

  const courseMap: Record<string, { course: AtwInstructorAssignSubject["course"]; semMap: Record<string, { semester: AtwInstructorAssignSubject["semester"]; progMap: Record<string, { program: AtwInstructorAssignSubject["program"]; subjects: AtwInstructorAssignSubject[] }> }> }> = {};

  assignments.forEach((a) => {
    const cKey = String(a.course_id);
    if (!courseMap[cKey]) courseMap[cKey] = { course: a.course, semMap: {} };
    const sKey = String(a.semester_id);
    if (!courseMap[cKey].semMap[sKey]) courseMap[cKey].semMap[sKey] = { semester: a.semester, progMap: {} };
    const pKey = String(a.program_id);
    if (!courseMap[cKey].semMap[sKey].progMap[pKey]) courseMap[cKey].semMap[sKey].progMap[pKey] = { program: a.program, subjects: [] };
    courseMap[cKey].semMap[sKey].progMap[pKey].subjects.push(a);
  });

  const tree: CourseNode[] = Object.values(courseMap).map((c) => {
    const semesters: SemNode[] = Object.values(c.semMap).map((s) => {
      const programs: ProgNode[] = Object.values(s.progMap).map((p) => ({
        program: p.program,
        subjects: p.subjects,
        totalPds: p.subjects.reduce((sum, a) => sum + (Number(a.subject?.subject_period) || 0), 0),
        totalCredit: p.subjects.reduce((sum, a) => sum + (Number(a.subject?.subjects_credit) || 0), 0),
      }));
      const rowSpan = programs.reduce((sum, p) => sum + p.subjects.length, 0);
      return { semester: s.semester, programs, rowSpan };
    });
    const rowSpan = semesters.reduce((sum, s) => sum + s.rowSpan, 0);
    return { course: c.course, semesters, rowSpan };
  });

  let globalIdx = 0;

  return (
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
                          {courseNode.course?.name || "—"}
                        </td>
                      )}

                      {isFirstInSem && (
                        <td rowSpan={semNode.rowSpan} className="px-4 py-3 border border-black text-gray-700 font-medium align-middle">
                          {semNode.semester?.name || "—"}
                        </td>
                      )}

                      {isFirstInProg && (
                        <td rowSpan={progNode.subjects.length} className="px-4 py-3 border border-black text-gray-900 font-bold align-middle">
                          {progNode.program?.name || "—"}
                        </td>
                      )}

                      <td className="px-4 py-3 border border-black">
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
  );
}
