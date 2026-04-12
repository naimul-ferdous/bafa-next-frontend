/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnAssessmentPenpictureResultService } from "@/libs/services/ftw12sqnAssessmentPenpictureResultService";
import FullLogo from "@/components/ui/fulllogo";
import type { Ftw12SqnAssessmentPenpictureResult } from "@/libs/types/system";
import type { FilePrintType } from "@/libs/types/filePrintType";
import PrintTypeModal from "@/components/ui/modal/PrintTypeModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

export default function PenpictureCourseSemesterResultPage({ params }: { params: Promise<{ courseId: string; semesterId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.courseId);
  const semesterId = parseInt(resolvedParams.semesterId);

  const [results, setResults] = useState<Ftw12SqnAssessmentPenpictureResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingResult, setDeletingResult] = useState<Ftw12SqnAssessmentPenpictureResult | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await ftw12sqnAssessmentPenpictureResultService.getAllResults({
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
      await ftw12sqnAssessmentPenpictureResultService.deleteResult(deletingResult.id);
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
            onClick={() => router.push("/ftw12sqn/assessments/penpicture/results")}
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
          .cv-content {
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
          }
          table {
            font-size: 14px !important;
          }
          .print-div {
            max-width: 60vh !important;
            margin: 0 auto !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Dynamic @page rules — overrides browser default header/footer with custom content */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 12mm 2mm;

            @top-left   { content: ""; }
            @top-center {
              content: "${(selectedPrintType?.name ?? '').replace(/"/g, '\\"')}";
              font-size: 10pt;
              white-space: pre;
              text-align: center;
              text-transform: uppercase;
            }
            @top-right  { content: ""; }

            @bottom-left   { content: ""; }
            @bottom-center {
              content: "${(selectedPrintType?.name ?? '').replace(/"/g, '\\"')}" "\\A" counter(page);
              font-size: 10pt;
              white-space: pre;
              text-align: center;
              text-transform: uppercase;
            }
            @bottom-right  { content: ""; }
          }
        }
      ` }} />
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
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-2">
            <FullLogo />
          </div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">
            Performance Evaluation Report by OC ATW, BAFA
          </h1>
          <p className="font-medium text-gray-900 uppercase underline mt-1">
            No. {meta?.course?.name} Course ({meta?.program?.name})
          </p>
        </div>

        {/* Results List */}
        {results.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No results found for this course and semester.
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => {
              const cadet = result.cadet as any;
              const rank  = cadet?.rank?.short_name || cadet?.rank?.name || "";
              const name  = cadet?.name || "—";
              const bdNo  = cadet?.cadet_number || cadet?.bd_no || "—";

              return (
                <div key={result.id} className="flex items-start gap-3">
                  {/* Serial - empty placeholder to keep alignment if needed */}
                  <div className="w-1 shrink-0"></div>

                  {/* Label + performance */}
                  <div className="flex-1 text-justify">
                    <span className="font-bold text-gray-900">
                      <span className="inline-block mr-10">{index + 1}.</span><span className="underline mr-10"> BD/{bdNo}, {rank && `${rank} `}{name}, {cadet.branch?.name || "—"} :</span>
                    </span>
                    <span className="text-gray-700 ml-2">{result.course_performance || "—"}</span>
                  </div>

                  {/* Actions (hidden on print) */}
                  <div className="no-print flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => router.push(`/ftw12sqn/assessments/penpicture/results/${result.id}/edit`)}
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
                </div>
              );
            })}
          </div>
        )}
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
