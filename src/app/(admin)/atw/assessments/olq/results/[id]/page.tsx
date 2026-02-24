"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwAssessmentOlqResultService } from "@/libs/services/atwAssessmentOlqResultService";
import FullLogo from "@/components/ui/fulllogo";
import type { AtwAssessmentOlqResult } from "@/libs/types/atwAssessmentOlq";

export default function OlqResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [result, setResult] = useState<AtwAssessmentOlqResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handlePrint = () => {
    window.print();
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

  // Get estimated marks from olq type
  const estimatedMarks = result.olq_type?.estimated_marks || [];

  // Calculate totals - same logic as CTW OlqResultForm
  const calculateTotal = (cadetMarks: { achieved_mark: number | string; atw_assessment_olq_type_estimated_mark_id: number }[]) => {
    // Calculate: sum of (estimated_mark * achieved_mark)
    let total = 0;
    estimatedMarks.forEach(em => {
      const mark = cadetMarks.find(m => m.atw_assessment_olq_type_estimated_mark_id === em.id);
      const achievedMark = mark ? parseFloat(String(mark.achieved_mark || 0)) : 0;
      const estimatedMark = parseFloat(String(em.estimated_mark || 0));
      total += estimatedMark * achievedMark;
    });

    // If type_code is "for_116b", multiply by 1.5
    if (result.olq_type?.type_code?.toLowerCase() === "for_116b") {
      total = total * 1.5;
    }

    return total;
  };

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
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
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => router.push(`/atw/assessments/olq/results/${result.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Result
          </button>
        </div>
      </div>

      {/* Content */}
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
            OLQ Assessment Result - {result.olq_type?.type_name}
          </p>
        </div>

        {/* Result Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Result Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Course</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.course?.name || "—"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Semester</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.semester?.name || "—"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Program</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.program?.name || "—"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Branch</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.branch?.name || "—"}</span>
            </div>
            {result.group && (
              <div className="flex">
                <span className="w-48 text-gray-900 font-medium">Group</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1">{result.group.name}</span>
              </div>
            )}
            {result.exam_type && (
              <div className="flex">
                <span className="w-48 text-gray-900 font-medium">Exam Type</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1">{result.exam_type.name}</span>
              </div>
            )}
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">OLQ Type</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.olq_type?.type_name} ({result.olq_type?.type_code})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.is_active ? "Active" : "Inactive"}</span>
            </div>
            {result.remarks && (
              <div className="flex col-span-2">
                <span className="w-48 text-gray-900 font-medium">Remarks</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1">{result.remarks}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cadets & Marks Table */}
        {result.result_cadets && result.result_cadets.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
              Cadets & Marks
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>SL.</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>BD/NO</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={2}>NAME</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={2}>RANK</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={2}>BRANCH</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>PRESENT</th>
                    <th className="border border-black px-3 py-2 text-center font-bold" colSpan={estimatedMarks.length + 2}>MARKS</th>
                    
                  </tr>
                  <tr>
                    {estimatedMarks.map(mark => (
                      <th
                        key={mark.id}
                        className="border border-black px-2 py-2 text-center"
                        style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', minWidth: '50px', height: '200px' }}
                      >
                        <span className="font-semibold text-xs uppercase">{mark.event_name}</span>
                      </th>
                    ))}
                    <th className="border border-black px-3 py-2 text-center font-bold">TOTAL</th>
                    <th className="border border-black px-3 py-2 text-center font-bold">PERCENTAGE</th>
                  </tr>
                  <tr>
                    <th className="border border-black px-3 py-2 text-center text-xs" colSpan={6}>Allotted Score</th>
                    {estimatedMarks.map(mark => (
                      <th key={`est-${mark.id}`} className="border border-black px-2 py-1 text-center text-xs">
                        <span className="block text-blue-600">{parseFloat(String(mark.estimated_mark)).toFixed(1)}</span>
                      </th>
                    ))}
                    <th className="border border-black px-3 py-2 text-center text-xs">300</th>
                    <th className="border border-black px-3 py-2 text-center text-xs">%</th>
                  </tr>
                </thead>
                <tbody>
                  {result.result_cadets.map((cadet, index) => {
                    const cadetName = cadet.cadet?.name || "Unknown";
                    const currentRank = cadet.cadet?.assigned_ranks?.find(r => r.is_current)?.rank || cadet.cadet?.assigned_ranks?.[0]?.rank;
                    const cadetRank = currentRank?.short_name || currentRank?.name || "—";
                    const currentBranch = cadet.cadet?.assigned_branchs?.find(b => b.is_current)?.branch || cadet.cadet?.assigned_branchs?.[0]?.branch;
                    const cadetBranch = currentBranch?.name || "—";

                    return (
                      <tr key={cadet.cadet_id}>
                        <td className="border border-black px-3 py-2 text-center font-medium">{index + 1}</td>
                        <td className="border border-black px-3 py-2 text-center">{cadet.bd_no}</td>
                        <td className={`border border-black px-3 py-2 font-medium ${!cadet.is_present ? 'text-red-500' : ''}`}>
                          {cadetName}
                        </td>
                        <td className="border border-black px-3 py-2 text-center">{cadetRank}</td>
                        <td className="border border-black px-3 py-2 text-center">{cadetBranch}</td>
                        <td className="border border-black px-2 py-2 text-center">
                          {cadet.is_present ? (
                            <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-red-600 text-xs">{cadet.absent_reason || "Absent"}</span>
                          )}
                        </td>
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

        {/* System Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            System Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            {result.creator && (
              <div className="flex">
                <span className="w-48 text-gray-900 font-medium">Created By</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1">{result.creator.name}</span>
              </div>
            )}
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created At</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {result.created_at ? new Date(result.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Last Updated</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {result.updated_at ? new Date(result.updated_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer with date */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}
