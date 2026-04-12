/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnAssessmentCounselingResultService } from "@/libs/services/ftw12sqnAssessmentCounselingResultService";
import { ftw12sqnCounselingSemesterApprovalService } from "@/libs/services/ftw12sqnCounselingSemesterApprovalService";
import { useAuth } from "@/context/AuthContext";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { useCan } from "@/context/PagePermissionsContext";
import { Modal } from "@/components/ui/modal";

export default function Ftw12SqnViewAssessmentCounselingResultsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const can = useCan();

  const [results, setResults] = useState<any[]>([]);
  const [semesterApprovals, setSemesterApprovals] = useState<any[]>([]);
  const [allAuthorities, setAllAuthorities] = useState<any[]>([]);
  const [myAuthority, setMyAuthority] = useState<any>(null);
  const [hasCounselingAssign, setHasCounselingAssign] = useState(false);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0,
  });

  const [forwardModal, setForwardModal] = useState<{
    open: boolean; loading: boolean; error: string; row: any;
  }>({ open: false, loading: false, error: "", row: null });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ftw12sqnAssessmentCounselingResultService.getGroupedResults({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
        authority_id: myAuthority?.id || undefined,
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
      setSemesterApprovals(response.semester_approvals);
      setAllAuthorities(response.authorities);
      setMyAuthority(response.my_authority);
      setHasCounselingAssign(response.has_counseling_assign);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, myAuthority?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const hasApprovalAuthority = !!myAuthority;

  const getSemesterApproval = (courseId: number, semesterId: number) =>
    semesterApprovals.find(a => a.course_id === courseId && a.semester_id === semesterId);

  const isSemesterApprovalActive = (courseId: number, semesterId: number) =>
    !!getSemesterApproval(courseId, semesterId);

  const isSemesterForwardedByMe = (courseId: number, semesterId: number) =>
    semesterApprovals.some(a => a.course_id === courseId && a.semester_id === semesterId && a.forwarded_by === user?.id);

  const getSemesterStatus = (courseId: number, semesterId: number) => {
    const approval = getSemesterApproval(courseId, semesterId);
    return approval?.status || "pending";
  };

  // Next authority in chain after myAuthority
  const nextAuthority = useMemo(() => {
    if (!myAuthority || !allAuthorities.length) return null;
    const sorted = [...allAuthorities].sort((a, b) => Number(a.sort) - Number(b.sort));
    const idx = sorted.findIndex(a => Number(a.id) === Number(myAuthority.id));
    return idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
  }, [myAuthority, allAuthorities]);

  const confirmForward = async () => {
    if (!forwardModal.row) return;
    setForwardModal(p => ({ ...p, loading: true, error: "" }));
    try {
      await ftw12sqnCounselingSemesterApprovalService.store({
        course_id: forwardModal.row.course_id,
        semester_id: forwardModal.row.semester_id,
        status: "pending",
        forwarded_by: user?.id || undefined,
        forwarded_at: new Date().toISOString(),
        current_authority_id: myAuthority?.id || undefined,
      } as any);
      setForwardModal({ open: false, loading: false, error: "", row: null });
      await loadData();
    } catch (err: any) {
      setForwardModal(p => ({ ...p, loading: false, error: err?.message || "Failed to forward." }));
    }
  };

  const columns: Column<any>[] = [
    {
      key: "sl", header: "SL.", headerAlign: "center",
      className: "text-center text-gray-900",
      render: (_, index) => (pagination.from || 0) + index,
    },
    {
      key: "course", header: "Course Name",
      render: (row) => <div className="font-medium text-gray-900">{row.course_details?.name || "N/A"}</div>,
    },
    {
      key: "semester", header: "Semester",
      render: (row) => <div className="font-medium text-gray-900">{row.semester_details?.name || "N/A"}</div>,
    },
    {
      key: "total_entry", header: "Total Entry", headerAlign: "center",
      className: "text-center font-bold text-blue-600",
      render: (row) => row.total_entry || 0,
    },
    {
      key: "total_cadets", header: "Total Cadets", headerAlign: "center",
      className: "text-center font-bold text-green-600",
      render: (row) => `${row.total_counseled || 0}/${row.total_cadets || 0}`,
    },
    {
      key: "status", header: "Status", headerAlign: "center", className: "text-center",
      render: (row) => {
        const status = getSemesterStatus(row.course_id, row.semester_id);
        const forwarded = isSemesterForwardedByMe(row.course_id, row.semester_id);
        return (
          <div className="flex flex-col items-center gap-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
              status === "approved" ? "bg-green-50 text-green-700 border-green-100" :
              status === "rejected" ? "bg-red-50 text-red-700 border-red-100" :
              isSemesterApprovalActive(row.course_id, row.semester_id)
                ? "bg-blue-50 text-blue-700 border-blue-100"
                : "bg-yellow-50 text-yellow-700 border-yellow-100"
            }`}>
              {isSemesterApprovalActive(row.course_id, row.semester_id) ? "In Progress" : "Not Started"}
            </span>
            {forwarded && (
              <span className="text-[9px] text-blue-600 font-bold flex items-center gap-0.5">
                <Icon icon="hugeicons:checkmark-circle-02" className="w-2.5 h-2.5" /> Forwarded by me
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions", header: "Actions", headerAlign: "center", className: "text-center no-print",
      render: (row) => {
        const approvalActive = isSemesterApprovalActive(row.course_id, row.semester_id);
        const forwardedByMe = isSemesterForwardedByMe(row.course_id, row.semester_id);
        const canForward = hasApprovalAuthority && !forwardedByMe &&
          Number(row.total_cadets) > 0 &&
          Number(row.total_cadets) === Number(row.total_counseled) &&
          Number(row.total_cadets) === Number(row.total_approved);

        return (
          <div className="flex items-center justify-center gap-1">
            {can("view") && (
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/ftw/12sqn/assessments/counselings/results/course/${row.course_id}/semester/${row.semester_id}`); }}
                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                title="View Results"
              >
                <Icon icon="hugeicons:view" className="w-4 h-4" />
              </button>
            )}

            {/* Edit/Delete hidden when approval in progress */}
            {!approvalActive && hasCounselingAssign && can("edit") && (
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/ftw/12sqn/assessments/counselings/results/course/${row.course_id}/semester/${row.semester_id}`); }}
                className="p-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-all"
                title="Edit Batch"
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
              </button>
            )}
            {!approvalActive && hasCounselingAssign && can("delete") && (
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/ftw/12sqn/assessments/counselings/results/course/${row.course_id}/semester/${row.semester_id}`); }}
                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                title="Delete Batch"
              >
                <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
              </button>
            )}

            {hasApprovalAuthority && !forwardedByMe && (
              <button
                onClick={(e) => { e.stopPropagation(); setForwardModal({ open: true, loading: false, error: "", row }); }}
                disabled={!canForward}
                className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                title={
                  Number(row.total_cadets) === 0 ? "No cadets assigned" :
                  Number(row.total_cadets) !== Number(row.total_counseled) ? "All cadets must be counseled first" :
                  Number(row.total_cadets) !== Number(row.total_approved) ? "All cadets must be approved by you first" :
                  "Forward Semester"
                }
              >
                <Icon icon="hugeicons:arrow-right-double" className="w-4 h-4" />
              </button>
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
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase tracking-widest">FTW 12SQN Counseling Assessment Results</h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text" placeholder="Search by course or semester..."
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          {can("add") && hasCounselingAssign && (
            <button
              onClick={() => router.push("/ftw/12sqn/assessments/counselings/results/create")}
              className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Result
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="w-full min-h-[20vh] flex items-center justify-center">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={results}
            keyExtractor={(_, index) => index.toString()}
            emptyMessage="No results found"
            onRowClick={(row) => router.push(`/ftw/12sqn/assessments/counselings/results/course/${row.course_id}/semester/${row.semester_id}`)}
          />

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700 font-medium">
                Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results
              </div>
              <select
                value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
              >
                <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />Prev
              </button>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                <button
                  key={page} onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 text-sm rounded-lg font-bold transition-all ${currentPage === page ? "bg-blue-600 text-white shadow-md" : "border border-gray-300 hover:bg-gray-50"}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                disabled={currentPage === pagination.last_page}
                className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
              >
                Next<Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Forward Confirmation Modal */}
      <Modal isOpen={forwardModal.open} onClose={() => setForwardModal(p => ({ ...p, open: false }))} showCloseButton className="max-w-md">
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-5">
            <FullLogo />
            <h2 className="text-lg font-bold text-gray-900 mt-3 uppercase">Forward to Higher Authority</h2>
            <div className="h-1 w-16 bg-indigo-500 rounded-full mt-2" />
          </div>

          <div className="space-y-2 mb-5 text-sm bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Course</span>
              <span className="font-bold text-gray-900">{forwardModal.row?.course_details?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Semester</span>
              <span className="font-bold text-gray-900">{forwardModal.row?.semester_details?.name || "—"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-5 text-sm">
            <div>
              <p className="text-[10px] text-indigo-400 font-bold uppercase">Your Authority</p>
              <p className="font-bold text-indigo-800">{myAuthority?.role?.name || "—"}</p>
            </div>
            <Icon icon="hugeicons:arrow-right-double" className="w-5 h-5 text-indigo-400" />
            <div className="text-right">
              <p className="text-[10px] text-indigo-400 font-bold uppercase">Next Authority</p>
              <p className="font-bold text-indigo-800">{nextAuthority?.role?.name || "—"}</p>
            </div>
          </div>

          {forwardModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {forwardModal.error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setForwardModal(p => ({ ...p, open: false }))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={confirmForward}
              disabled={forwardModal.loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 text-sm font-semibold"
            >
              {forwardModal.loading
                ? <><Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />Forwarding...</>
                : <><Icon icon="hugeicons:share-04" className="w-4 h-4" />Confirm Forward</>
              }
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
