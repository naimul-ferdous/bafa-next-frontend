/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwAssessmentCounselingResultService } from "@/libs/services/atwAssessmentCounselingResultService";
import { atwCounselingCadetApprovalService } from "@/libs/services/atwCounselingCadetApprovalService";
import { atwCounselingSemesterApprovalService } from "@/libs/services/atwCounselingSemesterApprovalService";
import { atwCounselingApprovalAuthorityService } from "@/libs/services/atwCounselingApprovalAuthorityService";
import { atwUserAssignService } from "@/libs/services/atwUserAssignService";
import { useAuth } from "@/context/AuthContext";
import { useCan } from "@/context/PagePermissionsContext";
import FullLogo from "@/components/ui/fulllogo";
import type { AtwAssessmentCounselingResult } from "@/libs/types/atwAssessmentCounseling";
import type { AtwCounselingCadetApproval } from "@/libs/types/atwCounselingCadetApproval";
import type { AtwCounselingSemesterApproval } from "@/libs/types/atwCounselingSemesterApproval";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { Modal } from "@/components/ui/modal";

export default function CounselingCourseSemesterResultPage({ params }: { params: Promise<{ courseId: string; semesterId: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const can = useCan("/atw/assessments/counselings/results");
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.courseId);
  const semesterId = parseInt(resolvedParams.semesterId);

  const [results, setResults] = useState<AtwAssessmentCounselingResult[]>([]);
  const [approvals, setApprovals] = useState<AtwCounselingCadetApproval[]>([]);
  const [semesterApprovals, setSemesterApprovals] = useState<AtwCounselingSemesterApproval[]>([]);
  const [semesterApproval, setSemesterApproval] = useState<AtwCounselingSemesterApproval | null>(null);
  const [allAuthorities, setAllAuthorities] = useState<any[]>([]);
  const [currentAuthority, setCurrentAuthority] = useState<any>(null);
  const [hasCounselingAssign, setHasCounselingAssign] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasApprovalAuthority, setHasApprovalAuthority] = useState<boolean | undefined>(undefined);
  const [currentAuthorityId, setCurrentAuthorityId] = useState<number | null | undefined>(undefined);

  const [totalAssigned, setTotalAssigned] = useState(0);
  const [totalCounseled, setTotalCounseled] = useState(0);
  const [totalApproved, setTotalApproved] = useState(0);

  // Bulk select state
  const [selectedResultIds, setSelectedResultIds] = useState<number[]>([]);

  // Approval modal
  const [approvalModal, setApprovalModal] = useState<{
    open: boolean;
    resultIds: number[];
    loading: boolean;
    error: string;
  }>({ open: false, resultIds: [], loading: false, error: "" });

  // Forward modal
  const [forwardModal, setForwardModal] = useState<{
    open: boolean;
    loading: boolean;
    error: string;
  }>({ open: false, loading: false, error: "" });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingResult, setDeletingResult] = useState<AtwAssessmentCounselingResult | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await atwAssessmentCounselingResultService.getAllResults({
        course_id: courseId,
        semester_id: semesterId,
        per_page: 1000
      });

      if (response.data.length > 0) {
        setResults(response.data);
        setSelectedResultIds([]);

        // Load approvals filtered by this course and semester
        const approvalsParams: any = {
          course_id: courseId,
          semester_id: semesterId,
          allData: true,
        };

        const approvalsRes = await atwCounselingCadetApprovalService.getApprovals(approvalsParams);
        setApprovals(approvalsRes.data);

        // Fetch semester approvals to check forward status
        const semesterAppRes = await atwCounselingSemesterApprovalService.getApprovals(approvalsParams);
        if (semesterAppRes.data && semesterAppRes.data.length > 0) {
          setSemesterApprovals(semesterAppRes.data);
          const myApproval = user?.id
            ? semesterAppRes.data.find((a) => a.forwarded_by === user.id)
            : null;
          setSemesterApproval(myApproval || null);
        } else {
          setSemesterApprovals([]);
          setSemesterApproval(null);
        }

        // Fetch grouped info to get total assigned count
        const groupedRes = await atwAssessmentCounselingResultService.getGroupedResults({
          course_id: courseId,
          semester_id: semesterId,
          authority_id: currentAuthorityId || undefined,
          allData: true
        });

        // Use casting to any to avoid TS error on dynamic properties
        const myRow = (groupedRes.data as any[]).find((r: any) => r.course_id === courseId && r.semester_id === semesterId);
        if (myRow) {
          setTotalAssigned(myRow.total_cadets || 0);
          setTotalCounseled(myRow.total_counseled || 0);
          setTotalApproved(myRow.total_approved || 0);
        }

      } else {
        setError("No counseling results found for this course and semester");
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId, user?.id, currentAuthorityId]);

  useEffect(() => {
    if (currentAuthorityId !== undefined) loadData();
  }, [loadData, currentAuthorityId]);

  useEffect(() => {
    const checkAuthority = async () => {
      if (!user) return;
      try {
        const res = await atwCounselingApprovalAuthorityService.getAuthorities({ allData: true, is_active: true });
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
            setCurrentAuthorityId(auth.id);
            setCurrentAuthority(auth);
          } else {
            setHasApprovalAuthority(false);
            setCurrentAuthorityId(null);
            setCurrentAuthority(null);
          }
        }

        // Check if user has counseling assignment
        const assigns = await atwUserAssignService.getAll({ user_id: user.id });
        setHasCounselingAssign(assigns.counseling.length > 0);

      } catch (err) {
        console.error("Failed to fetch approval authorities:", err);
      }
    };
    checkAuthority();
  }, [user]);

  // --- Helpers ---
  const visibleAuthorities = currentAuthority
    ? allAuthorities.filter((a) => Number(a.sort) <= Number(currentAuthority.sort))
    : allAuthorities;

  const getResultApproval = (cadetId: number, authId: number): AtwCounselingCadetApproval | undefined =>
    approvals.find((a) => Number(a.cadet_id) === Number(cadetId) && Number(a.authority_id) === Number(authId));

  const getCurrentResultApproval = (result: AtwAssessmentCounselingResult): boolean => {
    if (!currentAuthorityId) return false;
    const cadets = result.result_cadets ?? [];
    if (cadets.length === 0) return false;
    // For a batch result, we check if ALL cadets in that batch are approved by the current authority
    return cadets.every(c =>
      approvals.some(a =>
        Number(a.cadet_id) === Number(c.cadet_id) &&
        Number(a.authority_id) === Number(currentAuthorityId) &&
        a.status === "approved"
      )
    );
  };

  const canCurrentAuthorityApprove = (result: AtwAssessmentCounselingResult): boolean => {
    if (!currentAuthority || allAuthorities.length === 0) return false;

    const currentSort = Number(currentAuthority.sort);

    // Find authorities with lower sort values
    const lowerAuthorities = allAuthorities
      .filter(a => Number(a.sort) < currentSort)
      .sort((a, b) => Number(a.sort) - Number(b.sort));

    // If there are no lower authorities, it's the first level, so can approve
    if (lowerAuthorities.length === 0) return true;

    // Get the immediately preceding authority (highest sort among lower authorities)
    const prevAuthority = lowerAuthorities[lowerAuthorities.length - 1];

    // Check if the previous authority has forwarded the semester
    const hasBeenForwardedByPrev = semesterApprovals.some(sa =>
      Number(sa.current_authority_id) === Number(prevAuthority.id)
    );

    if (!hasBeenForwardedByPrev) return false;

    // Check if ALL cadets in this batch are approved by the previous authority
    const cadets = result.result_cadets ?? [];
    if (cadets.length === 0) return false;

    return cadets.every(c =>
      approvals.some(a =>
        Number(a.cadet_id) === Number(c.cadet_id) &&
        Number(a.authority_id) === Number(prevAuthority.id) &&
        a.status === "approved"
      )
    );
  };

  const isBatchPendingForMe = (result: AtwAssessmentCounselingResult): boolean => {
    if (!currentAuthorityId) return false;
    const cadets = result.result_cadets ?? [];
    if (cadets.length === 0) return false;
    // Check if ALL cadets in this batch have a 'pending' record for the current authority
    return cadets.every(c => 
      approvals.some(a => 
        Number(a.cadet_id) === Number(c.cadet_id) && 
        Number(a.authority_id) === Number(currentAuthorityId) && 
        a.status === "pending"
      )
    );
  };

  const pendingResultIds = results
    .filter((res) => isBatchPendingForMe(res) && !canCurrentAuthorityApprove(res))
    .map((res) => res.id);

  const canForwardSemester =
    totalAssigned > 0 &&
    totalAssigned === totalCounseled &&
    totalAssigned === totalApproved;

  const allPendingSelected =
    pendingResultIds.length > 0 &&
    pendingResultIds.every((id) => selectedResultIds.includes(id));

  const toggleResult = (resultId: number) => {
    const res = results.find(r => r.id === resultId);
    if (!res) return;
    const isPendingForMe = isBatchPendingForMe(res);
    const canApprove = canCurrentAuthorityApprove(res);
    if (!isPendingForMe || canApprove) return;
    setSelectedResultIds((prev) =>
      prev.includes(resultId) ? prev.filter((id) => id !== resultId) : [...prev, resultId]
    );
  };

  const toggleSelectAll = () =>
    setSelectedResultIds(allPendingSelected ? [] : pendingResultIds);

  const openApprovalModal = (resultIds: number[]) =>
    setApprovalModal({ open: true, resultIds, loading: false, error: "" });

  const confirmApproval = async () => {
    if (!currentAuthorityId) return;
    setApprovalModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const resultsToApprove = results.filter(r => approvalModal.resultIds.includes(r.id));

      await Promise.all(
        resultsToApprove.flatMap(res =>
          (res.result_cadets ?? []).map(async (c) => {
            const approval = approvals.find(a => a.cadet_id === c.cadet_id && a.authority_id === currentAuthorityId);
            if (approval) {
              await atwCounselingCadetApprovalService.update(approval.id, {
                status: "approved",
                approved_by: user?.id,
                approved_date: new Date().toISOString(),
              });
            } else {
              await atwCounselingCadetApprovalService.store({
                course_id: courseId,
                semester_id: semesterId,
                program_id: res.program_id,
                branch_id: res.branch_id,
                cadet_id: c.cadet_id,
                status: "approved",
                approved_by: user?.id,
                approved_date: new Date().toISOString(),
                authority_id: currentAuthorityId,
              });
            }
          })
        )
      );

      setApprovalModal((prev) => ({ ...prev, open: false, loading: false }));
      await loadData();
    } catch (err: any) {
      setApprovalModal((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || "Failed to approve. Please try again.",
      }));
    }
  };

  const confirmForward = async () => {
    setForwardModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      await atwCounselingSemesterApprovalService.store({
        course_id: courseId,
        semester_id: semesterId,
        status: "pending",
        forwarded_by: user?.id || undefined,
        forwarded_at: new Date().toISOString(),
        current_authority_id: currentAuthorityId || undefined,
      } as any);
      setForwardModal({ open: false, loading: false, error: "" });
      await loadData();
    } catch (err: any) {
      setForwardModal((prev) => ({ ...prev, loading: true, error: err?.message || "Failed to forward." }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddCounseling = () => {
    router.push("/atw/assessments/counselings/results/create");
  };

  const handleEdit = (result: AtwAssessmentCounselingResult) => {
    router.push(`/atw/assessments/counselings/results/${result.id}/edit`);
  };

  const handleView = (result: AtwAssessmentCounselingResult) => {
    router.push(`/atw/assessments/counselings/results/${result.id}`);
  };

  const handleDelete = (result: AtwAssessmentCounselingResult) => {
    setDeletingResult(result);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingResult) return;
    try {
      setDeleteLoading(true);
      await atwAssessmentCounselingResultService.deleteResult(deletingResult.id);
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

  const isLowestAuthority = currentAuthority && allAuthorities.length > 0 &&
    Number(currentAuthority.sort) === Math.min(...allAuthorities.map(a => Number(a.sort)));

  const canApproveAny = hasApprovalAuthority && results.some(res => isBatchPendingForMe(res) && !canCurrentAuthorityApprove(res));
  const canEditOrDeleteAny = isLowestAuthority && hasCounselingAssign && !semesterApproval;

  const columns: Column<AtwAssessmentCounselingResult>[] = [
    ...(canApproveAny ? [{
      key: "selection",
      header: (
        <input
          type="checkbox"
          checked={allPendingSelected}
          onChange={toggleSelectAll}
          className="w-4 h-4 rounded cursor-pointer no-print"
        />
      ),
      headerAlign: "center" as const,
      className: "text-center no-print",
      render: (res: AtwAssessmentCounselingResult) => {
        const isPendingForMe = isBatchPendingForMe(res);
        const canApprove = canCurrentAuthorityApprove(res);
        return (
          <input
            type="checkbox"
            checked={selectedResultIds.includes(res.id)}
            disabled={!isPendingForMe || canApprove}
            onChange={() => toggleResult(res.id)}
            className="w-4 h-4 rounded cursor-pointer no-print disabled:opacity-40"
          />
        );
      },
    }] : []),
    {
      key: "id",
      header: "SL.",
      headerAlign: "center" as const,
      className: "text-center",
      render: (_, index) => index + 1
    },
    {
      key: "counseling_type",
      header: "Counseling",
      className: "font-bold text-gray-900",
      render: (res) => (
        <div className="flex flex-col">
          <span>{res.counseling_type?.type_name || "—"}</span>
          <span className="text-[10px] text-gray-400 font-mono uppercase">{res.counseling_type?.type_code}</span>
        </div>
      )
    },
    {
      key: "date",
      header: "Counseling Date",
      render: (res) => res.counseling_date ? new Date(res.counseling_date).toLocaleDateString("en-GB") : "—"
    },
    {
      key: "instructor",
      header: "Counselor",
      className: "font-medium text-blue-600",
      render: (res) => (
        <div>
          <div>{res.instructor?.name || "—"}</div>
          <div className="text-xs text-gray-500 font-mono uppercase">{res.instructor?.service_number}</div>
        </div>
      )
    },
    {
      key: "course",
      header: "Course",
      render: (res) => res.course?.name || "—"
    },
    {
      key: "semester",
      header: "Semester",
      render: (res) => res.semester?.name || "—"
    },
    {
      key: "program",
      header: "Program",
      render: (res) => res.program?.name || "—"
    },
    {
      key: "branch",
      header: "Branch",
      render: (res) => res.branch?.name || "—"
    },
    {
      key: "approval_status",
      header: "Status",
      className: "no-print",
      render: (res) => (
        <div className="flex flex-col gap-1 min-w-[120px]">
          {visibleAuthorities.map((auth) => {
            // For batch, we check if all cadets are approved
            const isApproved = (res.result_cadets ?? []).every(c =>
              approvals.find(a => a.cadet_id === c.cadet_id && a.authority_id === auth.id)?.status === "approved"
            );
            return (
              <div key={`status-${res.id}-${auth.id}`} className="flex items-center justify-between gap-2 border-b border-gray-100 last:border-0 pb-1">
                <span className="text-[9px] font-medium text-gray-500 uppercase">{auth.role?.name || "Auth"}:</span>
                {isApproved ? (
                  <span className="text-[9px] font-bold text-green-600 flex items-center gap-0.5">
                    <Icon icon="hugeicons:checkmark-circle-02" className="w-2.5 h-2.5" /> Approved
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-yellow-600 flex items-center gap-0.5">
                    <Icon icon="hugeicons:clock-01" className="w-2.5 h-2.5" /> Pending
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )
    },
    ...(canApproveAny || canEditOrDeleteAny ? [{
      key: "actions",
      header: "Action",
      headerAlign: "center" as const,
      className: "text-center no-print",
      render: (res: AtwAssessmentCounselingResult) => {
        const isPendingForMe = isBatchPendingForMe(res);
        const canApprove = canCurrentAuthorityApprove(res);
        return (
          <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
            {hasApprovalAuthority && isPendingForMe && !canApprove && (
              <button
                onClick={() => openApprovalModal([res.id])}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded shadow-sm transition-all active:scale-95"
                title="Approve Batch"
              >
                <Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3" />
                Approve
              </button>
            )}
            
            {/* Show Edit/Delete only for the lowest authority and only if they haven't forwarded yet */}
            {canEditOrDeleteAny && (
              <div className="flex items-center gap-1 border-l border-gray-100 pl-2">
                <button onClick={() => handleEdit(res)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-all" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(res)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-all" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        );
      }
    }] : [])
  ];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || results.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-medium">{error || "Results not found"}</p>
          <button
            onClick={() => router.push("/atw/assessments/counselings/results")}
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
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => history.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          {/* Add Result Button */}
          {can("add") && hasCounselingAssign && !semesterApproval && (
            <button
              onClick={handleAddCounseling}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shadow-md active:scale-95"
            >
              <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
              Add Counseling
            </button>
          )}

          {/* Detailed Counts - Visible only to authorities */}
          {hasApprovalAuthority && (
            <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-50 rounded-lg border border-gray-200 mr-2">
              <div className="flex justify-center items-center gap-1">
                <span className="text-[9px] text-gray-500 font-bold uppercase">Assigned</span>
                <span className="text-sm font-black text-gray-900">{totalAssigned}</span>
              </div>
              <div className="w-px h-6 bg-gray-200"></div>
              <div className="flex justify-center items-center gap-1">
                <span className="text-[9px] text-blue-500 font-bold uppercase">Counseled</span>
                <span className="text-sm font-black text-blue-600">{totalCounseled}</span>
              </div>
              <div className="w-px h-6 bg-gray-200"></div>
              <div className="flex justify-center items-center gap-1">
                <span className="text-[9px] text-green-500 font-bold uppercase">Approved</span>
                <span className="text-sm font-black text-green-600">{totalApproved}</span>
              </div>
            </div>
          )}

          {/* Bulk approve button */}
          {selectedResultIds.length > 0 && (
            <button
              onClick={() => openApprovalModal(selectedResultIds)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
            >
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              Approve Selected ({selectedResultIds.length})
            </button>
          )}

          {/* Forward button */}
          {hasApprovalAuthority && (
            semesterApproval && semesterApproval.forwarded_by === user?.id ? (
              <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg border border-gray-200 flex items-center gap-2 text-sm font-medium">
                <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4 text-green-500" />
                Forwarded to higher authority
              </span>
            ) : (
              <button
                onClick={() => setForwardModal({ open: true, loading: false, error: "" })}
                disabled={!canForwardSemester}
                title={totalAssigned === 0 ? "No cadets assigned" : totalAssigned !== totalCounseled ? "All assigned cadets must have results before forwarding" : totalAssigned !== totalApproved ? "All cadets must be approved by you before forwarding" : "Forward to next authority"}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
                <Icon icon="hugeicons:arrow-right-double" className="w-4 h-4" />
                Forward
              </button>
            )
          )}
        </div>
      </div>

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
            ATW Counseling Assessment Summary Sheet
          </p>
        </div>

        {/* Counseling Matrix Section */}
        <div className="mb-6">
          <DataTable
            columns={columns}
            data={results}
            keyExtractor={(res) => res.id.toString()}
            onRowClick={handleView}
            emptyMessage="No counseling records found"
          />
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      <Modal isOpen={approvalModal.open} onClose={() => setApprovalModal((p) => ({ ...p, open: false }))} showCloseButton className="max-w-sm">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Approve Counseling Batch{approvalModal.resultIds.length > 1 ? "es" : ""}</h2>
          <p className="text-sm text-gray-500 mb-4">
            Approve <span className="font-semibold text-gray-700">{approvalModal.resultIds.length}</span> batch{approvalModal.resultIds.length > 1 ? "es" : ""}?
            This action cannot be undone.
          </p>
          {approvalModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {approvalModal.error}
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setApprovalModal((p) => ({ ...p, open: false }))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={confirmApproval}
              disabled={approvalModal.loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
            >
              {approvalModal.loading
                ? <><Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />Approving...</>
                : <><Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />Approve</>
              }
            </button>
          </div>
        </div>
      </Modal>

      {/* Forward Confirmation Modal */}
      <Modal isOpen={forwardModal.open} onClose={() => setForwardModal((p) => ({ ...p, open: false }))} showCloseButton className="max-w-sm">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Forward Results</h2>
          <p className="text-sm text-gray-500 mb-4">
            All batches have been approved. Do you want to forward these results to the next authority?
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

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Counseling Record"
        message={`Are you sure you want to delete this counseling record batch? This will also delete all associated cadet remarks. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
