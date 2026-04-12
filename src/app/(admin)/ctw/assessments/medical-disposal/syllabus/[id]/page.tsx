/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwMedicalDisposalSyllabusService } from "@/libs/services/ctwMedicalDisposalSyllabusService";
import type { CtwMedicalDisposalSyllabus } from "@/libs/types/ctwMedicalDisposal";
import FullLogo from "@/components/ui/fulllogo";
import { useCan } from "@/context/PagePermissionsContext";

export default function CtwMedicalDisposalSyllabusDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params?.id as string);
  const can = useCan();

  const [syllabus, setSyllabus] = useState<CtwMedicalDisposalSyllabus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || isNaN(id)) { setError("Invalid ID"); setLoading(false); return; }
    ctwMedicalDisposalSyllabusService.getOne(id)
      .then((data) => setSyllabus(data))
      .catch(() => setError("Failed to load syllabus data"))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || !syllabus) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "Syllabus not found"}</p>
          <button onClick={() => router.push("/ctw/assessments/medical-disposal/syllabus")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Action Buttons */}
      <div className="p-4 flex items-center justify-between no-print">
        <button onClick={() => router.push("/ctw/assessments/medical-disposal/syllabus")} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
          {can("edit") && (
            <button onClick={() => router.push(`/ctw/assessments/medical-disposal/syllabus/${syllabus.id}/edit`)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="p-8 cv-content">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">CTW Medical Disposal Syllabus</p>
        </div>

        {/* Basic Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">Syllabus Information</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.name}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Code</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.code || "—"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className={`flex-1 font-semibold ${syllabus.is_active ? "text-green-600" : "text-red-600"}`}>
                {syllabus.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created By</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.creator?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created At</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {syllabus.created_at ? new Date(syllabus.created_at).toLocaleString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Schema Items */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Schema Items
            <span className="ml-2 text-base font-normal text-gray-500">({syllabus.schemas?.length ?? 0})</span>
          </h2>
          {!syllabus.schemas || syllabus.schemas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <Icon icon="hugeicons:file-not-found" className="w-10 h-10 mb-2" />
              <p className="text-sm">No schema items defined</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-2 text-center align-middle">SL.</th>
                    <th className="border border-black px-2 py-2 text-center align-middle">Name</th>
                    <th className="border border-black px-2 py-2 text-center align-middle">Code</th>
                    <th className="border border-black px-2 py-2 text-center align-middle">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {syllabus.schemas.map((schema, i) => (
                    <tr key={schema.id}>
                      <td className="border border-black px-2 py-2 text-center">{i + 1}</td>
                      <td className="border border-black px-2 py-2 font-medium">{schema.name}</td>
                      <td className="border border-black px-2 py-2 text-center font-mono">{schema.code || "—"}</td>
                      <td className="border border-black px-2 py-2 text-center">
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

        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}
