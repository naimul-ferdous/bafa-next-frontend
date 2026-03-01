"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwAssessmentOlqResultService } from "@/libs/services/atwAssessmentOlqResultService";
import FullLogo from "@/components/ui/fulllogo";
import { getOrdinal } from "@/libs/utils/formatter";
import type { AtwAssessmentOlqResult } from "@/libs/types/atwAssessmentOlq";
import type { FilePrintType } from "@/libs/types/filePrintType";
import PrintTypeModal from "@/components/ui/modal/PrintTypeModal";

export default function OlqResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [result, setResult] = useState<AtwAssessmentOlqResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(true);
        const data = await atwAssessmentOlqResultService.getResult(parseInt(resultId));
        if (data) {
          setResult(data);
        } else {
          setError("OLQ Result not found");
        }
      } catch (err) {
        console.error("Failed to load OLQ result:", err);
        setError("Failed to load OLQ result data");
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      loadResult();
    }
  }, [resultId]);

  const handlePrintClick = () => {
    setIsPrintModalOpen(true);
  };

  const confirmPrint = (type: FilePrintType) => {
    setSelectedPrintType(type);
    setIsPrintModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "OLQ Result not found"}</p>
          <button
            onClick={() => router.push("/atw/assessments/olq/results")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to OLQ Results
          </button>
        </div>
      </div>
    );
  }

  const estimatedMarks = result.olq_type?.estimated_marks || [];
  const calculateTotal = (cadetMarks: { achieved_mark: number | string; atw_assessment_olq_type_estimated_mark_id: number }[]) => {
    let total = 0;
    estimatedMarks.forEach(em => {
      const mark = cadetMarks.find(m => m.atw_assessment_olq_type_estimated_mark_id === em.id);
      const achievedMark = mark ? parseFloat(String(mark.achieved_mark || 0)) : 0;
      const estimatedMark = parseFloat(String(em.estimated_mark || 0));
      total += estimatedMark * achievedMark;
    });
    if (result.olq_type?.type_code?.toLowerCase() === "for_116b") {
      total = total * 1.5;
    }
    return total;
  };

  // Calculate rankings based on total scores
  const rankedCadets = (result.result_cadets || [])
    .map(cadet => ({
      cadet_id: cadet.cadet_id,
      total: cadet.is_present ? calculateTotal(cadet.marks || []) : -1,
      cadet_number: cadet.cadet?.cadet_number || cadet.bd_no || "",
    }))
    .sort((a, b) => {
      // Primary sort: Total score (descending)
      if (b.total !== a.total) {
        return b.total - a.total;
      }
      // Secondary sort: Cadet number (ascending) for ties
      return a.cadet_number.localeCompare(b.cadet_number, undefined, { numeric: true });
    });

  const getPosition = (cadetId: number) => {
    const cadet = result.result_cadets?.find(c => c.cadet_id === cadetId);
    if (!cadet?.is_present) return "—";

    const index = rankedCadets.findIndex(rc => rc.cadet_id === cadetId);
    if (index === -1) return "—";

    return getOrdinal(index + 1);
  };

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      <style jsx global>{`
        @media print {
          @page {
            size: A3 landscape;
            margin: 10mm;
          }
          .cv-content {
            width: 100% !important;
            max-width: none !important;
          }
          table{
            font-size: 14px !important;
          }
          .print-div{
            max-width: 60vh !important;
            margin: 0 auto !important;
          }
        }
      `}</style>
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/atw/assessments/olq/results")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintClick}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>
      <div className="p-8 cv-content">

        <div className="w-full flex justify-between mb-6 text-xs font-bold">
          <div className="w-20">
            <p className="text-center font-medium text-gray-900 uppercase tracking-wider"></p>
          </div>
          <div>
            <p className="text-center font-medium text-gray-900 uppercase tracking-wider">{selectedPrintType?.name}</p>
          </div>
          <div>
            <p className="text-center font-medium text-gray-900 tracking-wider">BAF - {result.olq_type?.type_name}</p>
          </div>
        </div>
        <div className="mb-4">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider">Academy Training Wing</p>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider">OLQ Assessment : Offr Cdts</p>
          <p className="text-center font-medium text-gray-900 tracking-wider"><span className="uppercase">No {result.course?.name}</span> : {result.program?.name}</p>
          <p className="text-center font-medium text-gray-900 tracking-wider pb-2">({result.semester?.name})</p>
        </div>

        {/* Cadets & Marks Table */}
        {result.result_cadets && result.result_cadets.length > 0 && (
          <div className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Sl.</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>BD</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={2}>Rk</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={2}>Name</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={2}>Br</th>
                    <th className="border border-black px-3 py-2 text-center font-bold" colSpan={estimatedMarks.length + 3}>Character Trails (Marks Out of 10)</th>
                  </tr>
                  <tr>
                    {estimatedMarks.map(mark => (
                      <th
                        key={mark.id}
                        className="border border-black p-2 text-center align-middle"
                      >
                        <div className="h-32 flex items-center justify-center w-8 mx-auto">
                          <span className="font-semibold [writing-mode:vertical-rl] rotate-180">
                            {mark.event_name}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={2}>Total {result.olq_type?.type_code?.toLowerCase() === "for_116b" ? 'x 1.5' : ''}</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Position</th>
                    <th className="border border-black px-3 py-2 text-center font-bold ">Percentile</th>
                  </tr>
                  <tr>
                    <th className="border border-black px-3 py-2 text-center" colSpan={5}>Allotted Score</th>
                    {estimatedMarks.map(mark => (
                      <th key={`est-${mark.id}`} className="border border-black px-2 py-1 text-center">
                        <span className="block">{parseFloat(String(mark.estimated_mark)).toFixed(0)}</span>
                      </th>
                    ))}
                    <th className="border border-black px-3 py-2 text-center">%</th>
                  </tr>
                </thead>
                <tbody>
                  {result.result_cadets.map((cadet, index) => {
                    const cadetName = cadet.cadet?.name || "Unknown";
                    const currentRank = cadet.cadet?.assigned_ranks?.find(r => r.is_current)?.rank || cadet.cadet?.assigned_ranks?.[0]?.rank;
                    const cadetRank = currentRank?.short_name || currentRank?.name || "—";
                    const currentBranch = cadet.cadet?.assigned_branchs?.find(b => b.is_current)?.branch || cadet.cadet?.assigned_branchs?.[0]?.branch;
                    const cadetBranchCode = currentBranch?.code || "—";

                    return (
                      <tr key={cadet.cadet_id}>
                        <td className="border border-black px-3 py-2 text-center font-medium">{index + 1}</td>
                        <td className="border border-black px-3 py-2 text-center">{cadet.bd_no}</td>
                        <td className="border border-black px-3 py-2 text-center">{cadetRank}</td>
                        <td className={`border border-black px-3 py-2 font-medium ${!cadet.is_present ? 'text-red-500' : ''}`}>
                          {cadetName}
                        </td>
                        <td className="border border-black px-3 py-2 text-center">{cadetBranchCode}</td>
                        {estimatedMarks.map((em, index) => {
                          const mark = cadet.marks?.find(m => m.atw_assessment_olq_type_estimated_mark_id === em.id);
                          const achieved = mark ? parseFloat(String(mark.achieved_mark)) : 0;
                          return (
                            <td key={index} className="border border-black px-2 py-2 text-center">
                              {cadet.is_present ? achieved.toFixed(2) : "—"}
                            </td>
                          )
                        })}
                        <td className="border border-black px-2 py-2 text-center font-medium">
                          {cadet.is_present ? calculateTotal(cadet.marks || []).toFixed(2) : "—"}
                        </td>
                        <td className="border border-black px-2 py-2 text-center font-medium">
                          {getPosition(cadet.cadet_id)}
                        </td>
                        <td className="border border-black px-2 py-2 text-center font-medium">
                          {cadet.is_present ? ((calculateTotal(cadet.marks || []) / 300) * 100).toFixed(2) : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <div className="w-full flex justify-center">
            <p className="text-sm uppercase text-gray-900 font-semibold underline">Countersigned by</p>
          </div>
          <div className="min-h-48"></div>
        </div>

        {/* System Information Section */}
        <div className="w-full flex justify-center mt-6 text-xs print-div break-inside-avoid">
          <div className="w-full flex justify-between text-xs font-bold mt-2">
            <div className="w-32">

            </div>
            <div>
              <p className="text-center text-sm text-gray-900 uppercase tracking-wider">{selectedPrintType?.name}</p>
            </div>
            <div className="w-32"></div>
          </div>

        </div>

        {/* Footer with date */}
        <div className="text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <PrintTypeModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirm={confirmPrint}
      />
    </div>
  );
}
