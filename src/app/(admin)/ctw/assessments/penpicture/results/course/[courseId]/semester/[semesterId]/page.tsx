/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwAssessmentPenpictureResultService } from "@/libs/services/ctwAssessmentPenpictureResultService";
import FullLogo from "@/components/ui/fulllogo";
import type { CtwAssessmentPenpictureResult } from "@/libs/types/system";
import type { FilePrintType } from "@/libs/types/filePrintType";
import PrintTypeModal from "@/components/ui/modal/PrintTypeModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

export default function CtwPenpictureCourseSemesterResultPage({ params }: { params: Promise<{ courseId: string; semesterId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.courseId);
  const semesterId = parseInt(resolvedParams.semesterId);

  const [results, setResults] = useState<CtwAssessmentPenpictureResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingResult, setDeletingResult] = useState<CtwAssessmentPenpictureResult | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await ctwAssessmentPenpictureResultService.getAllResults({
        course_id: courseId,
        semester_id: semesterId,
        per_page: 1000,
      });
      setResults(response.data);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load results");
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrintClick = () => setIsPrintModalOpen(true);

  const confirmPrint = (type: FilePrintType) => {
    setSelectedPrintType(type);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 100);
  };

  const confirmDelete = async () => {
    if (!deletingResult) return;
    try {
      setDeleteLoading(true);
      await ctwAssessmentPenpictureResultService.deleteResult(deletingResult.id);
      await loadData();
      setDeleteModalOpen(false);
      setDeletingResult(null);
    } catch (err) {
      console.error("Failed to delete result:", err);
      alert("Failed to delete result");
    } finally {
      setDeleteLoading(false);
    }
  };

  const meta = results[0] ?? null;

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => router.push("/ctw/assessments/penpicture/results")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

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
          table {
            font-size: 11px !important;
          }
          .print-div {
            max-width: 60vh !important;
            margin: 0 auto !important;
          }
        }
      `}</style>

      {/* Action Bar */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => history.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <button
          onClick={handlePrintClick}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:printer" className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* Content */}
      <div className="p-4 cv-content">
        {selectedPrintType && (
          <div className="flex justify-center mb-6">
            <p className="font-light uppercase">{selectedPrintType.name}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="font-medium text-gray-900 uppercase underline tracking-wider mt-1">
            CTW Pen Picture Assessment Result {selectedPrintType ? `— ${selectedPrintType.name}` : ""}
          </p>
          <p className="font-medium text-gray-900 uppercase tracking-wider mt-1">
            {meta?.course?.name}{meta?.course?.code ? ` (${meta.course.code})` : ""}
            {" — "}
            {meta?.semester?.name}{meta?.semester?.code ? ` (${meta.semester.code})` : ""}
          </p>
        </div>

        {/* Meta Row */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <p>
            <span className="font-bold text-gray-900 uppercase mr-2">Program</span>
            <span className="border-b border-dashed border-black">: {meta?.program?.name || "—"}</span>
          </p>
          <p>
            <span className="font-bold text-gray-900 uppercase mr-2">Total Submissions</span>
            <span className="border-b border-dashed border-black">: {results.length} Cadet(s)</span>
          </p>
        </div>

        {/* Results Table */}
        {results.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No results found for this course and semester.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr>
                  <th className="border border-black px-2 py-2 text-center align-middle">Ser</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">BD No</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Rank</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Name</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Branch</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Instructor</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Grade</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Pen Picture</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Strengths</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Weaknesses</th>
                  <th className="border border-black px-2 py-2 text-center align-middle no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr
                    key={result.id}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/ctw/assessments/penpicture/results/${result.id}`)}
                  >
                    <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                    <td className="border border-black px-2 py-2 text-center font-mono">
                      {(result.cadet as any)?.bd_no || (result.cadet as any)?.cadet_number || "—"}
                    </td>
                    <td className="border border-black px-2 py-2 text-center whitespace-nowrap">
                      {(result.cadet as any)?.assigned_ranks?.[0]?.rank?.short_name || "Cdt"}
                    </td>
                    <td className="border border-black px-2 py-2 font-medium whitespace-nowrap">
                      {result.cadet?.name || "N/A"}
                    </td>
                    <td className="border border-black px-2 py-2 text-center whitespace-nowrap">
                      {result.branch?.name || "—"}
                    </td>
                    <td className="border border-black px-2 py-2 text-center whitespace-nowrap">
                      {(result.instructor as any)?.name || "—"}
                    </td>
                    <td className="border border-black px-2 py-2 text-center">
                      <span className="font-bold">{(result.grade as any)?.grade_code || "—"}</span>
                      {(result.grade as any)?.grade_name && (
                        <div className="text-xs text-gray-500">{(result.grade as any).grade_name}</div>
                      )}
                    </td>
                    <td className="border border-black px-2 py-2 min-w-[160px] max-w-[220px]">
                      <p className="whitespace-pre-wrap text-xs leading-relaxed">
                        {result.pen_picture || "—"}
                      </p>
                    </td>
                    <td className="border border-black px-2 py-2 min-w-[120px]">
                      {result.strengths && result.strengths.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {result.strengths.filter((s) => s.is_active).map((s) => (
                            <li key={s.id} className="text-xs">{s.strength}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="border border-black px-2 py-2 min-w-[120px]">
                      {result.weaknesses && result.weaknesses.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {result.weaknesses.filter((w) => w.is_active).map((w) => (
                            <li key={w.id} className="text-xs">{w.weakness}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="border border-black px-2 py-2 text-center no-print" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => router.push(`/ctw/assessments/penpicture/results/${result.id}`)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                          title="View"
                        >
                          <Icon icon="hugeicons:view" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/ctw/assessments/penpicture/results/${result.id}/edit`)}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-all"
                          title="Edit"
                        >
                          <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeletingResult(result); setDeleteModalOpen(true); }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                          title="Delete"
                        >
                          <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signature Section */}
        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
          <div className="border-t-2 border-black pt-2">
            <p className="font-bold text-sm uppercase tracking-widest">Instructor</p>
          </div>
          <div className="border-t-2 border-black pt-2">
            <p className="font-bold text-sm uppercase tracking-widest">Chief Instructor</p>
          </div>
          <div className="border-t-2 border-black pt-2">
            <p className="font-bold text-sm uppercase tracking-widest">Commandant</p>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 uppercase tracking-widest pt-6 mt-4">
          Generated on:{" "}
          {new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      <PrintTypeModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirm={confirmPrint}
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Result"
        message={`Are you sure you want to delete this assessment result for "${(deletingResult?.cadet as any)?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
