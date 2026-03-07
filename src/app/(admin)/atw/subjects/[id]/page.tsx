/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwSubjectService } from "@/libs/services/atwSubjectService";
import { atwSubjectModuleService } from "@/libs/services/atwSubjectModuleService";
import { cadetService } from "@/libs/services/cadetService";
import FullLogo from "@/components/ui/fulllogo";
import { useCan } from "@/context/PagePermissionsContext";
import { useAuth } from "@/libs/hooks/useAuth";

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex">
      <span className="w-48 text-gray-900 font-bold shrink-0">{label}</span>
      <span className="mr-4 text-gray-900">:</span>
      <span className="text-gray-900 flex-1">{value ?? "—"}</span>
    </div>
  );
}

const formatType = (type: string) => {
  if (!type) return "N/A";
  return type
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(classtest)/gi, "Class Test")
    .replace(/(quiztest)/gi, "Quiz Test")
    .replace(/(endsemester)/gi, "End Semester")
    .replace(/(midsemester)/gi, "Mid Semester")
    .replace(/(midterm)/gi, "Mid Term")
    .replace(/(finalexam)/gi, "Final Exam")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function AtwSubjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.id as string;
  const can = useCan();
  const { userIsInstructor, userIsAdmin, user } = useAuth();
  
  // ATW Admin sees only mapping (Subject Group Details)
  // Instructor sees everything (Full Details)
  const isAtwAdmin = !userIsInstructor && (
    userIsAdmin || 
    can('edit') || 
    user?.roles?.some(r => r.name.includes("ATW Admin") || r.slug === "atw-admin") ||
    user?.role?.name.includes("ATW Admin") ||
    user?.role?.slug === "atw-admin"
  );

  const [subject, setSubject] = useState<any | null>(null);
  const [cadetCounts, setCadetCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingCadets, setLoadingCadets] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const parsedId = parseInt(subjectId);
    if (!subjectId || isNaN(parsedId)) {
      setError("Invalid subject ID");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        // Try fetching as a Grouped Subject first
        let data: any = await atwSubjectService.getSubject(parsedId);

        if (!data) {
          // Fallback: Try fetching as a Subject Module directly
          const moduleData = await atwSubjectModuleService.getSubject(parsedId);
          if (moduleData) {
            data = {
              ...moduleData,
              id: moduleData.id,
              name: moduleData.subject_name,
              code: moduleData.subject_code,
              module: moduleData,
              is_module_only: true
            };
          }
        }

        if (data) {
          setSubject(data);
          // Fetch cadet counts for each group
          fetchCadetCounts(data);
        } else {
          setError("Subject not found");
        }
      } catch (err) {
        console.error("Failed to load subject:", err);
        setError("Failed to load subject data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [subjectId]);

  const fetchCadetCounts = async (subjectData: any) => {
    setLoadingCadets(true);
    const counts: Record<string, number> = {};
    const groups = subjectData.groups || [];

    // If no groups, but it's a module, we might still have semester/program derived
    const itemsToFetch = groups.length > 0
      ? groups
      : (subjectData.semester_id && subjectData.program_id ? [subjectData] : []);

    const fetchPromises = itemsToFetch.map(async (g: any) => {
      const semId = g.semester_id;
      const progId = g.program_id;
      if (semId && progId) {
        const key = `${semId}-${progId}`;
        try {
          const res = await cadetService.getAllCadets({
            semester_id: semId,
            program_id: progId,
            is_current: 1,
            per_page: 1
          });
          counts[key] = res.total || 0;
        } catch (err) {
          console.error(`Failed to fetch cadet count for ${key}:`, err);
          counts[key] = 0;
        }
      }
    });

    await Promise.all(fetchPromises);
    setCadetCounts(counts);
    setLoadingCadets(false);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 flex justify-center py-24">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 text-center py-16">
        <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
        <p className="text-red-600">{error || "Subject not found"}</p>
        <button
          onClick={() => router.push("/atw/subjects")}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Back to List
        </button>
      </div>
    );
  }

  // Determine which module to show for the main details
  const mod = subject.module || subject.groups?.[0]?.module || subject;
  const marksheet = mod?.marksheet;
  const marks = marksheet?.marks ?? [];

  // Grouping logic for the architecture table
  const groupsBySemester = subject.groups?.reduce((acc: any, g: any) => {
    const semId = g.semester_id || "unknown";
    if (!acc[semId]) {
      acc[semId] = {
        semester: g.semester,
        programs: {}
      };
    }
    const progId = g.program_id || "unknown";
    if (!acc[semId].programs[progId]) {
      acc[semId].programs[progId] = {
        program: g.program,
        modules: []
      };
    }
    acc[semId].programs[progId].modules.push(g);
    return acc;
  }, {}) || {};

  const semesterTree = Object.values(groupsBySemester).map((sem: any) => ({
    ...sem,
    programs: Object.values(sem.programs).map((prog: any) => ({
      ...prog,
      grandTotalPds: prog.modules.reduce((sum: number, m: any) => sum + (Number(m.module?.subject_period) || 0), 0),
      totalCadets: cadetCounts[`${sem.semester?.id}-${prog.program?.id}`] ?? 0
    }))
  }));

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
        <div className="flex items-center gap-3">
          {(can('edit') || isAtwAdmin) && (
            <button
              onClick={() => router.push(`/atw/subjects/${subject.id}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
              Edit
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8 cv-content">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <p className="font-bold text-gray-900 uppercase tracking-wider mt-2">
            {isAtwAdmin ? "Subject Grouping Details" : `Subject Details - ${mod?.subject_name || subject.name}`}
          </p>
        </div>

        {/* ── Subject Information & Marksheet Structure (Hidden for ATW Admin) ─────────────────────── */}
        {!isAtwAdmin && (
          <>
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 pb-1 border-b border-dashed border-gray-400">
                Subject Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                <InfoRow label="Subject Name" value={mod?.subject_name || subject.name} />
                <InfoRow label="Subject Code" value={mod?.subject_code || subject.code} />
                <InfoRow label="Subject Legend" value={mod?.subject_legend || "N/A"} />
                <InfoRow label="Subject Period" value={mod?.subject_period || "N/A"} />
                <InfoRow label="Full Mark" value={mod?.subjects_full_mark || "N/A"} />
                <InfoRow label="Credit Hours" value={mod?.subjects_credit || "N/A"} />
                <InfoRow 
                  label="Syllabus File" 
                  value={mod?.syllabus ? (
                    <a 
                      href={mod.syllabus} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold underline decoration-blue-200 hover:decoration-blue-500 transition-all"
                    >
                      <Icon icon="hugeicons:download-01" className="w-4 h-4" />
                      View/Download Syllabus
                    </a>
                  ) : "No file uploaded"} 
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 pb-1 border-b border-dashed border-gray-400">
                Marksheet Structure
              </h2>
              {marksheet ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-bold">Name</span>
                      <span className="text-gray-900">:</span>
                      <span className="text-gray-900 font-medium">{marksheet.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-bold">Code</span>
                      <span className="text-gray-900">:</span>
                      <span className="text-gray-900 font-mono">{marksheet.code}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black text-sm text-left">
                      <thead>
                        <tr className="bg-gray-100 uppercase font-bold">
                          <th className="px-4 py-2 border border-black text-center w-12">SL.</th>
                          <th className="px-4 py-2 border border-black">COMPONENT TITLE</th>
                          <th className="px-4 py-2 border border-black">TYPE</th>
                          <th className="px-4 py-2 border border-black text-center">MAX MARK</th>
                          <th className="px-4 py-2 border border-black text-center">WEIGHT (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marks.map((mark: any, idx: number) => (
                          <tr key={mark.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 border border-black text-center">{idx + 1}</td>
                            <td className="px-4 py-2 border border-black font-medium">{mark.name}</td>
                            <td className="px-4 py-2 border border-black">{formatType(mark.type)}</td>
                            <td className="px-4 py-2 border border-black text-center">{mark.estimate_mark}</td>
                            <td className="px-4 py-2 border border-black text-center font-bold">{mark.percentage}%</td>
                          </tr>
                        ))}
                        <tr className="font-bold">
                          <td colSpan={3} className="px-4 py-2 border border-black text-right">TOTAL:</td>
                          <td className="px-4 py-2 border border-black text-center">
                            {marks.reduce((sum: number, m: any) => sum + (parseFloat(m.estimate_mark) || 0), 0).toFixed(0)}
                          </td>
                          <td className="px-4 py-2 border border-black text-center">
                            {marks.reduce((sum: number, m: any) => sum + (parseFloat(m.percentage) || 0), 0).toFixed(0)}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-dashed text-center">
                  No marksheet linked to this subject.
                </div>
              )}
            </section>
          </>
        )}

        {/* ── Subject Group Details (Visible only for ATW Admin) ─────────────────────── */}
        {semesterTree.length > 0 && isAtwAdmin && (
          <section className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-gray-900 pb-1 border-b border-dashed border-gray-400">
              Subject Group Details
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm text-left">
                <thead className="uppercase font-bold tracking-wider bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 border border-black text-center">SL.</th>
                    <th className="px-4 py-3 border border-black">Semester</th>
                    <th className="px-4 py-3 border border-black">Program</th>
                    <th className="px-4 py-3 border border-black">Subject Module</th>
                    <th className="px-4 py-3 border border-black text-center">Total PDS</th>
                    <th className="px-4 py-3 border border-black text-center">Total Cadets</th>
                    <th className="px-4 py-3 border border-black text-center no-print">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {(() => {
                    let globalIdx = 0;
                    return semesterTree.map((sem: any) => {
                      const semRowSpan = sem.programs.reduce((acc: number, p: any) => acc + p.modules.length, 0);
                      
                      return sem.programs.map((prog: any, pIdx: number) => {
                        const progRowSpan = prog.modules.length;
                        
                        return prog.modules.map((g: any, mIdx: number) => {
                          globalIdx++;
                          const isFirstInSem = pIdx === 0 && mIdx === 0;
                          const isFirstInProg = mIdx === 0;

                          return (
                            <tr key={g.id || globalIdx} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-4 py-3 border border-black text-center font-medium text-gray-500">{globalIdx}</td>
                              
                              {isFirstInSem && (
                                <td rowSpan={semRowSpan} className="px-4 py-3 border border-black text-gray-700 font-medium align-middle">
                                  {sem.semester?.name || "—"}
                                </td>
                              )}

                              {isFirstInProg && (
                                <td rowSpan={progRowSpan} className="px-4 py-3 border border-black text-gray-900 font-bold align-middle">
                                  {prog.program?.name || "—"}
                                </td>
                              )}

                              <td className="px-4 py-3 border border-black">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-900">{g.module?.subject_name || subject.name}</span>
                                  <span className="text-xs text-gray-500 font-mono">{g.module?.subject_code || subject.code}</span>
                                </div>
                              </td>

                              <td className="px-4 py-3 border border-black text-center font-medium">
                                {g.module?.subject_period || mod?.subject_period || subject.subject_period || "—"}
                              </td>

                              {isFirstInProg && (
                                <td rowSpan={progRowSpan} className="px-4 py-3 border border-black text-center font-bold text-blue-700 align-middle">
                                  {loadingCadets ? (
                                    <Icon icon="hugeicons:fan-01" className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
                                  ) : prog.totalCadets}
                                </td>
                              )}

                              <td className="px-4 py-3 border border-black text-center align-middle no-print">
                                {g.atw_subject_module_id ? (
                                  <button 
                                    onClick={() => router.push(`/atw/subjects/modules/${g.atw_subject_module_id}`)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-all inline-flex items-center gap-1 shadow-sm font-semibold"
                                  >
                                    <Icon icon="hugeicons:book-open-01" className="w-3.5 h-3.5" />
                                    View Module
                                  </button>
                                ) : "—"}
                              </td>
                            </tr>
                          );
                        });
                      });
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Signature Blocks - Creator + Last 4 Unique Editors */}
        <div className="mt-16 flex justify-end gap-10">
          {/* Created by */}
          <div className="text-left min-w-[180px]">
            <p className="text-xs text-gray-900 uppercase tracking-wider">Created by</p>
            <div className="border-b border-gray-400">
              <p className="text-sm text-gray-900 font-bold">
                {subject.creator ? (
                  <>
                    {subject.creator.rank?.short_name && <>{subject.creator.rank.short_name} </>}
                    {subject.creator.name}
                  </>
                ) : "N/A"}
              </p>
              {subject.creator?.roles && subject.creator.roles.length > 0 && (
                <p className="text-xs text-gray-900 mt-0.5">{subject.creator.roles[0].name}</p>
              )}
            </div>
            <p className="text-xs text-gray-900">
              {subject.created_at ? new Date(subject.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric"
              }) : "N/A"}
            </p>
          </div>

          {/* Edited by - last 4 unique consecutive editors, oldest first, last one labeled "Last Edited by" */}
          {(() => {
            const logs = subject.edit_logs || subject.editLogs || subject.module?.edit_logs || subject.module?.editLogs || [];
            const uniqueEditors: any[] = [];
            // Filter unique consecutive editors
            for (const log of logs) {
              if (uniqueEditors.length >= 4) break;
              const lastEditor = uniqueEditors[uniqueEditors.length - 1];
              if (!lastEditor || lastEditor.edited_by !== log.edited_by) {
                uniqueEditors.push(log);
              }
            }
            // Display oldest first, newest last (Last Edited by)
            const ordered = [...uniqueEditors].reverse();
            return ordered.map((log: any, idx: number) => (
              <div key={log.id} className="text-left min-w-[180px]">
                <p className="text-xs text-gray-900 uppercase tracking-wider">
                  {idx === ordered.length - 1 ? "Last Edited by" : "Edited by"}
                </p>
                <div className="border-b border-gray-400">
                  <p className="text-sm text-gray-900 font-bold">
                    {log.editor ? (
                      <>
                        {log.editor.rank?.short_name && <>{log.editor.rank.short_name} </>}
                        {log.editor.name}
                      </>
                    ) : "N/A"}
                  </p>
                  {log.editor?.roles && log.editor.roles.length > 0 && (
                    <p className="text-xs text-gray-900 mt-0.5">{log.editor.roles[0].name}</p>
                  )}
                </div>
                <p className="text-xs text-gray-900">
                  {log.created_at ? new Date(log.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                  }) : "N/A"}
                </p>
              </div>
            ));
          })()}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 uppercase tracking-widest pt-4">
          Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>
    </div>
  );
}
