/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwSubjectService } from "@/libs/services/atwSubjectService";
import FullLogo from "@/components/ui/fulllogo";
import type { AtwSubject } from "@/libs/types/system";

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex">
      <span className="w-48 text-gray-900 font-bold shrink-0">{label}</span>
      <span className="mr-4 text-gray-900">:</span>
      <span className="text-gray-900 flex-1">{value ?? "—"}</span>
    </div>
  );
}

export default function AtwSubjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.id as string;

  const [subject, setSubject] = useState<AtwSubject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!subjectId) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await atwSubjectService.getSubject(parseInt(subjectId));
        if (data) setSubject(data);
        else setError("Subject not found");
      } catch {
        setError("Failed to load subject data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [subjectId]);

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

  const mod = subject.module;
  const marks = mod?.marksheet?.marks ?? [];
  const totalEstimate = marks.reduce((s, m) => s + Number(m.estimate_mark), 0);
  const totalPercentage = marks.reduce((s, m) => s + Number(m.percentage), 0);

  // Group marks by type for header display
  const typeGroups: { type: string; marks: typeof marks }[] = [];
  marks.forEach((m) => {
    const type = m.type || "General";
    const existing = typeGroups.find((g) => g.type === type);
    if (existing) existing.marks.push(m);
    else typeGroups.push({ type, marks: [m] });
  });

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">

      {/* Action bar */}
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

      <div className="p-8 space-y-8">

        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <p className="font-medium text-gray-700 uppercase tracking-wider">ATW Subject Details</p>
        </div>

        {/* ── Academic Context ─────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest pb-1 mb-4 border-b border-dashed border-gray-400">
            Academic Context
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
            <InfoRow label="Course" value={`${subject.course?.name ?? "—"} (${subject.course?.code ?? ""})`} />
            <InfoRow label="Semester" value={`${subject.semester?.name ?? "—"} (${subject.semester?.code ?? ""})`} />
            <InfoRow label="Program" value={`${subject.program?.name ?? "—"} (${subject.program?.code ?? ""})`} />
            <InfoRow label="Branch" value={subject.branch?.name} />
            <InfoRow
              label="Status"
              value={
                <span className={`font-bold ${subject.is_active ? "text-green-600" : "text-red-600"}`}>
                  {subject.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              }
            />
            <InfoRow
              label="Current Cycle"
              value={
                <span className={`font-bold ${subject.is_current ? "text-blue-600" : "text-gray-500"}`}>
                  {subject.is_current ? "YES" : "NO"}
                </span>
              }
            />
          </div>
        </section>

        {/* ── Subject Module ────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest pb-1 mb-4 border-b border-dashed border-gray-400">
            Subject Module
          </h2>
          {mod ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
              <InfoRow label="Subject Name" value={<span className="font-semibold">{mod.subject_name}</span>} />
              <InfoRow label="Subject Code" value={<span className="font-mono">{mod.subject_code}</span>} />
              <InfoRow label="Type" value={<span className="capitalize">{mod.subject_type}</span>} />
              <InfoRow label="Credit Hours" value={mod.subjects_credit} />
              <InfoRow label="Full Mark" value={mod.subjects_full_mark} />
              {mod.subject_period && <InfoRow label="Period" value={mod.subject_period} />}
              {mod.subject_legend && <InfoRow label="Legend" value={mod.subject_legend} />}
              <InfoRow
                label="Module Status"
                value={
                  <span className={`font-bold ${mod.is_active ? "text-green-600" : "text-red-600"}`}>
                    {mod.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                }
              />
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No module linked.</p>
          )}
        </section>

        {/* ── Marks Distribution ────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest pb-1 mb-4 border-b border-dashed border-gray-400">
            Marks Distribution
            {mod?.marksheet && (
              <span className="ml-3 text-xs text-gray-500 normal-case font-normal tracking-normal">
                Marksheet: {mod.marksheet.name} ({mod.marksheet.code})
              </span>
            )}
          </h2>

          {marks.length === 0 ? (
            <p className="text-gray-400 text-sm">No marks distribution defined.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  {/* Row 1: type group headers */}
                  {typeGroups.length > 1 && (
                    <tr>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={2}>SL.</th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Component</th>
                      {typeGroups.map((g) => (
                        <th
                          key={g.type}
                          colSpan={2}
                          className="border border-black px-3 py-2 text-center capitalize text-gray-800"
                        >
                          {g.type}
                        </th>
                      ))}
                      <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Est. Mark</th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={2}>%</th>
                    </tr>
                  )}
                  <tr>
                    {typeGroups.length === 1 && (
                      <>
                        <th className="border border-black px-3 py-2 text-center">SL.</th>
                        <th className="border border-black px-3 py-2 text-center">Component</th>
                      </>
                    )}
                    {typeGroups.length > 1 && typeGroups.flatMap((g) => [
                      <th key={`${g.type}-est`} className="border border-black px-3 py-2 text-center text-xs">Est. Mark</th>,
                      <th key={`${g.type}-pct`} className="border border-black px-3 py-2 text-center text-xs">%</th>,
                    ])}
                    {typeGroups.length === 1 && (
                      <>
                        <th className="border border-black px-3 py-2 text-center">Est. Mark</th>
                        <th className="border border-black px-3 py-2 text-center">%</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {typeGroups.length === 1
                    ? marks.map((mark, i) => (
                        <tr key={mark.id} className="hover:bg-gray-50">
                          <td className="border border-black px-3 py-2 text-center">{i + 1}</td>
                          <td className="border border-black px-3 py-2">{mark.name}</td>
                          <td className="border border-black px-3 py-2 text-center">{Number(mark.estimate_mark).toFixed(0)}</td>
                          <td className="border border-black px-3 py-2 text-center">{Number(mark.percentage).toFixed(0)}</td>
                        </tr>
                      ))
                    : typeGroups.map((g) =>
                        g.marks.map((mark, i) => (
                          <tr key={mark.id} className="hover:bg-gray-50">
                            {i === 0 && (
                              <>
                                <td className="border border-black px-3 py-2 text-center" rowSpan={g.marks.length}>
                                  {typeGroups.indexOf(g) + 1}
                                </td>
                                <td className="border border-black px-3 py-2 capitalize font-semibold" rowSpan={g.marks.length}>
                                  {g.type}
                                </td>
                              </>
                            )}
                            <td className="border border-black px-3 py-2">{mark.name}</td>
                            <td className="border border-black px-3 py-2 text-center">{Number(mark.estimate_mark).toFixed(0)}</td>
                            <td className="border border-black px-3 py-2 text-center">{Number(mark.percentage).toFixed(0)}</td>
                          </tr>
                        ))
                      )}
                  {/* Totals row */}
                  <tr className="font-bold bg-gray-50">
                    <td
                      className="border border-black px-3 py-2 text-right"
                      colSpan={typeGroups.length === 1 ? 2 : 2}
                    >
                      Total
                    </td>
                    <td className="border border-black px-3 py-2 text-center">{totalEstimate.toFixed(0)}</td>
                    <td className="border border-black px-3 py-2 text-center">{totalPercentage.toFixed(0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 uppercase tracking-widest pt-4">
          Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </div>

      </div>
    </div>
  );
}
