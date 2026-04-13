/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwMedicalDisposalResultService } from "@/libs/services/ctwMedicalDisposalResultService";
import type { CtwMedicalDisposalResult } from "@/libs/types/ctwMedicalDisposal";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { useCan } from "@/context/PagePermissionsContext";

export default function CtwMedicalDisposalCourseSemesterPage({
  params,
}: {
  params: Promise<{ courseId: string; semesterId: string }>;
}) {
  const router = useRouter();
  const can = useCan("/ctw/assessments/medical-disposal/disposal");
  const resolvedParams = use(params);
  const courseId   = parseInt(resolvedParams.courseId);
  const semesterId = parseInt(resolvedParams.semesterId);

  const [results, setResults]   = useState<CtwMedicalDisposalResult[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: CtwMedicalDisposalResult | null; loading: boolean }>({
    open: false, item: null, loading: false,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ctwMedicalDisposalResultService.getAll({
        course_id: courseId,
        semester_id: semesterId,
        per_page: 1000,
      });
      if (res.data.length === 0) {
        setError("No results found for this course and semester.");
      } else {
        setResults(res.data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load results.");
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId]);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    if (!deleteModal.item) return;
    setDeleteModal((p) => ({ ...p, loading: true }));
    try {
      await ctwMedicalDisposalResultService.delete(deleteModal.item.id);
      await load();
      setDeleteModal({ open: false, item: null, loading: false });
    } catch {
      setDeleteModal((p) => ({ ...p, loading: false }));
    }
  };

  const columns: Column<CtwMedicalDisposalResult>[] = [
    {
      key: "sl", header: "SL.", headerAlign: "center", className: "text-center w-10",
      render: (_, index) => index + 1,
    },
    {
      key: "cadet", header: "Cadet",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.cadet?.name || "—"}</div>
          <div className="text-xs text-gray-500 font-mono">{row.cadet?.cadet_number || ""}</div>
        </div>
      ),
    },
    {
      key: "course", header: "Course",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.course?.name || "—"}</div>
          {row.course?.code && <div className="text-xs text-gray-400 font-mono">{row.course.code}</div>}
        </div>
      ),
    },
    {
      key: "semester", header: "Semester",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.semester?.name || "—"}</div>
          {row.semester?.code && <div className="text-xs text-gray-400 font-mono">{row.semester.code}</div>}
        </div>
      ),
    },
    {
      key: "program", header: "Program",
      render: (row) => row.program?.name || "—",
    },
    {
      key: "branch", header: "Branch",
      render: (row) => row.branch?.name || "—",
    },
    {
      key: "disposal", header: "Disposal", headerAlign: "center", className: "text-center",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
          {row.result_schemas?.length ?? 0} entries
        </span>
      ),
    },
    {
      key: "is_active", header: "Status", headerAlign: "center", className: "text-center",
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full ${row.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {row.is_active ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      key: "actions", header: "Actions", headerAlign: "center", className: "text-center no-print",
      render: (row) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* {can("view") && ( */}
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/ctw/assessments/medical-disposal/disposal/${row.id}`); }}
              className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
              title="View"
            >
              <Icon icon="hugeicons:view" className="w-4 h-4" />
            </button>
          {/* )} */}
          {can("edit") && (
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/ctw/assessments/medical-disposal/disposal/${row.id}/edit`); }}
              className="p-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-all"
              title="Edit"
            >
              <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            </button>
          )}
          {can("delete") && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, item: row, loading: false }); }}
              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
              title="Delete"
            >
              <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 flex justify-center py-24">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || results.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 text-center py-16">
        <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
        <p className="text-red-600 font-medium">{error || "Results not found"}</p>
        <button
          onClick={() => router.push("/ctw/assessments/medical-disposal/disposal")}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold"
        >
          Back to Results
        </button>
      </div>
    );
  }

  const firstResult = results[0];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Action bar */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => history.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          {can("add") && (
            <button
              onClick={() => router.push("/ctw/assessments/medical-disposal/disposal/create")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shadow-md"
            >
              <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
              Add Result
            </button>
          )}
        </div>
      </div>

      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-700 uppercase tracking-wider pb-2">
            ATW Medical Disposal Assessment Summary Sheet
          </p>
        </div>

        {/* Results Table */}
        <DataTable
          columns={columns}
          data={results}
          keyExtractor={(row) => row.id.toString()}
          emptyMessage="No results found"
          onRowClick={can("view") ? (row) => router.push(`/ctw/assessments/medical-disposal/disposal/${row.id}`) : undefined}
        />
      </div>

      <ConfirmationModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null, loading: false })}
        onConfirm={confirmDelete}
        title="Delete Result"
        message={`Are you sure you want to delete this result for "${deleteModal.item?.cadet?.name}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteModal.loading}
        variant="danger"
      />
    </div>
  );
}
