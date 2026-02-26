/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwAssessmentCounselingResultService } from "@/libs/services/ctwAssessmentCounselingResultService";
import FullLogo from "@/components/ui/fulllogo";
import type { CtwAssessmentCounselingResult } from "@/libs/types/system";

export default function ResultDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const resultId = parseInt(resolvedParams.id);

  const [result, setResult] = useState<CtwAssessmentCounselingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(true);
        const data = await ctwAssessmentCounselingResultService.getResult(resultId);
        if (data) {
          setResult(data);
        } else {
          setError("Result not found");
        }
      } catch (err) {
        console.error("Failed to load counseling result:", err);
        setError("Failed to load result data");
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
          <p className="text-red-600 font-medium">{error || "Result not found"}</p>
          <button
            onClick={() => router.push("/ctw/assessments/counselings/results")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const availableEvents = result.counseling_type?.events || [];
  
  // CTW results are single cadet, so we wrap it in an array to match the ATW layout logic
  const result_cadets = [
    {
      bd_no: (result.cadet as any)?.cadet_number || (result.cadet as any)?.service_number || (result.cadet as any)?.bd_no || "—",
      cadet: result.cadet,
      remarks: result.remarks,
      is_present: true, 
      absent_reason: ""
    }
  ];

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200 min-h-screen">
      <style>{`
        @media print {
          @page {
            size: A3 portrait;
            margin: 15mm 12mm;
          }

          html, body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          .print-no-border {
            border: none !important;
          }

          table {
            border-collapse: collapse !important;
          }

          table, th, td {
            border: 1px solid #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .report-block {
            page-break-before: always;
            break-before: page;
          }

          .report-block:first-child {
            page-break-before: avoid;
            break-before: avoid;
          }

          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ctw/assessments/counselings/results")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white flex items-center gap-2 transition-all"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white flex items-center gap-2 transition-all"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>
      <div className="p-4 cv-content">
        <div className="w-full flex justify-between mb-6 text-xs font-bold">
          <div className="w-18">
            <p className="text-center font-medium text-gray-900 uppercase tracking-wider"></p>
          </div>
          <div>
            <p className="text-center font-medium text-gray-900 uppercase tracking-wider">Restricted</p>
          </div>
          <div>
            <p className="text-center font-medium text-gray-900 tracking-wider">BAF - 102</p>
          </div>
        </div>
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-center text-xl font-semibold text-gray-900 uppercase underline">
            INTERVIEW/COUNSELLING Record
          </h1>
          <h1 className="text-center text-xl font-semibold text-gray-900 uppercase underline">
            BAF Academy
          </h1>
        </div>

        {/* Batch Information Section (Consolidated for the batch) */}
        <div className="py-3 mb-8 px-2">
          <div className="flex flex-wrap justify-between items-center text-sm">
            <div className="flex gap-1.5">
              <span>BD/No:</span>
              <span className="font-bold text-gray-900 underline">
                {result_cadets.length === 1 ? result_cadets[0].bd_no : "—"}
              </span>
            </div>
            <div className="flex gap-1.5">
              <span>Name:</span>
              <span className="font-bold text-gray-900 underline">
                {result_cadets.length === 1 ? result_cadets[0].cadet?.name : "—"}
              </span>
            </div>
            <div className="flex gap-1.5">
              <span>Term/Semester:</span>
              <span className="font-bold text-gray-900 underline">{result.semester?.name || "—"}</span>
            </div>
            <div className="flex gap-1.5">
              <span>Course:</span>
              <span className="font-bold text-gray-900 uppercase underline">{result.course?.name || "—"}</span>
            </div>
          </div>
        </div>

        {/* Individual Cadet Reports */}
        <div className="space-y-16">
          {result_cadets.map((rc, rcIdx) => (
            <div key={rcIdx} className="report-block">
              {/* Cadet Header for Batch Reports */}
              {result_cadets.length > 1 && (
                <div className="mb-2 flex gap-4 text-sm font-bold uppercase">
                  <span>BD/No: {rc.bd_no}</span>
                  <span>Name: {rc.cadet?.name}</span>
                </div>
              )}
              {/* Assessment Table */}
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="border-b border-black">
                    <th className="px-3 py-3 text-center font-bold text-gray-700 border-r border-black w-[15%]">Events</th>
                    <th className="px-3 py-3 text-center font-bold text-gray-700 border-r border-black w-[35%]">Remarks</th>
                    <th className="px-3 py-3 text-center font-bold text-gray-700 border-r border-black w-[12%]">{`Cadets' Initial & Date`}</th>
                    <th className="px-3 py-3 text-center font-bold text-gray-700 border-r border-black w-[18%]">Counseling Officer (Rank & Name)</th>
                    <th className="px-3 py-3 text-center font-bold text-gray-700 border-r border-black w-[10%]">OC Wgs</th>
                    <th className="px-3 py-3 text-center font-bold text-gray-700 uppercase w-[10%]">CI BAFA</th>
                  </tr>
                </thead>
                <tbody>
                  {availableEvents.map((event, eventIdx) => {
                    const cadetRemark = rc.remarks?.find(r => r.ctw_assessment_counseling_event_id === event.id);
                    return (
                      <tr key={event.id} className="border-b border-black">
                        <td className="px-3 py-4 text-gray-900 border-r border-black font-bold">
                          {event.event_name}
                        </td>
                        <td className="px-3 py-4 border-r border-black text-gray-800 leading-relaxed">
                          {!rc.is_present ? (
                            <span className="text-red-500 font-bold uppercase">Absent: {rc.absent_reason || "N/A"}</span>
                          ) : (
                            cadetRemark?.remark || "—"
                          )}
                        </td>
                        {eventIdx === 0 && (
                          <>
                            <td rowSpan={availableEvents.length} className="px-2 py-4 border-r border-black align-middle text-center bg-white font-mono">
                              <p className="font-bold">{result.counseling_date ? new Date(result.counseling_date).toLocaleDateString("en-GB") : "—"}</p>
                              <p>{`Counselling has been shown and understood by the Officer Cadet.`}</p>
                            </td>
                            <td rowSpan={availableEvents.length} className="px-2 py-4 text-gray-900 border-r border-black align-middle text-center bg-white">
                              <div className="font-bold leading-tight">{result.instructor?.name}</div>
                              <div className="text-[10px] text-gray-500 mt-1">{result.instructor?.rank?.short_name || result.instructor?.rank?.name}</div>
                            </td>
                            <td rowSpan={availableEvents.length} className="px-2 py-4 border-r border-black align-middle text-center bg-white text-gray-300">—</td>
                            <td rowSpan={availableEvents.length} className="px-2 py-4 align-middle text-center bg-white text-gray-300">—</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                  {availableEvents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400 italic">No events configured for this counseling type.</td>
                    </tr>
                  )}
                </tbody>
              </table>

            </div>
          ))}
        </div>
        <div className="mt-16 text-center text-xs">
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider">Restricted</p>
        </div>
      </div>
    </div>
  );
}
