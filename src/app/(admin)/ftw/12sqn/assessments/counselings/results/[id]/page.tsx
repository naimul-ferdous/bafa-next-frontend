/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnAssessmentCounselingResultService } from "@/libs/services/ftw12sqnAssessmentCounselingResultService";
import FullLogo from "@/components/ui/fulllogo";
import type { Ftw12sqnAssessmentCounselingResult } from "@/libs/types/system";

export default function ResultDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const resultId = parseInt(resolvedParams.id);

  const [result, setResult] = useState<Ftw12sqnAssessmentCounselingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(true);
        const data = await ftw12sqnAssessmentCounselingResultService.getResult(resultId);
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
            onClick={() => router.push("/ftw/12sqn/assessments/counselings/results")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const availableEvents = result.counselingType?.events || [];

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200 min-h-screen">
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ftw/12sqn/assessments/counselings/results")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white flex items-center gap-2 font-bold transition-all"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white flex items-center gap-2 font-bold transition-all"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print Report
          </button>
          <button
            onClick={() => router.push(`/ftw/12sqn/assessments/counselings/results/${result.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold transition-all shadow-md active:scale-95"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Result
          </button>
        </div>
      </div>

      {/* CV Content Area */}
      <div className="p-12 cv-content">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2 underline decoration-2 underline-offset-4">
            INTERVIEW/COUNSELLING REPORT (FTW 12SQN)
          </p>
        </div>

        {/* Information Section */}
        <div className="border-b border-dashed border-gray-300 py-3 mb-8 px-2">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="flex gap-1.5">
              <span className="text-gray-600 w-32">Course:</span>
              <span className="font-bold text-gray-900 uppercase">{result.course?.name || "—"}</span>
            </div>
            <div className="flex gap-1.5">
              <span className="text-gray-600 w-32">Semester:</span>
              <span className="font-bold text-gray-900 uppercase">{result.semester?.name || "—"}</span>
            </div>
            <div className="flex gap-1.5">
              <span className="text-gray-600 w-32">Counseling Type:</span>
              <span className="font-bold text-gray-900">{result.counselingType?.type_name || "—"}</span>
            </div>
            <div className="flex gap-1.5">
              <span className="text-gray-600 w-32">Instructor:</span>
              <span className="font-bold text-gray-900">{result.instructor ? `${result.instructor.name} (${result.instructor.service_number || 'N/A'})` : "—"}</span>
            </div>
            <div className="flex gap-1.5">
              <span className="text-gray-600 w-32">Officer Cadet:</span>
              <span className="font-bold text-gray-900">{result.cadet ? `${result.cadet.name} (${(result.cadet as any).cadet_number || (result.cadet as any).service_number || (result.cadet as any).bd_no || 'N/A'})` : "—"}</span>
            </div>
            <div className="flex gap-1.5">
              <span className="text-gray-600 w-32">Date:</span>
              <span className="font-bold text-gray-900">{result.created_at ? new Date(result.created_at).toLocaleDateString("en-GB") : "—"}</span>
            </div>
          </div>
        </div>

        {/* Assessment Table */}
        <div className="report-block">
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="border-b border-black bg-gray-50">
                <th className="px-3 py-3 text-left font-bold text-gray-700 border-r border-black uppercase w-[20%]">EVENTS</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 border-r border-black uppercase w-[40%]">REMARKS</th>
                <th className="px-3 py-3 text-center font-bold text-gray-700 border-r border-black uppercase w-[15%] whitespace-normal">{`Initial & Date`}</th>
                <th className="px-3 py-3 text-center font-bold text-gray-700 border-r border-black uppercase w-[25%] whitespace-normal">Instructor (Rank & Name)</th>
              </tr>
            </thead>
            <tbody>
              {availableEvents.length > 0 ? (
                availableEvents.map((event, eventIdx) => {
                  const remark = result.remarks?.find(r => r.ftw_12sqn_assessment_counseling_event_id === event.id);
                  return (
                    <tr key={event.id} className={eventIdx !== availableEvents.length - 1 ? "border-b border-black" : ""}>
                      <td className="px-3 py-4 text-gray-900 border-r border-black font-bold uppercase">
                        {event.event_name}
                      </td>
                      <td className="px-3 py-4 border-r border-black text-gray-800 leading-relaxed">
                        {remark?.remark || "—"}
                      </td>
                      {eventIdx === 0 && (
                        <>
                          <td rowSpan={availableEvents.length} className="px-2 py-4 border-r border-black align-middle text-center bg-white font-mono">
                            {result.created_at ? new Date(result.created_at).toLocaleDateString("en-GB") : "—"}
                          </td>
                          <td rowSpan={availableEvents.length} className="px-2 py-4 text-gray-900 border-r border-black align-middle text-center bg-white">
                            <div className="font-bold uppercase leading-tight">{result.instructor?.name}</div>
                            <div className="text-[10px] text-gray-500 uppercase mt-1">{result.instructor?.rank?.short_name || result.instructor?.rank?.name || ""}</div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400 italic border border-black">
                    No events configured for this counseling type.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-[10px] text-gray-400 italic">
          Report Generated: {new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
