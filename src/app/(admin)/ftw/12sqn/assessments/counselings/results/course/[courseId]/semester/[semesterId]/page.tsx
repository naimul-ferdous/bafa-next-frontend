/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnAssessmentCounselingResultService } from "@/libs/services/ftw12sqnAssessmentCounselingResultService";
import { ftw12sqnCounselingCadetApprovalService } from "@/libs/services/ftw12sqnCounselingCadetApprovalService";
import { ftw12sqnCounselingSemesterApprovalService } from "@/libs/services/ftw12sqnCounselingSemesterApprovalService";
import { ftw12sqnUserAssignService } from "@/libs/services/ftw12sqnUserAssignService";
import { useAuth } from "@/context/AuthContext";
import { useCan } from "@/context/PagePermissionsContext";
import FullLogo from "@/components/ui/fulllogo";
import type { Ftw12SqnAssessmentCounselingResult } from "@/libs/types/ftw12sqnAssessmentCounseling";
import type { Ftw12SqnCounselingCadetApproval } from "@/libs/types/ftw12sqnCounselingCadetApproval";
import type { Ftw12SqnCounselingSemesterApproval } from "@/libs/types/ftw12sqnCounselingSemesterApproval";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { Modal } from "@/components/ui/modal";

export default function CounselingCourseSemesterResultPage({ params }: { params: Promise<{ courseId: string; semesterId: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const can = useCan("/ftw/12sqn/assessments/counselings/results");
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.courseId);
  const semesterId = parseInt(resolvedParams.semesterId);

  const [results, setResults] = useState<Ftw12SqnAssessmentCounselingResult[]>([]);
  const [approvals, setApprovals] = useState<Ftw12SqnCounselingCadetApproval[]>([]);
  const [semesterApprovals, setSemesterApprovals] = useState<Ftw12SqnCounselingSemesterApproval[]>([]);
  const [semesterApproval, setSemesterApproval] = useState<Ftw12SqnCounselingSemesterApproval | null>(null);
  const [allAuthorities, setAllAuthorities] = useState<any[]>([]);
  const [allCadets, setAllCadets] = useState<any[]>([]);
  const [hasCounselingAssign, setHasCounselingAssign] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Derive current authority client-side from user roles.
  // If the user's primary role is "instructor" AND they have a merged role
  // (is_marge_role=true, is_role_switch=false), that merged role is also checked
  // against the authority list so instructors with an authority role are found.
  const currentAuthority = useMemo(() => {
    if (!allAuthorities.length || !user) return null;
    const userRoles = (user as any)?.roles ?? [];
    const primaryRole = userRoles.find((r: any) => r.pivot?.is_primary);
    const isPrimaryInstructor = primaryRole?.slug === 'instructor';
    const roleIdsToCheck: number[] = [];
    if (primaryRole?.id) roleIdsToCheck.push(Number(primaryRole.id));
    if (isPrimaryInstructor) {
      // Instructor's primary role has is_marge_role=true, meaning they can hold a
      // secondary authority role alongside it. Find non-primary roles where
      // is_role_switch=false — those are the actual authority roles (e.g. ATW CIC).
      userRoles
        .filter((r: any) => !r.pivot?.is_primary && r.is_role_switch === false)
        .forEach((r: any) => roleIdsToCheck.push(Number(r.id)));
    }
    return allAuthorities.find((a: any) =>
      (a.user_id && Number(a.user_id) === Number(user.id)) ||
      (a.role_id && roleIdsToCheck.includes(Number(a.role_id)))
    ) ?? null;
  }, [allAuthorities, user]);

  const currentAuthorityId: number | null = currentAuthority?.id ?? null;
  const hasApprovalAuthority: boolean = !!currentAuthority;

  const [totalAssigned, setTotalAssigned] = useState(0);
  const [totalCounseled, setTotalCounseled] = useState(0);
  const [totalApproved, setTotalApproved] = useState(0);

  // Search
  const [search, setSearch] = useState("");

  // Bulk select state
  const [selectedResultIds, setSelectedResultIds] = useState<number[]>([]);

  // Approval modal
  const [approvalModal, setApprovalModal] = useState<{
    open: boolean;
    resultIds: number[];
    status: "approved" | "rejected";
    rejectedReason: string;
    loading: boolean;
    error: string;
  }>({ open: false, resultIds: [], status: "approved", rejectedReason: "", loading: false, error: "" });

  // Forward modal
  const [forwardModal, setForwardModal] = useState<{
    open: boolean;
    loading: boolean;
    error: string;
  }>({ open: false, loading: false, error: "" });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingResult, setDeletingResult] = useState<Ftw12SqnAssessmentCounselingResult | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await ftw12sqnAssessmentCounselingResultService.getConsolidatedResults({
        course_id: courseId,
        semester_id: semesterId,
      });

      if (response) {
        setResults(response.results || []);
        setApprovals(response.approvals || []);
        setSemesterApprovals(response.semester_approvals || []);
        setAllAuthorities(response.authorities || []);
        setAllCadets(response.assigned_cadets || []);

        setTotalAssigned(response.stats?.total_cadets ?? 0);
        setTotalCounseled(response.stats?.total_counseled ?? 0);
        setTotalApproved(response.stats?.total_approved ?? 0);

        setSelectedResultIds([]);

        if ((response.semester_approvals || []).length > 0 && user?.id) {
          const myApproval = response.semester_approvals.find((a: any) => a.forwarded_by === user.id);
          setSemesterApproval(myApproval || null);
        } else {
          setSemesterApproval(null);
        }

        const assigns = await ftw12sqnUserAssignService.getAll({ user_id: user?.id });
        setHasCounselingAssign(assigns.counseling.length > 0);

        if (!response.results || response.results.length === 0) {
          setError("No counseling results found for this course and semester");
        }
      } else {
        setError("Failed to load consolidated report data");
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Helpers ---
  const visibleAuthorities = allAuthorities;

  const lowerAuthority = currentAuthority
    ? allAuthorities.filter(a => Number(a.sort) < Number(currentAuthority.sort)).sort((a, b) => Number(b.sort) - Number(a.sort))[0]
    : null;

  const higherAuthority = currentAuthority
    ? allAuthorities.filter(a => Number(a.sort) > Number(currentAuthority.sort)).sort((a, b) => Number(a.sort) - Number(b.sort))[0]
    : null;

  const isBatchPendingForMe = (result: Ftw12SqnAssessmentCounselingResult): boolean => {
    if (!currentAuthorityId) return false;
    const cadets = result.result_cadets ?? [];
    if (cadets.length === 0) return false;
    return cadets.every(c =>
      approvals.some(a =>
        Number(a.cadet_id) === Number(c.cadet_id) &&
        Number(a.authority_id) === Number(currentAuthorityId) &&
        a.status === "pending"
      )
    );
  };

  const canCurrentAuthorityApprove = (result: Ftw12SqnAssessmentCounselingResult): boolean => {
    if (!currentAuthority || allAuthorities.length === 0) return false;

    // Sort all authorities by sort order; find where the current authority sits (0-indexed)
    const sortedAuthorities = [...allAuthorities].sort((a, b) => Number(a.sort) - Number(b.sort));
    const myPosition = sortedAuthorities.findIndex(a => Number(a.id) === Number(currentAuthority.id));

    if (myPosition === 0) return true; // Lowest authority can always approve

    // For higher authorities: require that enough forwardings have happened.
    // Each forwarding record represents one level completing their work.
    // Position N requires at least N forwarding records.
    // Also check via current_authority_id if available (new records have it).
    const prevAuthority = sortedAuthorities[myPosition - 1];
    const hasBeenForwardedByPrev =
      semesterApprovals.some(sa =>
        sa.current_authority_id
          ? Number(sa.current_authority_id) === Number(prevAuthority.id)
          : semesterApprovals.length >= myPosition
      );

    if (!hasBeenForwardedByPrev) return false;

    // Also verify the previous authority has actually approved all cadets in this result
    const cadets = result.result_cadets ?? [];
    if (cadets.length === 0) return false;
    return cadets.every(c =>
      approvals.some(a => Number(a.cadet_id) === Number(c.cadet_id) && Number(a.authority_id) === Number(prevAuthority.id) && a.status === "approved")
    );
  };

  // Check if current authority has already approved any cadet in this result
  const isAlreadyApprovedByMe = (result: any): boolean => {
    if (!currentAuthorityId) return false;
    const cadets = result.result_cadets ?? [];
    return cadets.some((c: any) =>
      approvals.some(a =>
        Number(a.cadet_id) === Number(c.cadet_id) &&
        Number(a.authority_id) === Number(currentAuthorityId) &&
        a.status === "approved"
      )
    );
  };

  // Results that the current authority can still approve (forwarded from below, not yet approved by me, not yet forwarded by me)
  const pendingResultIds = !semesterApproval
    ? results
      .filter((res) => canCurrentAuthorityApprove(res) && !isAlreadyApprovedByMe(res))
      .map((res) => res.id)
    : [];

  const canForwardSemester = totalAssigned > 0 && totalAssigned === totalCounseled && totalAssigned === totalApproved;
  const allPendingSelected = pendingResultIds.length > 0 && pendingResultIds.every((id) => selectedResultIds.includes(id));

  const toggleResult = (resultId: number) => {
    if (selectedResultIds.includes(resultId)) {
      setSelectedResultIds(prev => prev.filter(id => id !== resultId));
    } else {
      setSelectedResultIds(prev => [...prev, resultId]);
    }
  };

  const toggleSelectAll = () => setSelectedResultIds(allPendingSelected ? [] : pendingResultIds);

  const openApprovalModal = (resultIds: number[]) =>
    setApprovalModal({ open: true, resultIds, status: "approved", rejectedReason: "", loading: false, error: "" });

  const confirmApproval = async () => {
    if (!currentAuthorityId) return;
    if (approvalModal.status === "rejected" && !approvalModal.rejectedReason.trim()) {
      setApprovalModal((prev) => ({ ...prev, error: "Rejection reason is required." }));
      return;
    }
    setApprovalModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const resultsToApprove = results.filter(r => approvalModal.resultIds.includes(r.id));
      const cadets = resultsToApprove.flatMap(res =>
        (res.result_cadets ?? []).map(c => ({
          cadet_id: Number(c.cadet_id),
          course_id: courseId,
          semester_id: semesterId,
          program_id: res.program_id ?? undefined,
          branch_id: res.branch_id ?? undefined,
        }))
      );

      await ftw12sqnCounselingCadetApprovalService.bulkApprove({
        authority_id: currentAuthorityId!,
        status: approvalModal.status,
        approved_by: user?.id,
        approved_date: new Date().toISOString(),
        rejection_reason: approvalModal.rejectedReason || undefined,
        cadets,
      });

      setApprovalModal((prev) => ({ ...prev, open: false, loading: false }));
      await loadData();
    } catch (err: any) {
      setApprovalModal((prev) => ({ ...prev, loading: false, error: err?.message || "Failed to approve." }));
    }
  };

  const confirmForward = async () => {
    setForwardModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      await ftw12sqnCounselingSemesterApprovalService.store({
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

  const handleAddCounseling = () => router.push("/ftw/12sqn/assessments/counselings/results/create");
  const handleEdit = (result: Ftw12SqnAssessmentCounselingResult) => router.push(`/ftw/12sqn/assessments/counselings/results/${result.id}/edit`);
  const handleView = (result: Ftw12SqnAssessmentCounselingResult) => router.push(`/ftw/12sqn/assessments/counselings/results/${result.id}`);
  const handleDelete = (result: Ftw12SqnAssessmentCounselingResult) => { setDeletingResult(result); setDeleteModalOpen(true); };

  const confirmDelete = async () => {
    if (!deletingResult) return;
    try {
      setDeleteLoading(true);
      await ftw12sqnAssessmentCounselingResultService.deleteResult(deletingResult.id);
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

  // Check if any authority has any approval record for this result (blocks edit/delete)
  const hasAnyApproval = (result: any): boolean => {
    const cadets = result.result_cadets ?? [];
    return cadets.some((c: any) => approvals.some(a => Number(a.cadet_id) === Number(c.cadet_id)));
  };

  const canApproveAny = hasApprovalAuthority && !semesterApproval && pendingResultIds.length > 0;
  const canEditDeleteRow = (result: any): boolean =>
    !!isLowestAuthority && hasCounselingAssign && !semesterApproval && !hasAnyApproval(result);

  // Cadet IDs that already have a counseling result
  const resultCadetIds = new Set(
    results.flatMap(r => (r.result_cadets ?? []).map(rc => Number(rc.cadet_id)))
  );

  // Rows for cadets that DO have a counseling result
  const counseledRows = results.flatMap(res =>
    (res.result_cadets ?? []).map(rc => ({
      ...res,
      cadet_row: rc,
      virtual_id: `${res.id}-${rc.id}`,
      has_result: true,
    }))
  );

  // Rows for assigned cadets that have NO counseling result yet
  const uncounseledRows = allCadets
    .filter(c => !resultCadetIds.has(Number(c.id)))
    .map(c => ({
      id: -1,
      has_result: false,
      virtual_id: `no-result-${c.id}`,
      cadet_row: {
        id: -1,
        cadet_id: c.id,
        bd_no: c.cadet_number || '',
        is_present: false,
        is_active: true,
        ftw12sqn_assessment_counseling_result_id: -1,
        cadet: c,
      },
    }));

  const allFlattenedResults: any[] = [...counseledRows, ...uncounseledRows];

  const flattenedResults: any[] = search.trim()
    ? allFlattenedResults.filter(row => {
      const q = search.trim().toLowerCase();
      const rc = row.cadet_row;
      return (
        rc?.cadet?.name?.toLowerCase().includes(q) ||
        rc?.bd_no?.toLowerCase().includes(q) ||
        rc?.cadet?.cadet_number?.toLowerCase().includes(q)
      );
    })
    : allFlattenedResults;

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error && allCadets.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => router.push("/ftw/12sqn/assessments/counselings/results")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200 relative">
      {/* Authority Level Cards - Top Right */}
      {/* {currentAuthority && (
        <div className=" no-print flex flex-col gap-2 items-end z-10">
          {lowerAuthority && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 flex flex-col items-end gap-0.5 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Lower Authority</span>
              <span className="text-xs font-bold text-gray-600">{lowerAuthority.role?.name || lowerAuthority.user?.name || `Auth #${lowerAuthority.id}`}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] text-gray-400 font-medium">Sort: {lowerAuthority.sort}</span>
                <span className={`px-1 rounded-[3px] text-[8px] font-bold ${lowerAuthority.is_cadet_approve ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>Cdt Apprv</span>
                <span className={`px-1 rounded-[3px] text-[8px] font-bold ${lowerAuthority.is_final ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>Final</span>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex flex-col items-end gap-0.5 shadow-md transform hover:scale-[1.02] transition-transform">
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Icon icon="hugeicons:briefcase-02" className="w-2.5 h-2.5" />
              Your Authority Level
            </span>
            <span className="text-sm font-black text-blue-800 uppercase">{currentAuthority.role?.name || 'Authorized User'}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] text-blue-400 font-bold">Sort: {currentAuthority.sort}</span>
              <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-black uppercase ${currentAuthority.is_cadet_approve ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>Cdt Apprv</span>
              <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-black uppercase ${currentAuthority.is_final ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>Final</span>
            </div>
          </div>

          {higherAuthority && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 flex flex-col items-end gap-0.5 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Higher Authority</span>
              <span className="text-xs font-bold text-gray-600">{higherAuthority.role?.name || higherAuthority.user?.name || `Auth #${higherAuthority.id}`}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] text-gray-400 font-medium">Sort: {higherAuthority.sort}</span>
                <span className={`px-1 rounded-[3px] text-[8px] font-bold ${higherAuthority.is_cadet_approve ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>Cdt Apprv</span>
                <span className={`px-1 rounded-[3px] text-[8px] font-bold ${higherAuthority.is_final ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>Final</span>
              </div>
            </div>
          )}
        </div>
      )} */}

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
          {hasApprovalAuthority && canForwardSemester && !semesterApproval && (
            <button
              onClick={() => setForwardModal({ open: true, loading: false, error: "" })}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium"
            >
              <Icon icon="hugeicons:share-04" className="w-4 h-4" />
              Forward{higherAuthority ? ` to ${higherAuthority.role?.name || "Next"}` : ""}
            </button>
          )}
          {hasApprovalAuthority && semesterApproval && semesterApproval.forwarded_by === user?.id && (
            <span className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-green-50 text-green-700 border border-green-200">
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              Already Forwarded
            </span>
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
          <div className="mb-2">
            <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">
              Academic Training Wing
            </p>
            <div className="flex justify-center gap-1">
              {results.length > 0 && results[0].course?.name && (
                <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">
                  {results[0].course.name}
                </p>
              )}
              {results.length > 0 && results[0].semester?.name && (
                <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">
                  :{results[0].semester.name}
                </p>
              )}
            </div>
            {results.length > 0 && results[0].counseling_type?.type_name && (
              <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">
                {results[0].counseling_type.type_name}
              </p>
            )}
          </div>
        </div>

        {/* Search + Add bar */}
        <div className="flex items-center justify-between gap-3 mb-4 no-print">
          <div className="relative flex-1 max-w-sm">
            <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or BD No..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {can("add") && hasCounselingAssign && !semesterApproval && (
            <button
              onClick={handleAddCounseling}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shadow-sm active:scale-95 whitespace-nowrap"
            >
              <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
              Add Counseling
            </button>
          )}
        </div>

        {/* Counseling Matrix Section */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr>
                {canApproveAny && pendingResultIds.length > 0 && (
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle no-print">
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                      title="Select all pending"
                    />
                  </th>
                )}
                <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Ser</th>
                <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">BD/No</th>
                <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Rank</th>
                <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Name</th>
                <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Branch</th>
                <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Counselor</th>
                <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Counseling Date</th>
                <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle no-print">Status</th>
                <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle no-print">Action</th>
              </tr>
            </thead>
            <tbody>
              {flattenedResults.length === 0 ? (
                <tr>
                  <td colSpan={canApproveAny ? 12 : 10} className="border border-black px-4 py-8 text-center text-gray-500">
                    No counseling records found
                  </td>
                </tr>
              ) : (
                flattenedResults.map((row, index) => {
                  const rc = row.cadet_row;
                  const currentRank = rc?.cadet?.assigned_ranks?.find((r: any) => r.is_current);
                  const currentBranch = rc?.cadet?.assigned_branchs?.find((b: any) => b.is_current);
                  const canApprove = row.has_result && canCurrentAuthorityApprove(row);
                  const alreadyApprovedByMe = row.has_result && isAlreadyApprovedByMe(row);
                  const showApproveAction = canApprove && !alreadyApprovedByMe && !semesterApproval;

                  return (
                    <tr
                      key={row.virtual_id}
                      onClick={() => row.has_result && handleView(row as any)}
                      className={`${row.has_result ? "hover:bg-gray-50 cursor-pointer" : "bg-orange-50/30"}`}
                    >
                      {/* Checkbox */}
                      {canApproveAny && pendingResultIds.length > 0 && (
                        <td className="border border-black px-2 py-2 text-center no-print">
                          {showApproveAction && (
                            <input
                              type="checkbox"
                              checked={selectedResultIds.includes(row.id)}
                              disabled={!showApproveAction}
                              onChange={() => toggleResult(row.id)}
                              className="w-4 h-4 disabled:opacity-40"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </td>
                      )}

                      {/* Ser */}
                      <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                      {/* BD/No */}
                      <td className="border border-black px-2 py-2 text-center font-mono font-bold">
                        {rc?.bd_no || rc?.cadet?.cadet_number || "—"}
                      </td>
                      {/* Rank */}
                      <td className="border border-black px-2 py-2 text-center">
                        {currentRank?.rank?.name || "—"}
                      </td>
                      {/* Name */}
                      <td className="border border-black px-2 py-2 font-medium">
                        {rc?.cadet?.name || "—"}
                      </td>
                      {/* Branch */}
                      <td className="border border-black px-2 py-2 text-center">
                        {currentBranch?.branch?.name || "—"}
                      </td>

                      {row.has_result ? (
                        <>
                          {/* Counselor */}
                          <td className="border border-black px-2 py-2 text-center font-medium text-blue-700">
                            {row.instructor?.name || "—"}
                          </td>
                          {/* Counseling Date */}
                          <td className="border border-black px-2 py-2 text-center">
                            {row.counseling_date ? new Date(row.counseling_date).toLocaleDateString("en-GB") : "—"}
                          </td>
                          {/* Status */}
                          <td className="border border-black px-2 py-2 no-print">
                            <div className="flex flex-col gap-1">
                              {visibleAuthorities.map((auth: any) => {
                                const approval = approvals.find(
                                  (a) => a.cadet_id === rc.cadet_id && a.authority_id === auth.id
                                );
                                const isApproved = approval?.status === "approved";
                                const isMe = currentAuthority && auth.id === currentAuthority.id;
                                return (
                                  <div key={auth.id} className="flex items-center gap-1 pb-1 mb-1 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                                    <span className={`text-[9px] font-bold ${isMe ? "text-blue-600" : "text-gray-500"}`}>
                                      {auth.role?.name || "Auth"}{isMe ? " (Me)" : ""}:
                                    </span>
                                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase ${isApproved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                      {isApproved ? "Approved" : "Pending"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          {/* Action */}
                          <td className="border border-black px-2 py-2 text-center no-print" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              {hasApprovalAuthority && showApproveAction && (
                                <button
                                  onClick={() => openApprovalModal([row.id])}
                                  className="px-2 py-1 text-[10px] font-semibold bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => handleView(row as any)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="View"
                              >
                                <Icon icon="hugeicons:view" className="w-4 h-4" />
                              </button>
                              {canEditDeleteRow(row) && (
                                <>
                                  <button onClick={() => handleEdit(row as any)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
                                    <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDelete(row as any)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                                    <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </>
                      ) : (
                        /* colspan 4: Counselor + Date + Status + Action */
                        <td colSpan={4} className="border border-black px-3 py-2 text-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200 rounded-md">
                            <Icon icon="hugeicons:alert-circle" className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                            <span className="text-[10px] font-bold text-orange-600">Counseling not inputted</span>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={approvalModal.open}
        onClose={() => setApprovalModal((p) => ({ ...p, open: false }))}
        showCloseButton
        className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin"
      >
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="flex justify-center mb-2"><FullLogo /></div>
            <h1 className="text-lg font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
            <p className="text-sm font-medium text-gray-700 uppercase">Academic Training Wing</p>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {(() => {
              const total = results
                .filter(r => approvalModal.resultIds.includes(r.id))
                .reduce((acc, r) => acc + (r.result_cadets?.length ?? 0), 0);
              return total === 1 ? "Cadet Counseling Approval" : `Cadets Counseling Approval (${total} cadets)`;
            })()}
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Type: <span className="font-medium text-gray-700">
              {results.find(r => approvalModal.resultIds.includes(r.id))?.counseling_type?.type_name ?? "—"}
            </span>
          </p>

          {/* Cadets table */}
          {approvalModal.resultIds.length > 0 && (
            <div className="mb-4 overflow-x-auto rounded-lg border border-black">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr>
                    <th className="border border-l-0 border-t-0 border-black px-2 py-1 text-center align-middle">Ser</th>
                    <th className="border border-t-0 border-black px-2 py-1 text-center align-middle">BD/No</th>
                    <th className="border border-t-0 border-black px-2 py-1 text-center align-middle">Rank</th>
                    <th className="border border-t-0 border-black px-2 py-1 text-left align-middle font-bold">Name</th>
                    <th className="border border-t-0 border-black px-2 py-1 text-center align-middle">Branch</th>
                    <th className="border border-t-0 border-black px-2 py-1 text-center align-middle">Counselor</th>
                    <th className="border border-t-0 border-r-0 border-black px-2 py-1 text-center align-middle">Counseling Date</th>
                  </tr>
                </thead>
                <tbody>
                  {results
                    .filter(r => approvalModal.resultIds.includes(r.id))
                    .flatMap(r => (r.result_cadets ?? []).map(rc => ({ res: r, rc })))
                    .map(({ res, rc }, index, arr) => {
                      const isLast = index === arr.length - 1;
                      const lastCls = isLast ? "border-b-0" : "";
                      const currentRank = rc.cadet?.assigned_ranks?.find((rk: any) => rk.is_current);
                      const currentBranch = rc.cadet?.assigned_branchs?.find((b: any) => b.is_current);
                      return (
                        <tr key={`${res.id}-${rc.id}`} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                          <td className={`border border-l-0 border-black px-2 py-1 text-center ${lastCls}`}>{index + 1}</td>
                          <td className={`border border-black px-2 py-1 text-center font-mono ${lastCls}`}>{rc.bd_no || rc.cadet?.cadet_number || "—"}</td>
                          <td className={`border border-black px-2 py-1 text-center ${lastCls}`}>{currentRank?.rank?.name || "—"}</td>
                          <td className={`border border-black px-2 py-1 font-bold text-gray-900 ${lastCls}`}>{rc.cadet?.name || "—"}</td>
                          <td className={`border border-black px-2 py-1 text-center ${lastCls}`}>{currentBranch?.branch?.name || "—"}</td>
                          <td className={`border border-black px-2 py-1 text-center ${lastCls}`}>{res.instructor?.name || "—"}</td>
                          <td className={`border border-r-0 border-black px-2 py-1 text-center ${lastCls}`}>
                            {res.counseling_date ? new Date(res.counseling_date).toLocaleDateString("en-GB") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* Status selector */}
          <div className="flex gap-3 mb-4">
            {(["approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setApprovalModal((prev) => ({ ...prev, status: s, rejectedReason: "", error: "" }))}
                className={`flex-1 py-2 rounded-lg border text-sm font-semibold capitalize transition-colors ${approvalModal.status === s
                    ? s === "approved"
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-red-600 text-white border-red-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {s === "approved" ? "✓ Approve" : "✗ Reject"}
              </button>
            ))}
          </div>

          {/* Rejection reason */}
          {approvalModal.status === "rejected" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={approvalModal.rejectedReason}
                onChange={(e) => setApprovalModal((prev) => ({ ...prev, rejectedReason: e.target.value }))}
                placeholder="Enter rejection reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            </div>
          )}

          {approvalModal.error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {approvalModal.error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 mt-2">
            <button
              onClick={() => setApprovalModal((p) => ({ ...p, open: false }))}
              disabled={approvalModal.loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmApproval}
              disabled={approvalModal.loading}
              className={`px-6 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 ${approvalModal.status === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}
            >
              {approvalModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              {approvalModal.status === "approved" ? "Confirm Approve" : "Confirm Reject"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Forward Confirmation Modal */}
      <Modal isOpen={forwardModal.open} onClose={() => setForwardModal((p) => ({ ...p, open: false }))} showCloseButton className="max-w-lg">
        <div className="p-6">
          <div className="flex items-center gap-1 mb-4">
            <div className="flex items-center justify-center w-12 h-12">
              <FullLogo />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Forward to Higher Authority</h2>
              <p className="text-xs text-gray-500">ATW counseling result forwarding</p>
            </div>
          </div>

          {results.length > 0 && (
            <div className="mb-5 rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
              {([
                ["Course", results[0].course?.name || "—"],
                ["Semester", results[0].semester?.name || "—"],
                ["Counseling Type", results[0].counseling_type?.type_name || "—"],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex px-4 py-2.5">
                  <span className="w-36 text-gray-500 shrink-0">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          )}

          {currentAuthority && (
            <div className="flex justify-between items-center gap-2 mb-5">
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-1">Your Authority Level</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                    {currentAuthority.role?.name || "Authorized User"}
                  </span>
                </div>
              </div>
              <div>
                <Icon icon="hugeicons:arrow-right-02" className="w-5 h-5 text-blue-600 inline-block mx-2" />
              </div>
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-1">Next Authority Level</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                    {higherAuthority?.role?.name || "—"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-5">
            This will mark the counseling results as forwarded to the higher authority for further review and approval. This action records your approval at the semester level.
          </p>

          {forwardModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {forwardModal.error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
            <button
              onClick={() => setForwardModal((prev) => ({ ...prev, open: false }))}
              disabled={forwardModal.loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmForward}
              disabled={forwardModal.loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
            >
              {forwardModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              <Icon icon="hugeicons:share-04" className="w-4 h-4" />
              Confirm Forward
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
