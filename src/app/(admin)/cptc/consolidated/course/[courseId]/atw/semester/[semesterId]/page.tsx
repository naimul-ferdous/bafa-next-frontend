/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwResultService } from "@/libs/services/atwResultService";
import FullLogo from "@/components/ui/fulllogo";

interface ProgramGroup {
  program: { id: number; name: string };
  changeable_semester_id: number | null;
  changeable_name: string | null;
  data: any[];
}

interface ApiResponseData {
  course_details: { id: number; name: string; code?: string } | null;
  semester_details: { id: number; name: string; code?: string } | null;
  results: ProgramGroup[];
}

interface SummarizedRow {
  key: string;
  program_id: number;
  program_name: string;
  changeable_semester_id: number | null;
  changeable_name: string | null;
  subjects: string[];
  total_cadets: number;
  subject_approved: number;
  result_count: number;
}

export default function CptcAtwCourseSemesterResultsPage({ params }: { params: Promise<{ courseId: string; semesterId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const courseId = resolvedParams.courseId;
  const semesterId = resolvedParams.semesterId;

  const [data, setData] = useState<ApiResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadResults = useCallback(async () => {
    if (!courseId || !semesterId) return;
    try {
      setLoading(true);
      const responseData = await atwResultService.getProgramWiseBySemester(
        parseInt(courseId),
        parseInt(semesterId)
      );
      setData(responseData);
    } catch (error) {
      console.error("Failed to load semester results:", error);
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId]);

  useEffect(() => { loadResults(); }, [loadResults]);

  const handleBack = () => router.push(`/cptc/consolidated/course/${courseId}/atw`);

  const handleView = (programId: number, changeableSemesterId: number | null) => {
    const base = `/cptc/consolidated/course/${courseId}/atw/semester/${semesterId}/program/${programId}`;
    if (changeableSemesterId) {
      router.push(`${base}?changeable=${changeableSemesterId}`);
    } else {
      // No param needed — the program page defaults to main-only when ?changeable is absent
      router.push(base);
    }
  };

  // Build program tree: group rows by program_id so we can render main + changeable together
  const programTree = useMemo(() => {
    if (!data?.results) return [];

    const map: Record<number, { programName: string; rows: SummarizedRow[] }> = {};

    data.results.forEach(group => {
      const subjects = Array.from(new Set(group.data.map((r: any) => r.subject?.subject_name).filter(Boolean))) as string[];
      const totalCadets = group.data.reduce((max: number, r: any) => Math.max(max, r.total_cadets || 0), 0);
      const subjectApproved = group.data.filter((r: any) => r.subject_approval?.approved_by).length;

      const row: SummarizedRow = {
        key: `${group.program.id}_${group.changeable_semester_id ?? 'main'}`,
        program_id: group.program.id,
        program_name: group.program.name,
        changeable_semester_id: group.changeable_semester_id,
        changeable_name: group.changeable_name,
        subjects,
        total_cadets: totalCadets,
        subject_approved: subjectApproved,
        result_count: group.data.length,
      };

      if (!map[group.program.id]) {
        map[group.program.id] = { programName: group.program.name, rows: [] };
      }
      map[group.program.id].rows.push(row);
    });

    // Sort: non-changeable (main) first within each program group
    Object.values(map).forEach(p => {
      p.rows.sort((a, b) =>
        (a.changeable_semester_id === null ? 0 : 1) - (b.changeable_semester_id === null ? 0 : 1)
      );
    });

    return Object.values(map);
  }, [data]);

  // Flat filtered rows for rendering
  const allRows = useMemo(() => programTree.flatMap(p => p.rows), [programTree]);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows;
    const lower = searchTerm.toLowerCase();
    return allRows.filter(r =>
      r.program_name.toLowerCase().includes(lower) ||
      (r.changeable_name ?? '').toLowerCase().includes(lower) ||
      r.subjects.some(s => s.toLowerCase().includes(lower))
    );
  }, [allRows, searchTerm]);

  // Pre-compute which program IDs have changeable siblings
  const programsWithChangeableSiblings = useMemo(() => {
    const set = new Set<number>();
    allRows.forEach(r => {
      if (r.changeable_semester_id !== null) set.add(r.program_id);
    });
    return set;
  }, [allRows]);

  const getApprovalBadge = (row: SummarizedRow) => {
    if (row.result_count === 0) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-400 whitespace-nowrap">
        No Results
      </span>
    );
    if (row.subject_approved > 0 && row.subject_approved === row.result_count) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 whitespace-nowrap">
        <Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3" />
        All Forwarded ({row.subject_approved}/{row.result_count})
      </span>
    );
    if (row.subject_approved > 0) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 whitespace-nowrap">
        <Icon icon="hugeicons:share-04" className="w-3 h-3" />
        {row.subject_approved}/{row.result_count} Forwarded
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700 whitespace-nowrap">
        <Icon icon="hugeicons:clock-01" className="w-3 h-3" />
        Pending
      </span>
    );
  };

  // Build a SL index only for rows that are actually rendered (filtered)
  let globalIdx = 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Toolbar */}
      <div className="p-4 flex items-center justify-between no-print">
        <button onClick={handleBack} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to Consolidated
        </button>
        <button onClick={() => window.print()} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <Icon icon="hugeicons:printer" className="w-4 h-4" />
          Print
        </button>
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">
            ATW Results — {data?.course_details?.name || "Course"} ({data?.semester_details?.name || "Semester"})
          </h2>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6 no-print">
          <div className="relative w-80">
            <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search programs, subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="w-full min-h-[20vh] flex items-center justify-center">
            <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No results found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-sm text-left">
              <thead className="font-bold">
                <tr>
                  <th className="px-3 py-2 border border-black text-center w-10">SL.</th>
                  <th className="px-4 py-2 border border-black">Program</th>
                  <th className="px-4 py-2 border border-black">Subjects</th>
                  <th className="px-4 py-2 border border-black text-center">Cadets</th>
                  <th className="px-4 py-2 border border-black text-center">Subject Forwarded</th>
                  <th className="px-4 py-2 border border-black text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {(() => {
                  // Group filtered rows by program_id for potential rowspan grouping
                  return filteredRows.map((row) => {
                    const hasChangeableSibling = programsWithChangeableSiblings.has(row.program_id);
                    const isChangeable = row.changeable_semester_id !== null;
                    const hasResults = row.result_count > 0;
                    globalIdx++;

                    return (
                      <tr
                        key={row.key}
                        className={`transition-colors group ${hasResults ? 'hover:bg-indigo-50/20 cursor-pointer' : 'cursor-default'}`}
                        onClick={() => hasResults && handleView(row.program_id, row.changeable_semester_id)}
                      >
                        <td className="px-3 py-2 border border-black text-center font-medium text-gray-500 group-hover:text-indigo-600">
                          {globalIdx}
                        </td>
                        {/* Program cell — mirrors view/page.tsx consolidated: changeableProgram?.name ?? program?.name */}
                        <td className="px-4 py-2 border border-black">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-gray-900">
                              {row.changeable_name ?? row.program_name}
                            </span>
                            {/* For changeable rows: show parent program as sub-label */}
                            {isChangeable && (
                              <span className="text-[10px] text-slate-500">{row.program_name}</span>
                            )}
                            {/* For main rows that have changeable siblings: show "Main" sub-label */}
                            {!isChangeable && hasChangeableSibling && (
                              <span className="inline-block px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-500 text-[9px] font-semibold border border-indigo-100 w-fit">
                                Main
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 border border-black">
                          {row.subjects.length === 0 ? (
                            <span className="text-gray-400 text-xs">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {row.subjects.slice(0, 3).map((s, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-indigo-50 text-indigo-600 border-indigo-100 whitespace-nowrap">
                                  {s}
                                </span>
                              ))}
                              {row.subjects.length > 3 && (
                                <span className="px-2 py-0.5 bg-white text-gray-500 rounded-full text-[10px] font-bold border border-dashed border-gray-300" title={row.subjects.slice(3).join(', ')}>
                                  +{row.subjects.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 border border-black text-center">
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">
                            {row.total_cadets}
                          </span>
                        </td>
                        <td className="px-4 py-2 border border-black text-center">
                          {getApprovalBadge(row)}
                        </td>
                        <td className="px-4 py-2 border border-black text-center no-print" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => hasResults && handleView(row.program_id, row.changeable_semester_id)}
                            disabled={!hasResults}
                            className={`rounded-lg transition-colors p-1 ${hasResults ? 'text-indigo-600 hover:bg-indigo-50' : 'text-gray-300 cursor-not-allowed'}`}
                            title={hasResults ? 'View Results' : 'No results entered yet'}
                          >
                            <Icon icon="hugeicons:view" className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
