"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AtwOlqCadetApproval } from "@/libs/types/atwOlqCadetApproval";
import { Icon } from "@iconify/react";
import { atwOlqCadetApprovalService } from "@/libs/services/atwOlqCadetApprovalService";
import { commonService } from "@/libs/services/commonService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import { useCan } from "@/context/PagePermissionsContext";
import { Modal } from "@/components/ui/modal";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function AtwOlqCadetApprovalsPage() {
  const can = useCan();

  const [approvals, setApprovals] = useState<AtwOlqCadetApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Filter options
  const [courses, setCourses] = useState<{ id: number; name: string }[]>([]);
  const [semesters, setSemesters] = useState<{ id: number; name: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: number; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);

  // Filters
  const [filterCourseId, setFilterCourseId] = useState<string>("");
  const [filterSemesterId, setFilterSemesterId] = useState<string>("");
  const [filterProgramId, setFilterProgramId] = useState<string>("");
  const [filterBranchId, setFilterBranchId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");

  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0,
  });

  // Approve confirmation
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<AtwOlqCadetApproval | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<AtwOlqCadetApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    commonService.getResultOptions().then((opts) => {
      if (opts) {
        setCourses(opts.courses || []);
        setSemesters(opts.semesters || []);
        setPrograms(opts.programs || []);
        setBranches(opts.branches || []);
      }
      setOptionsLoading(false);
    });
  }, []);

  const loadApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const params: Parameters<typeof atwOlqCadetApprovalService.getApprovals>[0] = {
        page: currentPage,
        per_page: perPage,
      };
      if (filterCourseId)   params.course_id   = parseInt(filterCourseId);
      if (filterSemesterId) params.semester_id  = parseInt(filterSemesterId);
      if (filterProgramId)  params.program_id   = parseInt(filterProgramId);
      if (filterBranchId)   params.branch_id    = parseInt(filterBranchId);
      if (filterStatus !== "all") params.status = filterStatus;

      const response = await atwOlqCadetApprovalService.getApprovals(params);
      setApprovals(response.data);
      setPagination({
        current_page: response.current_page,
        last_page:    response.last_page,
        per_page:     response.per_page,
        total:        response.total,
        from:         response.from,
        to:           response.to,
      });
    } catch (error) {
      console.error("Failed to load OLQ cadet approvals:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, filterCourseId, filterSemesterId, filterProgramId, filterBranchId, filterStatus]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  // Approve
  const handleApprove = (record: AtwOlqCadetApproval) => {
    setApprovingRecord(record);
    setApproveModalOpen(true);
  };

  const confirmApprove = async () => {
    if (!approvingRecord) return;
    try {
      setApproveLoading(true);
      await atwOlqCadetApprovalService.update(approvingRecord.id, {
        status: "approved",
        approved_date: new Date().toISOString(),
      });
      await loadApprovals();
      setApproveModalOpen(false);
      setApprovingRecord(null);
    } catch (error) {
      console.error("Failed to approve:", error);
    } finally {
      setApproveLoading(false);
    }
  };

  // Reject
  const handleReject = (record: AtwOlqCadetApproval) => {
    setRejectingRecord(record);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectingRecord) return;
    try {
      setRejectLoading(true);
      await atwOlqCadetApprovalService.update(rejectingRecord.id, {
        status: "rejected",
        rejection_reason: rejectionReason || null,
      });
      await loadApprovals();
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Failed to reject:", error);
    } finally {
      setRejectLoading(false);
    }
  };

  const resetFilters = () => {
    setFilterCourseId("");
    setFilterSemesterId("");
    setFilterProgramId("");
    setFilterBranchId("");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  const statusBadge = (status: AtwOlqCadetApproval["status"]) => {
    const map = {
      pending:  "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100  text-green-800",
      rejected: "bg-red-100    text-red-800",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full ${map[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const columns: Column<AtwOlqCadetApproval>[] = [
    {
      key: "id",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900",
      render: (_, index) => (pagination.from || 0) + index,
    },
    {
      key: "cadet",
      header: "Cadet",
      render: (r) => r.cadet ? (
        <div>
          <div className="font-medium text-gray-900 text-sm">{r.cadet.name}</div>
          {r.cadet.chest_no && <div className="text-xs text-gray-500">{r.cadet.chest_no}</div>}
        </div>
      ) : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      key: "course",
      header: "Course",
      className: "text-gray-700 text-sm",
      render: (r) => r.course?.name || "—",
    },
    {
      key: "semester",
      header: "Semester",
      className: "text-gray-700 text-sm",
      render: (r) => r.semester?.name || "—",
    },
    {
      key: "program",
      header: "Program",
      className: "text-gray-700 text-sm",
      render: (r) => r.program?.name || "—",
    },
    {
      key: "branch",
      header: "Branch",
      className: "text-gray-700 text-sm",
      render: (r) => r.branch?.name || "—",
    },
    {
      key: "status",
      header: "Status",
      headerAlign: "center",
      className: "text-center",
      render: (r) => statusBadge(r.status),
    },
    {
      key: "approved_date",
      header: "Approved Date",
      className: "text-gray-700 text-sm",
      render: (r) => r.approved_date ? new Date(r.approved_date).toLocaleDateString("en-GB") : "—",
    },
    {
      key: "rejection_reason",
      header: "Rejection Reason",
      render: (r) => r.rejection_reason ? (
        <span className="text-xs text-red-600 max-w-xs block truncate" title={r.rejection_reason}>{r.rejection_reason}</span>
      ) : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (r) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          {can('edit') && r.status !== "approved" && (
            <button
              onClick={() => handleApprove(r)}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Approve"
            >
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
            </button>
          )}
          {can('edit') && r.status !== "rejected" && (
            <button
              onClick={() => handleReject(r)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Reject"
            >
              <Icon icon="hugeicons:cancel-circle" className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">ATW OLQ Assessment Cadet Approval Management</h2>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <select
          value={filterCourseId}
          onChange={(e) => { setFilterCourseId(e.target.value); setCurrentPage(1); }}
          disabled={optionsLoading}
          className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={filterSemesterId}
          onChange={(e) => { setFilterSemesterId(e.target.value); setCurrentPage(1); }}
          disabled={optionsLoading}
          className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Semesters</option>
          {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select
          value={filterProgramId}
          onChange={(e) => { setFilterProgramId(e.target.value); setCurrentPage(1); }}
          disabled={optionsLoading}
          className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Programs</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select
          value={filterBranchId}
          onChange={(e) => { setFilterBranchId(e.target.value); setCurrentPage(1); }}
          disabled={optionsLoading}
          className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as StatusFilter); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {(filterCourseId || filterSemesterId || filterProgramId || filterBranchId || filterStatus !== "all") && (
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <Icon icon="hugeicons:cancel-circle" className="w-3 h-3" />
            Reset Filters
          </button>
        </div>
      )}

      {loading ? (
        <div className="w-full min-h-[20vh] flex items-center justify-center">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={approvals}
          keyExtractor={(r) => r.id.toString()}
          emptyMessage="No OLQ cadet approvals found"
        />
      )}

      <Pagination
        currentPage={currentPage}
        lastPage={pagination.last_page}
        total={pagination.total}
        from={pagination.from}
        to={pagination.to}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={(val) => { setPerPage(val); setCurrentPage(1); }}
      />

      {/* Approve Confirmation */}
      <ConfirmationModal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        onConfirm={confirmApprove}
        title="Approve Cadet"
        message={`Are you sure you want to approve ${approvingRecord?.cadet?.name ?? "this cadet"}?`}
        confirmText="Approve"
        cancelText="Cancel"
        loading={approveLoading}
        variant="success"
      />

      {/* Reject Modal */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} showCloseButton className="max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Reject Cadet</h2>
          <p className="text-sm text-gray-500 mb-4">
            Rejecting <span className="font-semibold text-gray-700">{rejectingRecord?.cadet?.name ?? "this cadet"}</span>. Provide a reason (optional).
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            placeholder="Rejection reason..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={confirmReject}
              disabled={rejectLoading}
              className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
            >
              {rejectLoading
                ? <><Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />Rejecting...</>
                : <><Icon icon="hugeicons:cancel-circle" className="w-4 h-4" />Reject</>
              }
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
