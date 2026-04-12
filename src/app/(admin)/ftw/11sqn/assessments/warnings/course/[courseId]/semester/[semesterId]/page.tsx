/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw11sqnCadetWarningService } from "@/libs/services/ftw11sqnCadetWarningService";
import FullLogo from "@/components/ui/fulllogo";
import type { CadetWarning } from "@/libs/types/system";
import type { FilePrintType } from "@/libs/types/filePrintType";
import PrintTypeModal from "@/components/ui/modal/PrintTypeModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

export default function WarningsCourseSemesterResultPage({ params }: { params: Promise<{ courseId: string; semesterId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.courseId);
  const semesterId = parseInt(resolvedParams.semesterId);

  const [results, setResults] = useState<CadetWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingResult, setDeletingResult] = useState<CadetWarning | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await ftw11sqnCadetWarningService.getAll({
        course_id: courseId,
        semester_id: semesterId,
        per_page: 1000,
      });
      setResults(response.data);
    } catch (err) {
      console.error("Failed to load warnings:", err);
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const confirmPrint = (type: FilePrintType) => {
    setSelectedPrintType(type);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 100);
  };

  const confirmDelete = async () => {
    if (!deletingResult) return;
    try {
      setDeleteLoading(true);
      await ftw11sqnCadetWarningService.delete(deletingResult.id);
      await loadData();
      setDeleteModalOpen(false);
      setDeletingResult(null);
    } catch (err) {
      console.error("Failed to delete warning:", err);
      alert("Failed to delete warning");
    } finally {
      setDeleteLoading(false);
    }
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

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => router.push("/ftw11sqn/assessments/warnings")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  const course = results[0]?.course;
  const semester = results[0]?.semester;

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
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
          onClick={() => setIsPrintModalOpen(true)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:printer" className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* Content */}
      <div className="p-8 cv-content">
        {selectedPrintType && (
          <div className="flex justify-center mb-4">
            <p className="font-light uppercase">{selectedPrintType.name}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="font-medium text-gray-900 uppercase underline tracking-wider mt-1">
            ATW Cadet Warnings Summary Sheet {selectedPrintType ? `— ${selectedPrintType.name}` : ""}
          </p>
          <p className="font-medium text-gray-900 uppercase tracking-wider mt-1">
            {course?.name}{course?.code ? ` (${course.code})` : ""}
            {" — "}
            {semester?.name}{semester?.code ? ` (${semester.code})` : ""}
          </p>
        </div>

        {/* Meta Row */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <p>
            <span className="font-bold text-gray-900 uppercase mr-2">Total Warnings</span>
            <span className="border-b border-dashed border-black">: {results.length} Record(s)</span>
          </p>
        </div>

        {/* Warnings Table */}
        {results.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No warnings found for this course and semester.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr>
                  <th className="border border-black px-2 py-2 text-center align-middle">Ser</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">BD No</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Name</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Warning Type</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Deduction</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Remarks</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Status</th>
                  <th className="border border-black px-2 py-2 text-center align-middle no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((res, index) => (
                  <tr
                    key={res.id}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/ftw11sqn/assessments/warnings/${res.id}`)}
                  >
                    <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                    <td className="border border-black px-2 py-2 text-center font-mono font-bold">
                      {(res.cadet as any)?.cadet_number || (res.cadet as any)?.bd_no || "—"}
                    </td>
                    <td className="border border-black px-2 py-2 font-medium whitespace-nowrap">
                      {res.cadet?.name || "—"}
                    </td>
                    <td className="border border-black px-2 py-2 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-red-50 text-red-700 border border-red-100">
                        {res.warning?.name || "—"}
                      </span>
                    </td>
                    <td className="border border-black px-2 py-2 text-center font-bold text-red-600">
                      -{Number(res.warning?.reduced_mark || 0).toFixed(1)}
                    </td>
                    <td className="border border-black px-2 py-2 italic text-gray-700">
                      {res.remarks || "—"}
                    </td>
                    <td className="border border-black px-2 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${res.is_active ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                        {res.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="border border-black px-2 py-2 text-center no-print" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => router.push(`/ftw11sqn/assessments/warnings/${res.id}`)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                          title="View"
                        >
                          <Icon icon="hugeicons:view" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/ftw11sqn/assessments/warnings/${res.id}/edit`)}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-all"
                          title="Edit"
                        >
                          <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeletingResult(res); setDeleteModalOpen(true); }}
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
        title="Delete Warning"
        message={`Are you sure you want to delete this warning for "${deletingResult?.cadet?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
