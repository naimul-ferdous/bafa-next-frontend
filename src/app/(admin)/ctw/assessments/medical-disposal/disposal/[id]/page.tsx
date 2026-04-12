/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwMedicalDisposalResultService } from "@/libs/services/ctwMedicalDisposalResultService";
import type { CtwMedicalDisposalResult } from "@/libs/types/ctwMedicalDisposal";
import type { FilePrintType } from "@/libs/types/filePrintType";
import FullLogo from "@/components/ui/fulllogo";
import PrintTypeModal from "@/components/ui/modal/PrintTypeModal";
import { useCan } from "@/context/PagePermissionsContext";

export default function ViewCtwMedicalDisposalResultPage() {
  const router = useRouter();
  const params = useParams();
  const can = useCan();
  const id = parseInt(params?.id as string);

  const [result, setResult] = useState<CtwMedicalDisposalResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);

  const handlePrintClick = () => setIsPrintModalOpen(true);
  const confirmPrint = (type: FilePrintType) => {
    setSelectedPrintType(type);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 100);
  };

  useEffect(() => {
    if (!id || isNaN(id)) { setError("Invalid ID"); setLoading(false); return; }
    ctwMedicalDisposalResultService.getOne(id)
      .then((data) => setResult(data))
      .catch(() => setError("Failed to load result"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 flex justify-center py-24">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 text-center py-16">
        <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
        <p className="text-red-600 font-medium">{error || "Result not found"}</p>
        <button
          onClick={() => router.push("/ctw/assessments/medical-disposal/disposal")}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold"
        >
          Back to Results
        </button>
      </div>
    );
  }

  // Build schema content map: schema_id → content
  const schemaContentMap: Record<number, string> = {};
  result.result_schemas?.forEach((rs) => {
    schemaContentMap[rs.ctw_medical_disposal_syllabus_schema_id] = rs.result_content || "";
  });

  const schemas = result.syllabus?.schemas || [];
  const filledCount = Object.values(schemaContentMap).filter((v) => v.trim()).length;
  const createdAt = result.created_at
    ? new Date(result.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const infoRows: [string, string][] = [
    ["Course",   result.course?.name   || "—"],
    ["Semester", result.semester?.name || "—"],
    ["Program",  result.program?.name  || "—"],
    ["Branch",   result.branch?.name   || "—"],
    ["Syllabus", result.syllabus?.name || "—"],
    ["Status",   result.is_active ? "Active" : "Inactive"],
  ];

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200 min-h-screen">
      <style jsx global>{`
        @media print {
          .cv-content {
            width: 100% !important;
            max-width: none !important;
          }
          table {
            font-size: 14px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A3 landscape;
            margin: 14mm 10mm 14mm 10mm;
            @top-left   { content: ""; }
            @top-center {
              content: "${(selectedPrintType?.name ?? '').replace(/"/g, '\\"')}";
              font-size: 8pt;
              white-space: pre;
              text-align: center;
              text-transform: uppercase;
            }
            @top-right  { content: "BAF - 127"; font-size: 8pt; text-align: right; }
            @bottom-left   { content: ""; }
            @bottom-center {
              content: "${(selectedPrintType?.name ?? '').replace(/"/g, '\\"')}" "\\A" counter(page);
              font-size: 8pt;
              white-space: pre;
              text-align: center;
              text-transform: uppercase;
            }
            @bottom-right  { content: ""; }
          }
        }
      ` }} />

      {/* Action bar */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ctw/assessments/medical-disposal/disposal")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white flex items-center gap-2 transition-all"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintClick}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white flex items-center gap-2 transition-all"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      <div className="p-4 cv-content">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-700 uppercase tracking-wider pb-2">
            ATW Medical Disposal Assessment Result
          </p>
        </div>

        <div className="py-3 mb-8 px-2">
          <div className="flex flex-wrap justify-between items-center text-sm">
            <div className="flex gap-1.5">
              <span>Rank:</span>
              <span className="font-bold text-gray-900 underline">
                {result.cadet?.rank?.short_name || result.cadet?.rank?.name || "—"}
              </span>
            </div>
            <div className="flex gap-1.5">
              <span>Name:</span>
              <span className="font-bold text-gray-900 underline">
                {result.cadet?.name || "—"}
              </span>
            </div>
            <div className="flex gap-1.5">
              <span>BD/No:</span>
              <span className="font-bold text-gray-900 underline">
                {result.cadet?.cadet_number || "—"}
              </span>
            </div>
            <div className="flex gap-1.5">
              <span>Branch:</span>
              <span className="font-bold text-gray-900 underline">{result.branch?.name || "—"}</span>
            </div>
            <div className="flex gap-1.5">
              <span>Course No:</span>
              <span className="font-bold text-gray-900 uppercase underline">{result.course?.name || "—"}</span>
            </div>
          </div>
        </div>

        {/* Schema results — column-wise, read-only */}
        {schemas.length > 0 ? (
          <div className="overflow-x-auto border border-black">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700 border-b border-r border-black uppercase tracking-wide w-12">
                    SL.
                  </th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700 border-b border-r border-black uppercase tracking-wide w-40">
                    Date
                  </th>
                  {schemas.map((schema) => (
                    <th
                      key={schema.id}
                      className="px-4 py-2 text-center font-semibold text-gray-700 border-b border-r border-black uppercase tracking-wide"
                    >
                      {schema.name}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-center font-semibold text-gray-700 border-b border-black uppercase tracking-wide w-28">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 text-center text-gray-500 font-bold border-r border-black align-middle">
                    1
                  </td>
                  <td className="px-3 py-3 align-middle border-r border-black text-center">
                    <span className="text-sm font-medium text-gray-700">{createdAt}</span>
                  </td>
                  {schemas.map((schema) => (
                    <td key={schema.id} className="px-3 py-3 align-top border-r border-black min-w-[160px]">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {schemaContentMap[schema.id] || "—"}
                      </p>
                    </td>
                  ))}
                  <td className="px-3 py-3 align-middle text-center">
                    <span className="font-black text-gray-900">{filledCount}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
            <Icon icon="hugeicons:file-not-found" className="w-10 h-10 mx-auto mb-2" />
            No schema data available.
          </div>
        )}
      </div>

      <PrintTypeModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirm={confirmPrint}
      />
    </div>
  );
}
