/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { programService } from "@/libs/services/programService";
import type { SystemProgram } from "@/libs/types/system";
import FullLogo from "@/components/ui/fulllogo";
import { useCan } from "@/context/PagePermissionsContext";
import { useAuth } from "@/libs/hooks/useAuth";

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex">
      <span className="w-48 text-gray-900 font-medium shrink-0">{label}</span>
      <span className="mr-4 text-gray-900">:</span>
      <span className="text-gray-900 flex-1">{value ?? "—"}</span>
    </div>
  );
}

export default function ProgramDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const can = useCan();
  const { userIsSystemAdmin } = useAuth();

  const [program, setProgram] = useState<SystemProgram | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await programService.getProgram(parseInt(id));
      if (data) setProgram(data);
      else router.push("/setup/programs");
    } catch (error) {
      console.error("Failed to load program:", error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { if (id) loadData(); }, [id, loadData]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 flex justify-center py-24">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!program) return null;

  const changeableSemesters = (program as any).changeable_semesters || [];

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
          {(can("edit") || userIsSystemAdmin) && (
            <button
              onClick={() => router.push(`/setup/programs/${program.id}/edit`)}
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
          <p className="font-bold text-gray-900 uppercase tracking-wider mt-2">Program Details - {program.name}</p>
        </div>

        {/* Program Information */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 pb-1 border-b border-dashed border-gray-400">
            Program Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
            <InfoRow label="Program Name" value={program.name} />
            <InfoRow label="Short Name" value={program.short_name} />
            <InfoRow label="Code" value={<span className="font-mono">{program.code}</span>} />
            <InfoRow label="Duration" value={(program as any).duration_months ? `${(program as any).duration_months} months` : undefined} />
            <InfoRow label="Description" value={(program as any).description} />
            <InfoRow
              label="Changeable Program"
              value={
                program.is_changeable
                  ? <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">YES</span>
                  : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">NO</span>
              }
            />
            <InfoRow
              label="Status"
              value={
                program.is_active
                  ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">ACTIVE</span>
                  : <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">INACTIVE</span>
              }
            />
            <InfoRow
              label="Created At"
              value={program.created_at ? new Date(program.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : undefined}
            />
          </div>
        </section>

        {/* Changeable Semesters */}
        {program.is_changeable && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 pb-1 border-b border-dashed border-gray-400">
              Changeable Semesters
            </h2>
            {changeableSemesters.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-sm text-left">
                  <thead className="uppercase font-bold bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 border border-black text-center">SL.</th>
                      <th className="px-4 py-3 border border-black">Name</th>
                      <th className="px-4 py-3 border border-black">Short Name</th>
                      <th className="px-4 py-3 border border-black">Code</th>
                      <th className="px-4 py-3 border border-black">Semester</th>
                      <th className="px-4 py-3 border border-black text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changeableSemesters.map((cs: any, idx: number) => (
                      <tr key={cs.id} className="hover:bg-blue-50/30">
                        <td className="px-4 py-3 border border-black text-center text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 border border-black font-medium text-gray-900">{cs.name}</td>
                        <td className="px-4 py-3 border border-black text-gray-700">{cs.short_name || "—"}</td>
                        <td className="px-4 py-3 border border-black font-mono text-gray-600 text-xs">{cs.code}</td>
                        <td className="px-4 py-3 border border-black text-gray-700">{cs.semester?.name || cs.semester_id}</td>
                        <td className="px-4 py-3 border border-black text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cs.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {cs.is_active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-dashed text-center">
                No changeable semesters configured.
              </p>
            )}
          </section>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 uppercase tracking-widest pt-4">
          Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>
    </div>
  );
}
