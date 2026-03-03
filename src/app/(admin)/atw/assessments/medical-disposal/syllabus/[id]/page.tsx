/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwMedicalDisposalSyllabusService } from "@/libs/services/atwMedicalDisposalSyllabusService";
import type { AtwMedicalDisposalSyllabus } from "@/libs/types/atwMedicalDisposal";
import FullLogo from "@/components/ui/fulllogo";
import { useCan } from "@/context/PagePermissionsContext";

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex py-2 border-b border-gray-100 last:border-0">
      <span className="w-40 text-gray-600 font-medium shrink-0">{label}</span>
      <span className="mr-3 text-gray-400">:</span>
      <span className="text-gray-900 flex-1">{value ?? "—"}</span>
    </div>
  );
}

export default function AtwMedicalDisposalSyllabusDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params?.id as string);
  const can = useCan();

  const [syllabus, setSyllabus] = useState<AtwMedicalDisposalSyllabus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || isNaN(id)) { setError("Invalid ID"); setLoading(false); return; }
    atwMedicalDisposalSyllabusService.getOne(id)
      .then((data) => setSyllabus(data))
      .catch(() => setError("Failed to load syllabus data"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 flex justify-center py-24">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !syllabus) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 text-center py-16">
        <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
        <p className="text-red-600">{error || "Syllabus not found"}</p>
        <button onClick={() => router.push("/atw/assessments/medical-disposal/syllabus")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 shadow-sm">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">Medical Disposal Syllabus Details</h2>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/atw/assessments/medical-disposal/syllabus")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        {can("edit") && (
          <button
            onClick={() => router.push(`/atw/assessments/medical-disposal/syllabus/${syllabus.id}/edit`)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 font-medium"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {/* Basic Info */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Basic Information</h3>
        <InfoRow label="Name" value={syllabus.name} />
        <InfoRow label="Code" value={syllabus.code} />
        <InfoRow
          label="Status"
          value={
            <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full ${syllabus.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {syllabus.is_active ? "ACTIVE" : "INACTIVE"}
            </span>
          }
        />
        <InfoRow label="Created By" value={syllabus.creator?.name} />
        <InfoRow label="Created At" value={syllabus.created_at ? new Date(syllabus.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : undefined} />
      </div>

      {/* Schema Items */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          Schema Items
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
            {syllabus.schemas?.length ?? 0}
          </span>
        </h3>
        {!syllabus.schemas || syllabus.schemas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <Icon icon="hugeicons:file-not-found" className="w-10 h-10 mb-2" />
            <p className="text-sm">No schema items defined</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-12">SL.</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Code</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {syllabus.schemas.map((schema, i) => (
                  <tr key={schema.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{schema.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{schema.code || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ${schema.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {schema.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
