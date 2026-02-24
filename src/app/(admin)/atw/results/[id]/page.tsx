/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwResultService } from "@/libs/services/atwResultService";
import FullLogo from "@/components/ui/fulllogo";
import type { AtwResult } from "@/libs/types/atwResult";
import type { AtwSubjectMark } from "@/libs/types/system";

export default function ResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [result, setResult] = useState<AtwResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(true);
        const data = await atwResultService.getResult(parseInt(resultId));
        if (data) {
          setResult(data);
        } else {
          setError("Result not found");
        }
      } catch (err) {
        console.error("Failed to load result:", err);
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

  // Group marks by type dynamically
  const getMarkGroups = () => {
    if (!result?.atw_subject?.subject_marks) return {};
    const groups: { [key: string]: AtwSubjectMark[] } = {};
    
    // Sort marks by ID to maintain consistent order
    const sortedMarks = [...result.atw_subject.subject_marks].sort((a, b) => a.id - b.id);
    
    sortedMarks.forEach(mark => {
      const type = mark.type?.toLowerCase() || "other";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(mark);
    });
    
    return groups;
  };

  const markGroups = getMarkGroups();
  const groupKeys = Object.keys(markGroups);

  // Get individual mark value
  const getCadetMark = (cadet: any, markId: number) => {
    const mark = cadet.cadet_marks?.find((m: any) => m.atw_subject_mark_id === markId);
    return parseFloat(String(mark?.achieved_mark || 0));
  };

  // Get individual weighted mark
  const getWeightedMark = (cadet: any, mark: AtwSubjectMark) => {
    const obtained = getCadetMark(cadet, mark.id);
    const estimate = parseFloat(String(mark.estimate_mark || 0));
    const percentage = parseFloat(String(mark.percentage || 0));
    if (estimate === 0) return 0;
    return (obtained / estimate) * percentage;
  };

  // Calculate total marks for a cadet (sum of all weighted marks)
  const calculateTotalMarks = (cadet: any) => {
     if (!result?.atw_subject?.subject_marks) return 0;
     return result.atw_subject.subject_marks.reduce((sum, mark) => {
         return sum + getWeightedMark(cadet, mark);
     }, 0);
  };

  // Calculate column totals for footer (Obtained)
  const calculateColumnTotal = (markId: number) => {
    if (!result?.result_getting_cadets) return 0;
    return result.result_getting_cadets.reduce((sum, cadet) => {
      if (!cadet.is_present) return sum;
      return sum + getCadetMark(cadet, markId);
    }, 0);
  };

  // Calculate weighted column totals for footer
  const calculateWeightedColumnTotal = (mark: AtwSubjectMark) => {
    if (!result?.result_getting_cadets) return 0;
    return result.result_getting_cadets.reduce((sum, cadet) => {
      if (!cadet.is_present) return sum;
      return sum + getWeightedMark(cadet, mark);
    }, 0);
  };

  // Helper to determine colSpan for dynamic marks group
  const getGroupColSpan = (marks: AtwSubjectMark[]) => {
    return marks.reduce((acc, m) => {
      const estimate = parseFloat(String(m.estimate_mark || 0));
      const percentage = parseFloat(String(m.percentage || 0));
      return acc + (estimate !== percentage ? 2 : 1);
    }, 0);
  };

  const totalMaxMarks = result?.atw_subject?.subjects_full_mark || 100;

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
          <p className="text-red-600">{error || "Result not found"}</p>
          <button
            onClick={() => router.push("/atw/results")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/atw/results")}
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
            onClick={() => router.push(`/atw/results/${result.id}/edit`)}
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
            ATW Result Sheet
          </p>
        </div>

        {/* Result Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Result Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Course</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.course?.name || "N/A"} ({result.course?.code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Semester</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.semester?.name || "N/A"} ({result.semester?.code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Program</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.program?.name || "N/A"} ({result.program?.code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Branch</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.branch?.name || "N/A"} ({result.branch?.code || "N/A"})</span>
            </div>
            {result.group && (
              <div className="flex">
                <span className="w-48 text-gray-900 font-medium">Group</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1">{result.group.name} ({result.group.code})</span>
              </div>
            )}
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Exam Type</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.exam_type?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Subject</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-semibold">{result.atw_subject?.subject_name || "N/A"} ({result.atw_subject?.subject_code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Instructor</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.instructor?.name || "N/A"} ({result.instructor?.service_number || "N/A"})</span>
            </div>
          </div>
        </div>

        {/* Cadets Marks Table */}
        {result.result_getting_cadets && result.result_getting_cadets.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
              Cadets Marks
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  {/* Header Row 1 */}
                  <tr>
                    <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">Ser</th>
                    <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">BD/No</th>
                    <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">Rank</th>
                    <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">Name</th>
                    <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">Branch</th>
                    <th colSpan={
                      groupKeys.reduce((acc, key) => acc + getGroupColSpan(markGroups[key]), 0)
                    } className="border border-black px-2 py-2 text-center">
                      Marks Obtained
                    </th>
                    <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle text-blue-700">
                      Total Marks<br/>{totalMaxMarks}
                    </th>
                  </tr>
                  {/* Header Row 2 */}
                  <tr>
                    {groupKeys.map(key => (
                      <th key={key} colSpan={getGroupColSpan(markGroups[key])} className="border border-black px-2 py-1 text-center capitalize">
                        {key === 'classtest' ? 'Class Test' : 
                         key === 'quiztest' ? 'Quiz Test' : 
                         key === 'midsemester' ? 'Mid Semester' : 
                         key === 'endsemester' ? 'End Semester' : 
                         key.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                  </tr>
                  {/* Header Row 3 */}
                  <tr>
                    {groupKeys.map(key => 
                      markGroups[key].map(sm => {
                        const estimate = parseFloat(String(sm.estimate_mark || 0));
                        const percentage = parseFloat(String(sm.percentage || 0));
                        const isDiff = estimate !== percentage;
                        return isDiff ? (
                          <React.Fragment key={sm.id}>
                            <th className="border border-black px-2 py-1 text-center text-xs">{sm.name} <br/> ({estimate})</th>
                            <th className="border border-black px-2 py-1 text-center text-xs">{percentage}% of Obt. Mks.</th>
                          </React.Fragment>
                        ) : (
                          <th key={sm.id} className="border border-black px-2 py-1 text-center text-xs">{sm.name} <br/> ({estimate})</th>
                        );
                      })
                    )}
                  </tr>
                </thead>
                <tbody>
                  {result.result_getting_cadets.map((cadet, index) => (
                    <tr key={cadet.id}>
                      <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                      <td className="border border-black px-2 py-2 text-center">{cadet.cadet_bd_no}</td>
                      <td className="border border-black px-2 py-2 text-center">
                        {cadet.cadet?.assigned_ranks?.[0]?.rank?.short_name || "Officer Cadet"}
                      </td>
                      <td className="border border-black px-2 py-2 text-blue-600 font-medium">{cadet.cadet?.name || "N/A"}</td>
                      <td className="border border-black px-2 py-2 text-center">{result.branch?.name || "N/A"}</td>
                      
                      {groupKeys.map(key => 
                        markGroups[key].map(sm => {
                          const estimate = parseFloat(String(sm.estimate_mark || 0));
                          const percentage = parseFloat(String(sm.percentage || 0));
                          const isDiff = estimate !== percentage;
                          return isDiff ? (
                            <React.Fragment key={sm.id}>
                              <td className="border border-black px-2 py-2 text-center">
                                {cadet.is_present ? getCadetMark(cadet, sm.id).toFixed(2) : "—"}
                              </td>
                              <td className="border border-black px-2 py-2 text-center font-medium">
                                {cadet.is_present ? getWeightedMark(cadet, sm).toFixed(2) : "—"}
                              </td>
                            </React.Fragment>
                          ) : (
                            <td key={sm.id} className="border border-black px-2 py-2 text-center">
                              {cadet.is_present ? getCadetMark(cadet, sm.id).toFixed(2) : "—"}
                            </td>
                          );
                        })
                      )}

                      {/* Total Marks */}
                      <td className="border border-black px-2 py-2 text-center text-blue-700 font-bold">
                        {cadet.is_present ? calculateTotalMarks(cadet).toFixed(2) : "—"}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Total Row */}
                  <tr className="font-semibold">
                    <td colSpan={5} className="border border-black px-2 py-2 text-center font-bold">TOTAL</td>
                    
                    {groupKeys.map(key => 
                      markGroups[key].map(sm => {
                        const estimate = parseFloat(String(sm.estimate_mark || 0));
                        const percentage = parseFloat(String(sm.percentage || 0));
                        const isDiff = estimate !== percentage;
                        return isDiff ? (
                          <React.Fragment key={sm.id}>
                            <td className="border border-black px-2 py-2 text-center">
                              {calculateColumnTotal(sm.id).toFixed(2)}
                            </td>
                            <td className="border border-black px-2 py-2 text-center">
                              {calculateWeightedColumnTotal(sm).toFixed(2)}
                            </td>
                          </React.Fragment>
                        ) : (
                          <td key={sm.id} className="border border-black px-2 py-2 text-center">
                            {calculateColumnTotal(sm.id).toFixed(2)}
                          </td>
                        );
                      })
                    )}

                    {/* Grand Total */}
                    <td className="border border-black px-2 py-2 text-center text-blue-700 font-bold">
                      {result.result_getting_cadets.filter(c => c.is_present).reduce((sum, c) => sum + calculateTotalMarks(c), 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            System Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className={`flex-1 ${result.is_active ? "text-green-600" : "text-red-600"}`}>
                {result.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created By</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.creator?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created At</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {result.created_at ? new Date(result.created_at).toLocaleString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Last Updated</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {result.updated_at ? new Date(result.updated_at).toLocaleString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
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