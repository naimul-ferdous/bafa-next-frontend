"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Ftw11SqnAssessmentOlqResult } from "@/libs/types/ftw11sqnAssessmentOlq";
import { Icon } from "@iconify/react";
import { ftw11sqnAssessmentOlqResultService } from "@/libs/services/ftw11sqnAssessmentOlqResultService";
import { ftw11sqnUserAssignService } from "@/libs/services/ftw11sqnUserAssignService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { useCan } from "@/context/PagePermissionsContext";

export default function Ftw11SqnViewAssessmentOlqResultsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const can = useCan();

  const [hasOlqAssign, setHasOlqAssign] = useState(false);
  const [results, setResults] = useState<Ftw11SqnAssessmentOlqResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingResult, setDeletingResult] = useState<Ftw11SqnAssessmentOlqResult | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  });

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ftw11sqnAssessmentOlqResultService.getAllResults({
        page: currentPage,
        per_page: perPage,
      });
      setResults(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load OLQ results:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Load OLQ assigns for current user
  useEffect(() => {
    if (!user?.id) return;
    ftw11sqnUserAssignService.getAll({ user_id: user.id }).then((data) => {
      console.log("OLQ assigns for user", user.id, data.olq);
      setHasOlqAssign(data.olq.length > 0);
    });
  }, [user?.id]);

  const handleAddResult = () => router.push("/ftw/11sqn/assessments/olq/results/create");
  const handleEditResult = (result: Ftw11SqnAssessmentOlqResult) => router.push(`/ftw/11sqn/assessments/olq/results/${result.id}/edit`);
  const handleViewResult = (result: Ftw11SqnAssessmentOlqResult) => router.push(`/ftw/11sqn/assessments/olq/results/${result.id}`);
  const handleDeleteResult = (result: Ftw11SqnAssessmentOlqResult) => {
    setDeletingResult(result);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingResult) return;
    try {
      setDeleteLoading(true);
      await ftw11sqnAssessmentOlqResultService.deleteResult(deletingResult.id);
      await loadResults();
      setDeleteModalOpen(false);
      setDeletingResult(null);
    } catch (error) {
      console.error("Failed to delete OLQ result:", error);
      alert("Failed to delete OLQ result");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = () => console.log("Export OLQ results");
  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  const columns: Column<Ftw11SqnAssessmentOlqResult>[] = [
    { key: "id", header: "SL.", headerAlign:"center", className: "text-center text-gray-900", render: (result, index) => (pagination.from || 0) + (index) },
    {
      key: "course",
      header: "Course",
      className: "font-medium text-gray-900",
      render: (result) => result.course?.name || "—"
    },
    {
      key: "semester",
      header: "Semester",
      className: "text-gray-700",
      render: (result) => result.semester?.name || "—"
    },
    {
      key: "olq_type",
      header: "OLQ Type",
      className: "text-gray-700",
      render: (result) => result.olq_type?.type_name || "—"
    },
    {
      key: "result_cadets",
      header: "Cadets",
      headerAlign: "center",
      className: "text-center",
      render: (result) => (
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
          {result.result_cadets?.length || 0} cadets
        </span>
      ),
    },
    {
      key: "approval_status",
      header: "Approval Status",
      headerAlign: "center",
      className: "text-center",
      render: (result) => {
        const semApprovals = result.semester_approvals ?? [];
        const isActive = semApprovals.length > 0;
        const forwardedByMe = semApprovals.some((a: any) => a.forwarded_by === user?.id);
        return (
          <div className="flex flex-col items-center gap-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
              isActive
                ? "bg-blue-50 text-blue-700 border-blue-100"
                : "bg-yellow-50 text-yellow-700 border-yellow-100"
            }`}>
              {isActive ? "In Progress" : "Not Started"}
            </span>
            {forwardedByMe && (
              <span className="text-[9px] text-blue-600 font-bold flex items-center gap-0.5">
                <Icon icon="hugeicons:checkmark-circle-02" className="w-2.5 h-2.5" /> Forwarded by me
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "is_active",
      header: "Status",
      headerAlign:"center",
      className: "text-center",
      render: (result) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${result.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {result.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700 text-sm",
      render: (result) => result.created_at ? new Date(result.created_at).toLocaleDateString("en-GB") : "—"
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (result) => {
        const isForwarded = (result.semester_approvals?.length ?? 0) > 0;
        return (
          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
            {can('view') && (
              <button onClick={() => handleViewResult(result)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg" title="View"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
            )}
            {!isForwarded && can('edit') && result.created_by === user?.id && (
              <button onClick={() => handleEditResult(result)} className="p-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
            )}
            {!isForwarded && can('delete') && result.created_by === user?.id && (
              <button onClick={() => handleDeleteResult(result)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">11Sqn Assessment OLQ Results</h2>
      </div>

      <div className="flex items-center justify-end gap-4 mb-6">
        <div className="flex items-center gap-3">
          {can('add') && hasOlqAssign && (
            <button onClick={handleAddResult} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Result</button>
          )}
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {loading ? (
        <TableLoading />
      ) : (
        <DataTable
          columns={columns}
          data={results}
          keyExtractor={(result) => result.id.toString()}
          emptyMessage="No OLQ results found"
          onRowClick={can('view') ? handleViewResult : undefined}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results</div>
          <select value={perPage} onChange={(e) => handlePerPageChange(Number(e.target.value))} className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900">
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />Prev</button>
          {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => setCurrentPage(page)} className={`px-4 py-2 text-sm rounded-lg ${currentPage === page ? "bg-blue-600 text-white" : "border border-black hover:bg-gray-50"}`}>{page}</button>
          ))}
          <button onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))} disabled={currentPage === pagination.last_page} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next<Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" /></button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete OLQ Result"
        message={`Are you sure you want to delete this OLQ result? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
