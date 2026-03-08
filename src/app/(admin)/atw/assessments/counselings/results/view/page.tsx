/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwAssessmentCounselingResultService } from "@/libs/services/atwAssessmentCounselingResultService";
import { atwUserAssignService } from "@/libs/services/atwUserAssignService";
import { atwCounselingSemesterApprovalService } from "@/libs/services/atwCounselingSemesterApprovalService";
import { atwCounselingApprovalAuthorityService } from "@/libs/services/atwCounselingApprovalAuthorityService";
import { useAuth } from "@/context/AuthContext";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { useCan } from "@/context/PagePermissionsContext";
import { Modal } from "@/components/ui/modal";

export default function AtwViewAssessmentCounselingResultsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const can = useCan("/atw/assessments/counselings/results");

  const [hasCounselingAssign, setHasCounselingAssign] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [semesterApprovals, setSemesterApprovals] = useState<any[]>([]);
  const [allAuthorities, setAllAuthorities] = useState<any[]>([]);
  const [currentAuthority, setCurrentAuthority] = useState<any>(null);
  const [hasApprovalAuthority, setHasApprovalAuthority] = useState(false);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Forward modal state
  const [forwardModal, setForwardModal] = useState<{
    open: boolean;
    loading: boolean;
    error: string;
    row: any;
  }>({ open: false, loading: false, error: "", row: null });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load grouped results with authority_id to get approval counts
      const response = await atwAssessmentCounselingResultService.getGroupedResults({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
        authority_id: currentAuthority?.id || undefined,
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

      // Load all semester approvals to map status
      const semesterAppRes = await atwCounselingSemesterApprovalService.getApprovals({ allData: true });
      setSemesterApprovals(semesterAppRes.data);

    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, currentAuthority?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Counseling assigns and authorities
  useEffect(() => {
    if (!user?.id) return;

    atwUserAssignService.getAll({ user_id: user.id }).then((data) => {
      setHasCounselingAssign(data.counseling.length > 0);
    });

    atwCounselingApprovalAuthorityService.getAuthorities({ allData: true, is_active: true }).then((res) => {
      if (res.data) {
        const sortedAuths = [...res.data].sort((a, b) => a.sort - b.sort);
        setAllAuthorities(sortedAuths);
        const auth = sortedAuths.find(
          (a) =>
            a.user_id === user.id ||
            user.roles?.some((r: any) => r.id === a.role_id) ||
            user.role?.id === a.role_id
        );
        if (auth) {
          setHasApprovalAuthority(true);
          setCurrentAuthority(auth);
        }
      }
    });
  }, [user]);

  const handleAddResult = () => router.push("/atw/assessments/counselings/results/create");
  const handleExport = () => console.log("Export results");
  const handleSearchChange = (value: string) => { setSearchTerm(value); setCurrentPage(1); };
  const handlePerPageChange = (value: number) => { setPerPage(value); setCurrentPage(1); };

  const handleForwardClick = (row: any) => {
    setForwardModal({ open: true, loading: false, error: "", row });
  };

  const confirmForward = async () => {
    if (!forwardModal.row) return;
    setForwardModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      await atwCounselingSemesterApprovalService.store({
        course_id: forwardModal.row.course_id,
        semester_id: forwardModal.row.semester_id,
        status: "pending",
        forwarded_by: user?.id || undefined,
        forwarded_at: new Date().toISOString(),
        current_authority_id: currentAuthority?.id || undefined,
      } as any);
      setForwardModal({ open: false, loading: false, error: "", row: null });
      await loadData();
    } catch (err: any) {
      setForwardModal((prev) => ({ ...prev, loading: false, error: err?.message || "Failed to forward." }));
    }
  };

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
    </div>
  );

  const getSemesterStatus = (courseId: number, semesterId: number) => {
    const approval = semesterApprovals.find(
      (a) => a.course_id === courseId && a.semester_id === semesterId
    );
    if (!approval) return "pending";
    return approval.status;
  };

  const isSemesterForwardedByMe = (courseId: number, semesterId: number) => {
    return semesterApprovals.some(
      (a) => a.course_id === courseId && a.semester_id === semesterId && a.forwarded_by === user?.id
    );
  };

  const columns: Column<any>[] = [
    { key: "sl", header: "SL.", headerAlign: "center", className: "text-center text-gray-900", render: (_, index) => (pagination.from || 0) + index },
    {
      key: "course",
      header: "Course Name",
      render: (row) => (
        <div className="font-medium text-gray-900">{row.course_details?.name || "N/A"}</div>
      ),
    },
    {
      key: "semester",
      header: "Semester",
      render: (row) => (
        <div className="font-medium text-gray-900">{row.semester_details?.name || "N/A"}</div>
      ),
    },
    {
      key: "total_entry",
      header: "Total Entry",
      headerAlign: "center",
      className: "text-center font-bold text-blue-600",
      render: (row) => row.total_entry || 0,
    },
    {
      key: "total_cadets",
      header: "Total Cadets",
      headerAlign: "center",
      className: "text-center font-bold text-green-600",
      render: (row) => `${row.total_counseled || 0}/${row.total_cadets || 0}`,
    },
    {
      key: "status",
      header: "Status",
      headerAlign: "center",
      className: "text-center",
      render: (row) => {
        const status = getSemesterStatus(row.course_id, row.semester_id);
        const isForwarded = isSemesterForwardedByMe(row.course_id, row.semester_id);
        
        return (
          <div className="flex flex-col items-center gap-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
              status === "approved" ? "bg-green-50 text-green-700 border-green-100" :
              status === "rejected" ? "bg-red-50 text-red-700 border-red-100" :
              "bg-yellow-50 text-yellow-700 border-yellow-100"
            }`}>
              {status}
            </span>
            {isForwarded && (
              <span className="text-[9px] text-blue-600 font-bold flex items-center gap-0.5">
                <Icon icon="hugeicons:checkmark-circle-02" className="w-2.5 h-2.5" /> Forwarded
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (row) => (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            {can("view") && (
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/atw/assessments/counselings/results/course/${row.course_id}/semester/${row.semester_id}`); }}
                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                title="View Results"
              >
                <Icon icon="hugeicons:view" className="w-4 h-4" />
              </button>
            )}

            {hasCounselingAssign && can("edit") && (
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/atw/assessments/counselings/results/course/${row.course_id}/semester/${row.semester_id}`); }}
                className="p-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-all"
                title="Edit Batch"
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
              </button>
            )}

            {hasCounselingAssign && can("delete") && (
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/atw/assessments/counselings/results/course/${row.course_id}/semester/${row.semester_id}`); }}
                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                title="Delete Batch"
              >
                <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
              </button>
            )}

            {hasApprovalAuthority && !isSemesterForwardedByMe(row.course_id, row.semester_id) && (
              <button
                onClick={(e) => { e.stopPropagation(); handleForwardClick(row); }}
                disabled={Number(row.total_cadets) === 0 || Number(row.total_cadets) !== Number(row.total_counseled) || Number(row.total_cadets) !== Number(row.total_approved)}
                className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                title={Number(row.total_cadets) === 0 ? "No cadets assigned" : Number(row.total_cadets) !== Number(row.total_counseled)
                  ? "All assigned cadets must have results before forwarding"
                  : Number(row.total_cadets) !== Number(row.total_approved)
                  ? "All cadets must be approved by you before forwarding"
                  : "Forward Semester"}
              >
                <Icon icon="hugeicons:arrow-right-double" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase tracking-widest">ATW Counseling Assessment Results</h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by course or semester..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>
        <div className="flex items-center gap-3">
          {can("add") && hasCounselingAssign && (
            <button onClick={handleAddResult} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95">
              <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Result
            </button>
          )}
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700 transition-all shadow-md active:scale-95">
            <Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export
          </button>
        </div>
      </div>

      {loading ? (
        <TableLoading />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={results}
            keyExtractor={(_, index) => index.toString()}
            emptyMessage="No results found"
            onRowClick={(row) => router.push(`/atw/assessments/counselings/results/course/${row.course_id}/semester/${row.semester_id}`)}
          />

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700 font-medium">
                Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results
              </div>
              <select value={perPage} onChange={(e) => handlePerPageChange(Number(e.target.value))} className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold">
                <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />Prev
              </button>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`px-4 py-2 text-sm rounded-lg font-bold transition-all ${currentPage === page ? "bg-blue-600 text-white shadow-md" : "border border-gray-300 hover:bg-gray-50"}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))} disabled={currentPage === pagination.last_page} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold">
                Next<Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Forward Confirmation Modal */}
      <Modal isOpen={forwardModal.open} onClose={() => setForwardModal((p) => ({ ...p, open: false }))} showCloseButton className="max-w-sm">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Forward Semester Results</h2>
          <p className="text-sm text-gray-500 mb-4">
            Do you want to forward all counseling results for this semester to the next authority?
          </p>
          {forwardModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {forwardModal.error}
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setForwardModal((p) => ({ ...p, open: false }))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={confirmForward}
              disabled={forwardModal.loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
            >
              {forwardModal.loading
                ? <><Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />Forwarding...</>
                : <><Icon icon="hugeicons:arrow-right-double" className="w-4 h-4" />Forward</>
              }
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
