/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwSubjectService } from "@/libs/services/atwSubjectService";
import { atwSubjectModuleService } from "@/libs/services/atwSubjectModuleService";
import FullLogo from "@/components/ui/fulllogo";

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

  const [subject, setSubject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
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
  const marks = mod?.marksheet?.marks ?? [];
  const totalEstimate = marks.reduce((s: number, m: any) => s + Number(m.estimate_mark), 0);
  const totalPercentage = marks.reduce((s: number, m: any) => s + Number(m.percentage), 0);

  // Deriving academic context
  const semester = subject.semester || subject.groups?.[0]?.semester || mod?.semester;
  const program = subject.program || subject.groups?.[0]?.program || mod?.program;
  const course = subject.course || subject.groups?.[0]?.course;

  // Group marks by type for header display
  const typeGroups: { type: string; marks: any[] }[] = [];
  marks.forEach((m: any) => {
    const type = m.type || "General";
    const existing = typeGroups.find((g) => g.type === type);
    if (existing) existing.marks.push(m);
    else typeGroups.push({ type, marks: [m] });
  });

  const isGrouped = subject.groups && subject.groups.length > 0;

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

  let semesterTree = Object.values(groupsBySemester).map((sem: any) => ({
    ...sem,
    programs: Object.values(sem.programs).map((prog: any) => ({
      ...prog,
      grandTotalPds: prog.modules.reduce((sum: number, m: any) => sum + (Number(m.module?.subject_period) || 0), 0)
    }))
  }));

  // If not grouped (single subject/module only), synthesize a single entry for the tree
  if (semesterTree.length === 0 && (mod || subject.is_module_only)) {
    semesterTree = [{
      semester: semester,
      programs: [{
        program: program,
        modules: [{
          id: subject.id,
          module: mod,
          atw_subject_module_id: mod?.id
        }],
        grandTotalPds: Number(mod?.subject_period || subject.subject_period) || 0
      }]
    }];
  }

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

      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <p className="font-medium text-gray-700 uppercase tracking-wider underline">Academic Training Wing</p>
          <p className="font-bold text-gray-900 uppercase tracking-wider mt-2">
            {subject.name} ({subject.code})
          </p>
        </div>

        {/* ── Subject Mapping Overview ─────────────────────── */}
        <section className="">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-sm text-left">
              <thead className="uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3 border border-black text-center">SL.</th>
                  <th className="px-4 py-3 border border-black">Semester</th>
                  <th className="px-4 py-3 border border-black">Program</th>
                  <th className="px-4 py-3 border border-black">Subject Module</th>
                  <th className="px-4 py-3 border border-black text-center">Total PDS</th>
                  <th className="px-4 py-3 border border-black text-center">Grad Total PDS</th>
                  <th className="px-4 py-3 border border-black text-center">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {(() => {
                  let globalIdx = 0;
                  return semesterTree.map((sem: any, sIdx: number) => {
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
                                {prog.grandTotalPds}
                              </td>
                            )}

                            <td className="px-4 py-3 border border-black text-center align-middle">
                              {g.atw_subject_module_id ? (
                                <button 
                                  onClick={() => router.push(`/atw/subjects/modules/${g.atw_subject_module_id}`)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-all inline-flex items-center gap-1 shadow-sm font-semibold"
                                >
                                  <Icon icon="hugeicons:book-open-01" className="w-3.5 h-3.5" />
                                  View
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
        {/* Footer */}
        <div className="text-center text-xs text-gray-400 uppercase tracking-widest pt-4">
          Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>
    </div>
  );
}
