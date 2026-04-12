/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnAssessmentPenpictureResultService } from "@/libs/services/ftw12sqnAssessmentPenpictureResultService";
import { ftw12sqnAssessmentPenpictureGradeService } from "@/libs/services/ftw12sqnAssessmentPenpictureGradeService";
import FullLogo from "@/components/ui/fulllogo";
import type { Ftw12SqnAssessmentPenpictureResult, Ftw12SqnAssessmentPenpictureGrade } from "@/libs/types/system";
import type { FilePrintType } from "@/libs/types/filePrintType";
import PrintTypeModal from "@/components/ui/modal/PrintTypeModal";

export default function ResultDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const resultId = parseInt(resolvedParams.id);

  const [result, setResult] = useState<Ftw12SqnAssessmentPenpictureResult | null>(null);
  const [grades, setGrades] = useState<Ftw12SqnAssessmentPenpictureGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const resultData = await ftw12sqnAssessmentPenpictureResultService.getResult(resultId);

        if (resultData) {
          setResult(resultData);

          // Fetch all active grades for this course and semester
          const gradesData = await ftw12sqnAssessmentPenpictureGradeService.getActiveGrades({
            course_id: resultData.course_id,
            semester_id: resultData.semester_id
          });
          setGrades(gradesData);
        } else {
          setError("Result not found");
        }
      } catch (err) {
        console.error("Failed to load result details:", err);
        setError("Failed to load result data");
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      loadData();
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
          <p className="text-red-600 font-medium">{error || "Result not found"}</p>
          <button
            onClick={() => router.push("/ftw12sqn/assessments/penpicture/results")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  // Helper to check if a grade is the selected one for this result
  const isGradeSelected = (gradeId: number) => {
    return result.ftw12sqn_assessment_penpicture_grade_id === gradeId;
  };

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200 min-h-screen">
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
          onClick={() => router.push("/ftw12sqn/assessments/penpicture/results")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintClick}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* CV Content Area */}
      <div className="p-12 cv-content">
        <div className="w-full flex justify-between mb-6 text-xs font-bold">
          <div className="w-20">
            <p className="text-center font-medium text-gray-900 uppercase tracking-wider"></p>
          </div>
          <div>
            <p className="text-center font-medium text-gray-900 uppercase tracking-wider">{selectedPrintType?.name}</p>
          </div>
          <div>
            <p className="text-center font-medium text-gray-900 tracking-wider">BAF</p>
          </div>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
            INTERVIEW/COUNSELLING REPORT
          </p>
        </div>

        {/* Cadet Info Bar */}
        <div className="border-b border-dashed border-gray-300 py-3 mb-8 px-2">
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex gap-1.5">
              <span className="text-gray-600">BD No</span>
              <span className="font-bold text-gray-900">{(result.cadet as any)?.cadet_number || (result.cadet as any)?.bd_no || "—"}</span>
            </div>
            <div className="flex gap-1.5">
              <span className="text-gray-600">Course</span>
              <span className="font-bold text-gray-900 uppercase">{result.course?.name || "—"}</span>
            </div>
            <div className="flex gap-1.5">
              <span className="text-gray-600">Name</span>
              <span className="font-bold text-gray-900 uppercase">{(result.cadet as any)?.name || "—"}</span>
            </div>
            <div className="flex gap-1.5">
              <span className="text-gray-600">Semester</span>
              <span className="font-bold text-gray-900 uppercase">{result.semester?.name || "—"}</span>
            </div>
          </div>
        </div>

        {/* 1. PER */}
        <div className="mb-10">
          <h3 className="font-bold text-gray-900 mb-3">1. PER:</h3>
          <div className="leading-relaxed text-gray-800 text-justify">
            {result.pen_picture || "No pen picture provided."}
          </div>
        </div>

        {/* 2. Major Observations */}
        <div className="mb-10">
          <h3 className="font-bold text-gray-900 mb-4">2. Major Observations:</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr>
                  <th className="border border-black px-4 py-2.5 text-left w-1/4 font-bold bg-gray-50/50">Details</th>
                  <th className="border border-black px-4 py-2.5 text-left font-bold bg-gray-50/50">Observations</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-4 py-3 font-medium">Strength</td>
                  <td className="border border-black px-4 py-3">
                    <div className="space-y-1.5">
                      {result.strengths && result.strengths.length > 0 ? (
                        result.strengths.map((s, i) => (
                          <div key={i} className="flex gap-2">
                            <span>({String.fromCharCode(105 + i)})</span>
                            <span>{s.strength}</span>
                          </div>
                        ))
                      ) : "—"}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-4 py-3 font-medium">Weakness</td>
                  <td className="border border-black px-4 py-3">
                    <div className="space-y-1.5">
                      {result.weaknesses && result.weaknesses.length > 0 ? (
                        result.weaknesses.map((w, i) => (
                          <div key={i} className="flex gap-2">
                            <span>({String.fromCharCode(105 + i)})</span>
                            <span>{w.weakness}</span>
                          </div>
                        ))
                      ) : "—"}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Course Performance */}
        <div className="mb-12">
          <h3 className="font-bold text-gray-900 mb-2">3. Course Performance:</h3>
          <div className="text-gray-600 mb-6 px-1">
            {result.course_performance || "Overall performance assessment."}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-10 px-2">
            {grades.map((grade) => (
              <div key={grade.id} className="flex items-center gap-3">
                <div className={`w-4 h-4 border border-black flex items-center justify-center transition-colors ${isGradeSelected(grade.id) ? "bg-black" : "bg-white"}`}>
                  {isGradeSelected(grade.id) && (
                    <Icon icon="hugeicons:tick-01" className="w-3.5 h-3.5 text-white font-bold" />
                  )}
                </div>
                <span className={`text-sm ${isGradeSelected(grade.id) ? "font-bold text-black" : "text-gray-800"}`}>
                  {grade.grade_name}
                </span>
              </div>
            ))}
            {grades.length === 0 && <p className="text-sm text-gray-400 italic col-span-full">No grades configured for this course/semester.</p>}
          </div>
        </div>

        {/* Signature Blocks */}
        {/* <div className="grid grid-cols-2 gap-16 mt-20">
      
          <div className="border border-gray-200 p-6 bg-gray-50/30 rounded-lg">
            <p className="text-center font-bold mb-8 uppercase tracking-widest border-b border-gray-200 pb-2">Instructor</p>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="whitespace-nowrap">Signature:</span>
                <div className="flex-1 border-b border-dotted border-gray-400 h-4"></div>
              </div>
              <div className="flex items-end gap-2">
                <span className="whitespace-nowrap">Name:</span>
                <div className="flex-1 border-b border-dotted border-gray-400 h-4">
                  <span className="px-2 font-bold uppercase">{result.instructor?.name || ""}</span>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="whitespace-nowrap">Rank:</span>
                <div className="flex-1 border-b border-dotted border-gray-400 h-4">
                  <span className="px-2">{result.instructor?.rank?.name || ""}</span>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="whitespace-nowrap">Appt:</span>
                <div className="flex-1 border-b border-dotted border-gray-400 h-4"></div>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 p-6 bg-gray-50/30 rounded-lg text-gray-400 print:text-black">
            <p className="text-center font-bold mb-8 uppercase tracking-widest border-b border-gray-200 pb-2">OC Wg/Sqn</p>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="whitespace-nowrap">Signature:</span>
                <div className="flex-1 border-b border-dotted border-gray-400 h-4"></div>
              </div>
              <div className="flex items-end gap-2">
                <span className="whitespace-nowrap">Name:</span>
                <div className="flex-1 border-b border-dotted border-gray-400 h-4"></div>
              </div>
              <div className="flex items-end gap-2">
                <span className="whitespace-nowrap">Rank:</span>
                <div className="flex-1 border-b border-dotted border-gray-400 h-4"></div>
              </div>
              <div className="flex items-end gap-2">
                <span className="whitespace-nowrap">Appt:</span>
                <div className="flex-1 border-b border-dotted border-gray-400 h-4"></div>
              </div>
            </div>
          </div>
        </div> */}

        {/* Footer */}
        <div className="mt-16 text-center text-[10px] text-gray-400 italic">
          Report Generated: {new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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
