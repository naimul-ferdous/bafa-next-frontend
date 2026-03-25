"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwSubjectModuleService } from "@/libs/services/atwSubjectModuleService";
import FullLogo from "@/components/ui/fulllogo";
import type { AtwSubjectModule } from "@/libs/types/system";

const formatType = (type: string) => {
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

export default function SubjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.id as string;

  const [subject, setSubject] = useState<AtwSubjectModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSubject = async () => {
      try {
        setLoading(true);
        const data = await atwSubjectModuleService.getSubject(parseInt(subjectId));
        if (data) {
          setSubject(data);
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

    if (subjectId) {
      loadSubject();
    }
  }, [subjectId]);

  const handlePrint = () => {
    window.print();
  };

  const previewSamples = useMemo(() => {
    const marks = subject?.marksheet?.marks || [];
    if (marks.length === 0) return [];
    const sampleById: { [id: number]: number } = {};
    marks.forEach(m => {
      if (!m.is_combined) sampleById[m.id] = Math.max(0, (Number(m.estimate_mark) || 0) - 1);
    });
    marks.forEach(m => {
      if (m.is_combined && m.combined_cols && m.combined_cols.length > 0) {
        const bestCount = m.combined_cols.length - 1;
        if (bestCount <= 0) { sampleById[m.id] = 0; return; }
        const refVals = m.combined_cols.map(col => {
          const refMark = marks.find(r => r.id === col.referenced_mark_id);
          return { sample: sampleById[col.referenced_mark_id] ?? 0, est: Number(refMark?.estimate_mark) || 0 };
        }).sort((a, b) => b.sample - a.sample).slice(0, bestCount);
        const sumIn = refVals.reduce((a, r) => a + r.sample, 0);
        const sumEst = refVals.reduce((a, r) => a + r.est, 0);
        sampleById[m.id] = sumEst > 0 ? (sumIn / sumEst) * Number(m.percentage) : sumIn;
      }
    });
    return marks.map(m => sampleById[m.id] ?? 0);
  }, [subject]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading subject details...</p>
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "Subject not found"}</p>
          <button
            onClick={() => router.push("/atw/subjects/modules")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to Subjects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/atw/subjects/modules")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/atw/subjects/modules/${subject.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* CV Content */}
      <div className="p-8 cv-content">
        {/* Header with Logo */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
            Subject Details - {subject.subject_name}
          </p>
        </div>

        {/* Basic Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Subject Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Subject Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.subject_name}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Subject Code</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-mono">{subject.subject_code}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Subject Legend</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.subject_legend || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Subject Period</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.subject_period || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Full Mark</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-semibold">{subject.subjects_full_mark}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Credit Hours</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-semibold">{subject.subjects_credit}</span>
            </div>
            {/* <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.is_active ? "Active" : "Inactive"}</span>
            </div> */}
          </div>
        </div>

        {/* Marksheet Structure Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Marksheet Structure
          </h2>
          {subject.marksheet ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Name</p>
                  <p className="font-bold text-gray-900">{subject.marksheet.name}</p>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Code</p>
                  <p className="font-mono text-gray-700">{subject.marksheet.code}</p>
                </div>
              </div>

              {subject.marksheet.marks && subject.marksheet.marks.length > 0 && (() => {
                const marks = subject.marksheet!.marks!;

                const refMarkIds = new Set(
                  marks.flatMap(m => m.is_combined && m.combined_cols ? m.combined_cols.map(c => c.referenced_mark_id) : [])
                );

                const visibleMarks = marks.map((m, idx) => ({ ...m, _idx: idx }));

                const previewGroups = Object.values(
                  visibleMarks.reduce((acc, m) => {
                    const key = m.type || `__none_${m._idx}`;
                    if (!acc[key]) acc[key] = { type: m.type || "", marks: [] as (typeof m & { _idx: number })[] };
                    acc[key].marks.push(m);
                    return acc;
                  }, {} as Record<string, { type: string; marks: (typeof visibleMarks[0])[] }>)
                );

                const previewTotal = previewGroups.reduce((acc, group) =>
                  acc + group.marks.reduce((gacc, m) => {
                    if (refMarkIds.has(m.id)) return gacc;
                    const sample = previewSamples[m._idx] ?? 0;
                    if (m.is_combined) return gacc + sample;
                    const est = Number(m.estimate_mark) || 0;
                    const pct = Number(m.percentage) || 0;
                    return gacc + (est !== pct && est > 0 ? (sample / est) * pct : sample);
                  }, 0), 0);

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black text-sm">
                      <thead>
                        <tr>
                          <th className="border border-black px-3 py-2 text-center" rowSpan={3}>Sl</th>
                          <th className="border border-black px-3 py-2 text-center" rowSpan={3}>BD/No</th>
                          <th className="border border-black px-3 py-2 text-center" rowSpan={3}>Rank</th>
                          <th className="border border-black px-3 py-2 text-left" rowSpan={3}>Name</th>
                          <th className="border border-black px-3 py-2 text-center" rowSpan={3}>Branch</th>
                          {previewGroups.map((group, gi) => (
                            <th
                              key={gi}
                              className="border border-black px-3 py-2 text-center font-semibold uppercase"
                              colSpan={group.marks.reduce((acc, m) => acc + (!m.is_combined && Number(m.estimate_mark) !== Number(m.percentage) ? 2 : 1), 0)}
                            >
                              {group.type || '—'}
                            </th>
                          ))}
                          <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={3}>Total</th>
                        </tr>
                        <tr>
                          {previewGroups.flatMap((group, gi) =>
                            group.marks.map((m, mi) => (
                              <th key={`${gi}-${mi}`}
                                className="border border-black px-2 py-2 text-center"
                                colSpan={!m.is_combined && Number(m.estimate_mark) !== Number(m.percentage) ? 2 : 1}
                              >
                                <div className="text-xs font-medium uppercase">{m.name || '—'}</div>
                              </th>
                            ))
                          )}
                        </tr>
                        <tr>
                          {previewGroups.flatMap((group, gi) =>
                            group.marks.map((m, mi) => {
                              const est = Number(m.estimate_mark);
                              const pct = Number(m.percentage);
                              if (!m.is_combined && est !== pct) {
                                return (
                                  <React.Fragment key={`${gi}-${mi}`}>
                                    <th className="border border-black px-1 py-1 text-center w-[80px] min-w-[80px]">{est.toFixed(0)}</th>
                                    <th className="border border-black px-1 py-1 text-center w-[80px] min-w-[80px]">{pct.toFixed(0)}</th>
                                  </React.Fragment>
                                );
                              }
                              return (
                                <th key={`${gi}-${mi}`} className="border border-black px-1 py-1 text-center min-w-[100px]">
                                  {pct.toFixed(0)}
                                </th>
                              );
                            })
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-3 py-2 text-center text-gray-400 italic text-xs">1</td>
                          <td className="border border-black px-3 py-2 text-center text-gray-400 italic text-xs">BD-001</td>
                          <td className="border border-black px-3 py-2 text-center text-gray-400 italic text-xs">Flt Cdt</td>
                          <td className="border border-black px-3 py-2 text-gray-400 italic text-xs">Example Cadet</td>
                          <td className="border border-black px-3 py-2 text-center text-gray-400 italic text-xs">GD(P)</td>
                          {previewGroups.flatMap((group, gi) =>
                            group.marks.map((m, mi) => {
                              const est = Number(m.estimate_mark) || 0;
                              const pct = Number(m.percentage) || 0;
                              const sample = previewSamples[m._idx] ?? 0;
                              if (m.is_combined) {
                                return (
                                  <td key={`${gi}-${mi}`} className="border border-black px-2 py-1 text-center text-gray-400 italic text-xs min-w-[100px]">
                                    {sample.toFixed(0)}
                                  </td>
                                );
                              }
                              const isSplit = est !== pct;
                              if (isSplit) {
                                const converted = est > 0 ? (sample / est) * pct : 0;
                                return (
                                  <React.Fragment key={`${gi}-${mi}`}>
                                    <td className="border border-black px-2 py-1 text-center text-gray-400 italic text-xs w-[80px] min-w-[80px]">{sample.toFixed(0)}</td>
                                    <td className="border border-black px-2 py-1 text-center text-gray-400 italic text-xs w-[80px] min-w-[80px]">{converted.toFixed(2)}</td>
                                  </React.Fragment>
                                );
                              }
                              return (
                                <td key={`${gi}-${mi}`} className="border border-black px-2 py-1 text-center text-gray-400 italic text-xs min-w-[100px]">
                                  {sample.toFixed(0)}
                                </td>
                              );
                            })
                          )}
                          <td className="border border-black px-3 py-2 text-center font-bold text-gray-500 text-xs">{previewTotal.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-dashed text-center">No marksheet linked to this subject module.</p>
          )}
        </div>

        {/* Signature Blocks - Creator + Last 4 Unique Editors */}
        <div className="mt-16 flex justify-end gap-10">
          {/* Created by */}
          <div className="text-left min-w-[180px]">
            <p className="text-xs text-gray-900 uppercase tracking-wider">Created by</p>
            <div className="border-b border-gray-400">
              <p className="text-sm text-gray-900">
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
            const logs = subject.edit_logs || [];
            const uniqueEditors: typeof logs = [];
            for (const log of logs) {
              if (uniqueEditors.length >= 4) break;
              const lastEditor = uniqueEditors[uniqueEditors.length - 1];
              if (!lastEditor || lastEditor.edited_by !== log.edited_by) {
                uniqueEditors.push(log);
              }
            }
            const ordered = [...uniqueEditors].reverse();
            return ordered.map((log, idx) => (
              <div key={log.id} className="text-left min-w-[180px]">
                <p className="text-xs text-gray-900 uppercase tracking-wider">
                  {idx === ordered.length - 1 ? "Last Edited by" : "Edited by"}
                </p>
                <div className="border-b border-gray-400">
                  <p className="text-sm text-gray-900">
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
      </div>
    </div>
  );
}
