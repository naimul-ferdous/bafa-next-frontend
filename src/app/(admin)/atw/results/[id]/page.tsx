/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { atwResultService } from "@/libs/services/atwResultService";
import { atwApprovalService } from "@/libs/services/atwApprovalService";
import { useAuth } from "@/context/AuthContext";
import FullLogo from "@/components/ui/fulllogo";
import type { AtwResult, AtwResultMarkCadetApproval } from "@/libs/types/atwResult";
import type { AtwSubjectsModuleMarksheetMark } from "@/libs/types/system";
import type { FilePrintType } from "@/libs/types/filePrintType";
import PrintTypeModal from "@/components/ui/modal/PrintTypeModal";
import { Modal } from "@/components/ui/modal";

export default function ResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;
  const { user } = useAuth();

  const [result, setResult] = useState<AtwResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);

  // Approval state
  const [selectedCadetIds, setSelectedCadetIds] = useState<number[]>([]);
  const [approvalModal, setApprovalModal] = useState<{
    open: boolean;
    cadetIds: number[];
    status: "approved" | "rejected";
    rejectedReason: string;
    loading: boolean;
    error: string;
  }>({ open: false, cadetIds: [], status: "approved", rejectedReason: "", loading: false, error: "" });

  const [forwardModal, setForwardModal] = useState<{
    open: boolean;
    loading: boolean;
    error: string;
  }>({ open: false, loading: false, error: "" });

  const [subjectApprovalModal, setSubjectApprovalModal] = useState<{
    open: boolean;
    status: "approved" | "rejected";
    rejectedReason: string;
    loading: boolean;
    error: string;
  }>({ open: false, status: "approved", rejectedReason: "", loading: false, error: "" });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await atwResultService.getResult(parseInt(resultId));
      if (data) {
        setResult(data);
        setSelectedCadetIds([]);
      } else {
        setError("Result not found");
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load result data");
    } finally {
      setLoading(false);
    }
  }, [resultId]);

  useEffect(() => {
    if (resultId) loadData();
  }, [resultId, loadData]);

  // --- Approval permission check ---
  const canApprove = (() => {
    const authorities = result?.approval_authorities ?? [];
    const userRoleIds = (user as any)?.roles?.filter((r: any) => r.pivot?.is_primary).map((r: any) => r.id) ?? [];
    const userId = user?.id;
    return authorities.some((a) => {
      const hasPermission = a.is_initial_cadet_approve || a.is_cadet_approve;
      if (!hasPermission) return false;
      if (a.user_id && a.user_id === userId) return true;
      if (a.role_id && userRoleIds.includes(a.role_id)) return true;
      return false;
    });
  })();

  const canInitialForward = (() => {
    const authorities = result?.approval_authorities ?? [];
    const userRoleIds = (user as any)?.roles?.filter((r: any) => r.pivot?.is_primary).map((r: any) => r.id) ?? [];
    const userId = user?.id;
    return authorities.some((a) => {
      if (!a.is_initial_cadet_approve || !a.is_active) return false;
      if (a.user_id && a.user_id === userId) return true;
      if (a.role_id && userRoleIds.includes(a.role_id)) return true;
      return false;
    });
  })();

  // Find the current user's matching authority entry (must be declared before allCadetsApproved)
  const myAuthority = (() => {
    const authorities = result?.approval_authorities ?? [];
    const userRoleIds = (user as any)?.roles?.filter((r: any) => r.pivot?.is_primary).map((r: any) => r.id) ?? [];
    const userId = user?.id;
    return authorities.find((a: any) =>
      (a.user_id && a.user_id === userId) || (a.role_id && userRoleIds.includes(a.role_id))
    ) ?? null;
  })();

  const getNextAuthority = useCallback(() => {
    const authorities = [...(result?.approval_authorities ?? [])]
      .filter(a => a.is_active)
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    
    if (!myAuthority) {
      // If user is instructor (initial), return the first non-initial authority
      return authorities.find(a => !a.is_initial_cadet_approve) || null;
    }
    
    // Find authorities with sort strictly greater than mine
    return authorities.find(a => (a.sort ?? 0) > (myAuthority.sort ?? 0)) || null;
  }, [result?.approval_authorities, myAuthority]);

  const allCadetsApproved = (() => {
    const cadets = result?.result_getting_cadets ?? [];
    if (cadets.length === 0) return false;
    const authorityId = (myAuthority as any)?.id;
    return cadets.every((c) => {
      // Check by authority_id first; fall back to null-authority records (backward compat)
      const approval =
        result?.cadet_approvals?.find((a) => a.cadet_id === c.cadet_id && a.authority_id === authorityId) ??
        (canInitialForward ? result?.cadet_approvals?.find((a) => a.cadet_id === c.cadet_id && !a.authority_id) : undefined);
      return approval?.status === "approved";
    });
  })();

  // Track if ALREADY forwarded to the NEXT authority in the chain
  const isForwardedToNext = (() => {
    const nextAuth = getNextAuthority();
    if (!nextAuth) return false;
    
    const cadets = result?.result_getting_cadets ?? [];
    if (cadets.length === 0) return false;
    
    // Check if ANY cadet has an approval record for the next authority
    return (result?.cadet_approvals ?? []).some(
      (a: any) => a.authority_id === nextAuth.id
    );
  })();

  // Find the subject approval record for the current user's authority
  const mySubjectApproval = myAuthority
    ? result?.subject_approvals?.find((sa) => sa.authority_id === (myAuthority as any).id)
    : null;

  // For UI: isForwarded means "has the process moved past the initial step"
  const isForwarded = (() => {
    const hasAnyForward = (result?.subject_approvals?.length ?? 0) > 0;
    if (!canInitialForward) return hasAnyForward;
    
    const nonInitialAuthorityIds = new Set(
      (result?.approval_authorities ?? []).filter((a: any) => !a.is_initial_cadet_approve).map((a: any) => a.id)
    );
    if (nonInitialAuthorityIds.size === 0) return hasAnyForward;
    const cadets = result?.result_getting_cadets ?? [];
    return cadets.some((c) =>
      (result?.cadet_approvals ?? []).some(
        (a: any) => a.cadet_id === c.cadet_id && nonInitialAuthorityIds.has(a.authority_id)
      )
    );
  })();

  // Non-initial approver: all cadets approved by their authority_id
  const allCadetsApprovedByMe = (() => {
    if (!myAuthority) return false;
    const cadets = result?.result_getting_cadets ?? [];
    if (cadets.length === 0) return false;
    return cadets.every((c) => {
      const a = result?.cadet_approvals?.find(
        (ap) => ap.cadet_id === c.cadet_id && ap.authority_id === (myAuthority as any).id
      );
      return a?.status === 'approved';
    });
  })();

  // For non-initial approvers: subject is approved BY THEM if their specific step is approved.
  const isSubjectApproved = mySubjectApproval?.status === 'approved';

  // Initial approver (is_initial_cadet_approve) can act BEFORE forwarding.
  // Non-initial cadet approver (is_cadet_approve only) can act ONLY AFTER being forwarded to.
  const canApproveAction = canApprove && (canInitialForward ? !isForwarded : (allCadetsApprovedByMe || !isForwardedToNext)) && !isSubjectApproved;

  // Show "Approve Subject" button logic for all authorities (Intermediate and Final)
  const canApproveSubject = canApprove && allCadetsApprovedByMe && !isForwardedToNext && !isSubjectApproved;

  // Show "Forward" button ONLY for the initial step (Instructor)
  const showForwardButton = canInitialForward && !isForwarded && allCadetsApproved;

  // Authorities visible to this user: their own step + all steps below (sort <=)
  const visibleAuthorities = myAuthority
    ? [...(result?.approval_authorities ?? [])]
        .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
        .filter((a: any) => (a.sort ?? 0) <= (myAuthority.sort ?? 0))
    : [];

  // --- Approval helpers ---
  const pendingCadetIds = result?.result_getting_cadets
    ?.filter((c) => {
      if (!myAuthority?.is_initial_cadet_approve && !myAuthority?.is_cadet_approve) return false;

      const authorityId = (myAuthority as any)?.id;
      const approval = myAuthority
        ? (result.cadet_approvals?.find((a) => a.cadet_id === c.cadet_id && a.authority_id === authorityId) ??
           (canInitialForward ? result.cadet_approvals?.find((a) => a.cadet_id === c.cadet_id && !a.authority_id) : undefined))
        : undefined;
      return !approval || approval.status === "pending";
    })
    .map((c) => c.cadet_id) ?? [];

  const allPendingSelected =
    pendingCadetIds.length > 0 &&
    pendingCadetIds.every((id) => selectedCadetIds.includes(id));

  const toggleCadet = (cadetId: number) => {
    setSelectedCadetIds((prev) =>
      prev.includes(cadetId) ? prev.filter((id) => id !== cadetId) : [...prev, cadetId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedCadetIds(allPendingSelected ? [] : pendingCadetIds);
  };

  const openApprovalModal = (cadetIds: number[]) => {
    setApprovalModal({ open: true, cadetIds, status: "approved", rejectedReason: "", loading: false, error: "" });
  };

  const confirmForward = async () => {
    if (!result) return;
    setForwardModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      // Correctly identify the NEXT authority relative to the current user's step
      const nextAuthority = getNextAuthority();

      if (!nextAuthority) {
        throw new Error("No next authority found in the chain.");
      }

      await atwApprovalService.approveSubject({
        course_id: result.course_id,
        semester_id: result.semester_id,
        program_id: result.program_id,

        subject_id: result.atw_subject_id,
        instructor_id: result.instructor_id,
        status: "pending",
        cadet_ids: result.result_getting_cadets?.map((c) => c.cadet_id) ?? [],
        authority_ids: [nextAuthority.id],
      });
      setForwardModal({ open: false, loading: false, error: "" });
      await loadData();
    } catch (err: any) {
      const msg = err?.message || "Failed to forward result.";
      setForwardModal((prev) => ({ ...prev, loading: false, error: msg }));
    }
  };

  const confirmSubjectApproval = async () => {
    if (!result) return;
    if (subjectApprovalModal.status === "rejected" && !subjectApprovalModal.rejectedReason.trim()) {
      setSubjectApprovalModal((prev) => ({ ...prev, error: "Rejected reason is required." }));
      return;
    }
    setSubjectApprovalModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const nextAuthority = getNextAuthority();

      await atwApprovalService.approveSubject({
        course_id: result.course_id,
        semester_id: result.semester_id,
        program_id: result.program_id,
        subject_id: result.atw_subject_id,
        instructor_id: result.instructor_id,
        status: subjectApprovalModal.status,
        rejected_reason: subjectApprovalModal.status === "rejected" ? subjectApprovalModal.rejectedReason : undefined,
        cadet_ids: result.result_getting_cadets?.map((c) => c.cadet_id) ?? [],
        authority_ids: nextAuthority ? [nextAuthority.id] : [],
      });

      setSubjectApprovalModal((prev) => ({ ...prev, open: false, loading: false }));
      await loadData();
    } catch (err: any) {
      const msg = err?.message || "Failed to update subject approval.";
      setSubjectApprovalModal((prev) => ({ ...prev, loading: false, error: msg }));
    }
  };

  const confirmApproval = async () => {
    if (!result) return;
    if (approvalModal.status === "rejected" && !approvalModal.rejectedReason.trim()) {
      setApprovalModal((prev) => ({ ...prev, error: "Rejected reason is required." }));
      return;
    }
    setApprovalModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      await atwApprovalService.approveCadets({
        course_id: result.course_id,
        semester_id: result.semester_id,
        program_id: result.program_id,

        subject_id: result.atw_subject_id,
        cadet_ids: approvalModal.cadetIds,
        authority_id: (myAuthority as any)?.id ?? null,
        status: approvalModal.status,
        rejected_reason: approvalModal.status === "rejected" ? approvalModal.rejectedReason : undefined,
      });
      setApprovalModal((prev) => ({ ...prev, open: false, loading: false }));
      await loadData();
    } catch (err: any) {
      const msg = err?.errors
        ? Object.values(err.errors).flat().join(" ")
        : err?.message || "Failed to update approval status.";
      setApprovalModal((prev) => ({ ...prev, loading: false, error: msg }));
    }
  };

  const handlePrintClick = () => {
    setIsPrintModalOpen(true);
  };

  const confirmPrint = (type: FilePrintType) => {
    setSelectedPrintType(type);
    setIsPrintModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Helper to get approval status for a cadet — scoped to the current user's authority step
  const getCadetApproval = (cadetId: number): AtwResultMarkCadetApproval | undefined => {
    if (!result?.cadet_approvals || !myAuthority) return undefined;
    const authorityId = (myAuthority as any).id;
    // Prefer exact authority_id match; fall back to null-authority for initial approver (backward compat)
    return (
      result.cadet_approvals.find((a) => a.cadet_id === cadetId && a.authority_id === authorityId) ??
      (canInitialForward ? result.cadet_approvals.find((a) => a.cadet_id === cadetId && !a.authority_id) : undefined)
    );
  };

  // Helper to get module info safely
  const getSubjectModule = () => result?.subject?.module || result?.subject || result?.atw_subject_module;

  // Group marks by type dynamically
  const getMarkGroups = () => {
    const subjectModule = getSubjectModule();
    if (!subjectModule?.marksheet?.marks) return {};
    const groups: { [key: string]: AtwSubjectsModuleMarksheetMark[] } = {};

    // Sort marks by ID to maintain consistent order
    const sortedMarks = [...subjectModule.marksheet.marks].sort((a, b) => a.id - b.id);

    sortedMarks.forEach(mark => {
      const type = mark.type?.toLowerCase() || "other";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(mark);
    });

    return groups;
  };

  const markGroups = getMarkGroups();
  const groupKeys = Object.keys(markGroups);

  // Get individual mark value
  const getCadetMark = (cadet: any, markId: number) => {
    const mark = cadet.cadet_marks?.find((m: any) => m.atw_subjects_module_marksheet_mark_id === markId);
    return parseFloat(String(mark?.achieved_mark || 0));
  };

  // Get individual weighted mark
  const getWeightedMark = (cadet: any, mark: AtwSubjectsModuleMarksheetMark) => {
    const obtained = getCadetMark(cadet, mark.id);
    const estimate = parseFloat(String(mark.estimate_mark || 0));
    const percentage = parseFloat(String(mark.percentage || 0));
    if (estimate === 0) return 0;
    return (obtained / estimate) * percentage;
  };

  // Calculate total marks for a cadet (sum of all weighted marks)
  const calculateTotalMarks = (cadet: any) => {
    const subjectModule = getSubjectModule();
    if (!subjectModule?.marksheet?.marks) return 0;
    return subjectModule.marksheet.marks.reduce((sum: number, mark: AtwSubjectsModuleMarksheetMark) => {
      return sum + getWeightedMark(cadet, mark);
    }, 0);
  };

  // Helper to determine colSpan for dynamic marks group
  const getGroupColSpan = (marks: AtwSubjectsModuleMarksheetMark[]) => {
    return marks.reduce((acc: number, m) => {
      const estimate = parseFloat(String(m.estimate_mark || 0));
      const percentage = parseFloat(String(m.percentage || 0));
      return acc + (estimate !== percentage ? 2 : 1);
    }, 0);
  };

  const subjectModule = getSubjectModule();
  const totalMaxMarks = subjectModule?.subjects_full_mark || 100;


  // Only show the weighted "Total Marks" column if at least one mark has estimate_mark !== percentage
  const hasWeightedLogic = Object.values(markGroups).some(marks =>
    marks.some(m => parseFloat(String(m.estimate_mark || 0)) !== parseFloat(String(m.percentage || 0)))
  );

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10" />
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "Result not found"}</p>
          <button
            onClick={() => router.push("/atw/results")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
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
            size: A3 landscape;
            margin: 14mm 10mm 14mm 10mm;

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
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => history.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          {canApproveAction && selectedCadetIds.length > 0 && (
            <button
              onClick={() => openApprovalModal(selectedCadetIds)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
            >
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              Approve Selected ({selectedCadetIds.length})
            </button>
          )}
          {showForwardButton && (
            <button
              onClick={() => setForwardModal({ open: true, loading: false, error: "" })}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium"
            >
              <Icon icon="hugeicons:share-04" className="w-4 h-4" />
              Forward {getNextAuthority() ? `to ${getNextAuthority()?.role?.name || getNextAuthority()?.user?.name || "Next"}` : ""}
            </button>
          )}
          {canInitialForward && isForwarded && (
            <span className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-green-50 text-green-700 border border-green-200">
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              Already Forwarded
            </span>
          )}
          {isSubjectApproved && !canInitialForward && canApprove && (
            <span className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-green-50 text-green-700 border border-green-200">
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              Subject Approved
            </span>
          )}
          {canApproveSubject && (
            <button
              onClick={() => setSubjectApprovalModal({ open: true, status: "approved", rejectedReason: "", loading: false, error: "" })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
            >
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              Approve Subject
            </button>
          )}
          <button
            onClick={handlePrintClick}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 cv-content">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <div className="mb-2">
            <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">Academic Training Wing</p>
            <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">
              {result.exam_type?.code} {result.semester?.name} Exam : {result.created_at ? new Date(result.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : ""}
            </p>
            <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">{result.course?.name} ({result.program?.name})</p>
            <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">Marks Sheet</p>
          </div>
        </div>

        {/* Cadets Marks Table */}
        {result.result_getting_cadets && result.result_getting_cadets.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <p>
                <span className="font-bold text-gray-900 uppercase mr-2">Subject</span>
                <span className="border-b border-dashed border-black">: {subjectModule?.subject_name || "N/A"} ({subjectModule?.subject_code || "N/A"})</span>
              </p>
              <p>
                <span className="font-bold text-gray-900 uppercase mr-2">Full Mark</span>
                <span className="border-b border-dashed border-black">: {totalMaxMarks || "N/A"}</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  {/* Header Row 1 */}
                  <tr>
                    {canApproveAction && pendingCadetIds.length > 0 && (
                      <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle no-print">
                        <input
                          type="checkbox"
                          checked={allPendingSelected}
                          onChange={toggleSelectAll}
                          disabled={pendingCadetIds.length === 0}
                          className="w-4 h-4"
                          title="Select all pending"
                        />
                      </th>
                    )}
                    <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">Ser</th>
                    <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">BD/No</th>
                    <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">Rank</th>
                    <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">Name</th>
                    <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">Branch</th>
                    <th colSpan={
                      groupKeys.reduce((acc, key) => acc + getGroupColSpan(markGroups[key]), 0)
                    } className="border border-black px-2 py-2 text-center">
                      Marks Obtained
                    </th>
                    {hasWeightedLogic && (
                      <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">
                        Total Marks<br />{totalMaxMarks}
                      </th>
                    )}
                    <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle no-print">
                      Status
                    </th>
                    {canApproveAction && (
                      <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle no-print">
                        Action
                      </th>
                    )}
                  </tr>
                  {/* Header Row 2 */}
                  <tr>
                    {groupKeys.map(key => (
                      <th key={key} colSpan={getGroupColSpan(markGroups[key])} className="border border-black px-2 py-1 text-center capitalize">
                        {key === 'classtest' ? 'Class Test' :
                          key === 'quiztest' ? 'Quiz Test' :
                            key === 'midsemester' ? 'Mid Semester' :
                              key === 'endsemester' ? 'End Semester' :
                                key.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                  </tr>
                  {/* Header Row 3 */}
                  <tr>
                    {groupKeys.map(key =>
                      markGroups[key].map(sm => {
                        const estimate = parseFloat(String(sm.estimate_mark || 0));
                        const percentage = parseFloat(String(sm.percentage || 0));
                        const isDiff = estimate !== percentage;
                        return isDiff ? (
                          <React.Fragment key={sm.id}>
                            <th className="border border-black px-2 py-1 text-center text-xs">{sm.name} <br /> ({estimate})</th>
                            <th className="border border-black px-2 py-1 text-center text-xs">{percentage}% of Obt. Mks.</th>
                          </React.Fragment>
                        ) : (
                          <th key={sm.id} className="border border-black px-2 py-1 text-center text-xs">{sm.name} <br /> ({estimate})</th>
                        );
                      })
                    )}
                  </tr>
                </thead>
                <tbody>
                  {result.result_getting_cadets.map((cadet, index) => {
                    const approval = getCadetApproval(cadet.cadet_id);
                    const isPending = !approval || approval.status === "pending";
                    return (
                      <tr key={cadet.id}>
                        {canApproveAction && pendingCadetIds.length > 0 && (
                          <td className="border border-black px-2 py-2 text-center no-print">
                            {isPending && (
                              <input
                                type="checkbox"
                                checked={selectedCadetIds.includes(cadet.cadet_id)}
                                onChange={() => toggleCadet(cadet.cadet_id)}
                                className="w-4 h-4"
                              />
                            )}
                          </td>
                        )}
                        <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                        <td className="border border-black px-2 py-2 text-center">{cadet.cadet_bd_no}</td>
                        <td className="border border-black px-2 py-2 text-center">
                          {cadet.cadet?.assigned_ranks?.[0]?.rank?.short_name || "-"}
                        </td>
                        <td className="border border-black px-2 py-2 font-medium">{cadet.cadet?.name || "N/A"}</td>
                        <td className="border border-black px-2 py-2 text-center">
                          {cadet.cadet?.assigned_branchs?.find((b: any) => b.is_current)?.branch?.name || 
                           cadet.cadet?.assigned_branchs?.[0]?.branch?.name || 
                           "N/A"}
                        </td>

                        {groupKeys.map(key =>
                          markGroups[key].map(sm => {
                            const estimate = parseFloat(String(sm.estimate_mark || 0));
                            const percentage = parseFloat(String(sm.percentage || 0));
                            const isDiff = estimate !== percentage;
                            return isDiff ? (
                              <React.Fragment key={sm.id}>
                                <td className="border border-black px-2 py-2 text-center">
                                  {cadet.is_present ? getCadetMark(cadet, sm.id).toFixed(2) : "—"}
                                </td>
                                <td className="border border-black px-2 py-2 text-center font-medium">
                                  {cadet.is_present ? getWeightedMark(cadet, sm).toFixed(2) : "—"}
                                </td>
                              </React.Fragment>
                            ) : (
                              <td key={sm.id} className="border border-black px-2 py-2 text-center">
                                {cadet.is_present ? getCadetMark(cadet, sm.id).toFixed(2) : "—"}
                              </td>
                            );
                          })
                        )}

                        {/* Total Marks */}
                        {hasWeightedLogic && (
                          <td className="border border-black px-2 py-2 text-center font-bold">
                            {cadet.is_present ? Math.ceil(calculateTotalMarks(cadet)) : "—"}
                          </td>
                        )}
                        {/* Approval Status — per-authority timeline, scoped to user's level */}
                        <td className="border border-black px-2 py-2 no-print">
                          {visibleAuthorities.length === 0 ? (
                            <span className="text-gray-400 text-xs">—</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {visibleAuthorities.map((authority: any, idx: number) => {
                                const label = authority.role?.name || authority.user?.name || `Step ${idx + 1}`;
                                const colors: Record<string, string> = {
                                  pending: "bg-yellow-100 text-yellow-800",
                                  approved: "bg-green-100 text-green-800",
                                  rejected: "bg-red-100 text-red-800",
                                };

                                let st: string | undefined;
                                if (authority.is_initial_cadet_approve) {
                                  // Initial step: prefer authority_id record, fall back to null-authority (backward compat)
                                  st =
                                    result.cadet_approvals?.find(
                                      (a) => a.cadet_id === cadet.cadet_id && a.authority_id === authority.id
                                    )?.status ??
                                    result.cadet_approvals?.find(
                                      (a) => a.cadet_id === cadet.cadet_id && !a.authority_id
                                    )?.status;
                                } else {
                                  // Non-initial step: per-cadet record for this authority,
                                  // fall back to subject-level approval status
                                  const perCadet = result.cadet_approvals?.find(
                                    (a) => a.cadet_id === cadet.cadet_id && a.authority_id === authority.id
                                  );
                                  const authSubjectApproval = result.subject_approvals?.find(sa => sa.authority_id === authority.id);
                                  st = perCadet?.status ?? authSubjectApproval?.status;
                                }

                                // Label variant: "Subject" for non-initial steps where only subject-level data exists
                                const authSubjectApproval = result.subject_approvals?.find(sa => sa.authority_id === authority.id);
                                const isSubjectLevel = !authority.is_initial_cadet_approve
                                  && !result.cadet_approvals?.find(
                                    (a) => a.cadet_id === cadet.cadet_id && a.authority_id === authority.id
                                  )
                                  && !!authSubjectApproval?.status;

                                return (
                                  <div key={authority.id} className="flex items-center gap-1 whitespace-nowrap">
                                    <span className="text-[9px] text-gray-500 truncate max-w-[80px]" title={label}>
                                      {label}{isSubjectLevel ? " (Subj)" : ""}:
                                    </span>
                                    {st ? (
                                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase ${colors[st] ?? ""}`}>
                                        {st}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-gray-300">—</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        {/* Action */}
                        {canApproveAction ? (
                          <td className="border border-black px-2 py-2 text-center no-print">
                            {isPending ? (
                              <button
                                onClick={() => openApprovalModal([cadet.cadet_id])}
                                className="px-2 py-1 text-[10px] font-semibold bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Approve
                              </button>
                            ) : approval?.status === "approved" ? (
                              <button
                                onClick={() => openApprovalModal([cadet.cadet_id])}
                                className="px-2 py-1 text-[10px] font-semibold bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                              >
                                Change
                              </button>
                            ) : (
                              <button
                                onClick={() => openApprovalModal([cadet.cadet_id])}
                                className="px-2 py-1 text-[10px] font-semibold bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                              >
                                Re-approve
                              </button>
                            )}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>{/* end overflow-x-auto */}

            {/* Approval Timeline — inside the table section, only for non-initial-cadet-approve users */}
            {!canInitialForward && result.approval_authorities && result.approval_authorities.length > 0 && (
              <div className="no-print mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Approval Progress</p>
                <div className="flex items-start flex-wrap gap-y-4">
                  {[...result.approval_authorities]
                    .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
                    .map((authority: any, index: number, arr: any[]) => {
                      const label = authority.role?.name || authority.user?.name || `Step ${index + 1}`;

                      let status: 'completed' | 'active' | 'pending' = 'pending';
                      let statusLabel = 'Pending';

                      if (authority.is_initial_cadet_approve) {
                        const total = result.result_getting_cadets?.length ?? 0;
                        // Count unique approved cadets at this authority step (authority_id match OR null for backward compat)
                        const approvedCadetIds = new Set(
                          result.cadet_approvals
                            ?.filter((a: any) =>
                              a.status === 'approved' &&
                              (a.authority_id === authority.id || !a.authority_id)
                            )
                            .map((a: any) => a.cadet_id) ?? []
                        );
                        const approved = approvedCadetIds.size;
                        if (total > 0 && approved >= total) {
                          status = 'completed';
                          statusLabel = `All ${total} Approved`;
                        } else if (approved > 0) {
                          status = 'active';
                          statusLabel = `${approved} / ${total} Approved`;
                        } else {
                          statusLabel = 'Not Started';
                        }
                      } else {
                        const total = result.result_getting_cadets?.length ?? 0;
                        const approvedCount = result.cadet_approvals?.filter(
                          (a: any) => a.status === 'approved' && a.authority_id === authority.id
                        ).length ?? 0;
                        
                        const authSubjectApproval = result.subject_approvals?.find(sa => sa.authority_id === authority.id);

                        if (approvedCount >= total && total > 0) {
                          status = 'completed';
                          statusLabel = `All ${total} Approved`;
                        } else if (approvedCount > 0 || authSubjectApproval?.forwarded_by) {
                          status = 'active';
                          statusLabel = approvedCount > 0 ? `${approvedCount} / ${total} Approved` : 'Under Review';
                        } else if (authSubjectApproval?.approved_by) {
                          status = 'completed';
                          statusLabel = 'Approved';
                        }
                      }

                      const dotCls =
                        status === 'completed' ? 'bg-green-500 text-white' :
                        status === 'active'    ? 'bg-blue-500 text-white' :
                                                'bg-gray-200 text-gray-400';
                      const labelCls =
                        status === 'completed' ? 'text-green-700' :
                        status === 'active'    ? 'text-blue-700' :
                                                'text-gray-400';
                      const lineCls =
                        status === 'completed' ? 'bg-green-400' : 'bg-gray-200';

                      return (
                        <div key={authority.id} className="flex items-center">
                          <div className="flex flex-col items-center w-28">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${dotCls}`}>
                              {status === 'completed' ? '✓' : index + 1}
                            </div>
                            <p className={`text-[10px] font-semibold mt-1 text-center leading-tight ${labelCls}`}>{label}</p>
                            <p className={`text-[10px] text-center leading-tight ${labelCls}`}>{statusLabel}</p>
                          </div>
                          {index < arr.length - 1 && (
                            <div className={`w-10 h-0.5 mb-6 ${lineCls}`} />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {(() => {
          const noAppeared = result?.result_getting_cadets?.filter(c => c.is_present).length || 0;
          const passMark = totalMaxMarks * 0.5; // Assuming 50% for pass mark
          const noPassed = result?.result_getting_cadets?.filter(c => c.is_present && calculateTotalMarks(c) >= passMark).length || 0;
          const noFailed = noAppeared - noPassed;
          const passPercentage = noAppeared > 0 ? ((noPassed / noAppeared) * 100).toFixed(2) : "0.00";
          const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

          return (
            <div className="mt-12 mb-6 break-inside-avoid grid grid-cols-1 md:grid-cols-4 gap-6 print-div">
              <div className="col-span-3 text-sm text-gray-900">
                <div className="min-w-2xl mx-auto flex justify-center">
                  <div className="">
                    <p className="w-full font-bold mb-4 pb-1 text-center uppercase underline">End Semester Exam</p>
                    <div className="border-l border-black pl-4 py-1 space-y-1.5 mr-24">
                      <div className="flex"><span className="w-40 font-medium">No Appeared</span><span>: {noAppeared}</span></div>
                      <div className="flex"><span className="w-40 font-medium">No Passed</span><span>: {noPassed}</span></div>
                      <div className="flex"><span className="w-40 font-medium">No Failed</span><span>: {noFailed}</span></div>
                      <div className="flex"><span className="w-40 font-medium">Pass Percentage</span><span>: {passPercentage}%</span></div>
                      <div className="flex"><span className="w-40 font-medium">Date</span><span>: {today}</span></div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="border-l border-black pl-4 py-1 space-y-1.5 w-full">
                      <div className="flex items-center min-h-[48px]">
                        <span className="w-20 font-medium">Sign</span>
                        <span>: {result.instructor?.signature && (
                          <Image
                            src={result.instructor.signature}
                            alt="Signature"
                            width={120}
                            height={48}
                            className="inline-block max-h-12 object-contain ml-2"
                          />
                        )}</span>
                      </div>
                      <div className="flex"><span className="w-20 font-medium">Name</span><span>: {result.instructor?.name || "N/A"}</span></div>
                      <div className="flex"><span className="w-20 font-medium">Rank</span><span>: {result.instructor?.rank?.short_name || "N/A"}</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-end items-center pb-1.5">
                <p className="text-sm text-gray-900 font-medium">(Examiner)</p>
              </div>
            </div>
          );
        })()}
      </div>

      <PrintTypeModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirm={confirmPrint}
      />

      {/* Forward Modal */}
      <Modal
        isOpen={forwardModal.open}
        onClose={() => setForwardModal({ open: false, loading: false, error: "" })}
        showCloseButton
        className="max-w-lg"
      >
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Forward to Higher Authority</h2>
          <p className="text-sm text-gray-500 mb-4">
            Subject: <span className="font-medium text-gray-700">{subjectModule?.subject_name} ({subjectModule?.subject_code})</span>
          </p>

          <div className="mb-4 rounded-lg border border-gray-200 overflow-hidden text-sm">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-3 py-2 text-gray-500 font-medium w-36">Course</td>
                  <td className="px-3 py-2 text-gray-900">{result?.course?.name || "—"}</td>
                </tr>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <td className="px-3 py-2 text-gray-500 font-medium">Semester</td>
                  <td className="px-3 py-2 text-gray-900">{result?.semester?.name || "—"}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-3 py-2 text-gray-500 font-medium">Program</td>
                  <td className="px-3 py-2 text-gray-900">{result?.program?.name || "—"}</td>
                </tr>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <td className="px-3 py-2 text-gray-500 font-medium">Branch</td>
                  <td className="px-3 py-2 text-gray-900">{(() => {
                    const cadets = result?.result_getting_cadets;
                    if (!cadets || cadets.length === 0) return "—";
                    const cb = (cadets[0].cadet as any)?.assigned_branchs?.find((b: any) => b.is_current) || (cadets[0].cadet as any)?.assigned_branchs?.[0];
                    return cb?.branch?.name || "—";
                  })()}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-gray-500 font-medium">Total Cadets</td>
                  <td className="px-3 py-2 text-gray-900">{result?.result_getting_cadets?.length ?? 0} (all approved)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {forwardModal.error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {forwardModal.error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 mt-2">
            <button
              onClick={() => setForwardModal({ open: false, loading: false, error: "" })}
              disabled={forwardModal.loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmForward}
              disabled={forwardModal.loading}
              className="px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
            >
              {forwardModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              Confirm Forward
            </button>
          </div>
        </div>
      </Modal>

      {/* Subject Approval Modal */}
      <Modal
        isOpen={subjectApprovalModal.open}
        onClose={() => setSubjectApprovalModal((prev) => ({ ...prev, open: false }))}
        showCloseButton
        className="max-w-lg"
      >
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Subject Approval</h2>
          <p className="text-sm text-gray-500 mb-4">
            Subject: <span className="font-medium text-gray-700">{subjectModule?.subject_name} ({subjectModule?.subject_code})</span>
          </p>

          <div className="mb-4 rounded-lg border border-gray-200 overflow-hidden text-sm">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-3 py-2 text-gray-500 font-medium w-36">Course</td>
                  <td className="px-3 py-2 text-gray-900">{result?.course?.name || "—"}</td>
                </tr>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <td className="px-3 py-2 text-gray-500 font-medium">Semester</td>
                  <td className="px-3 py-2 text-gray-900">{result?.semester?.name || "—"}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-3 py-2 text-gray-500 font-medium">Program</td>
                  <td className="px-3 py-2 text-gray-900">{result?.program?.name || "—"}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-gray-500 font-medium">Cadets</td>
                  <td className="px-3 py-2 text-gray-900">{result?.result_getting_cadets?.length ?? 0} (all approved)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
            <div className="flex gap-3">
              {(["approved", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSubjectApprovalModal((prev) => ({ ...prev, status: s }))}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold capitalize transition-colors ${
                    subjectApprovalModal.status === s
                      ? s === "approved" ? "bg-green-600 text-white border-green-600" : "bg-red-600 text-white border-red-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {subjectApprovalModal.status === "rejected" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection</label>
              <textarea
                value={subjectApprovalModal.rejectedReason}
                onChange={(e) => setSubjectApprovalModal((prev) => ({ ...prev, rejectedReason: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Enter rejection reason..."
              />
            </div>
          )}

          {subjectApprovalModal.error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {subjectApprovalModal.error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 mt-2">
            <button
              onClick={() => setSubjectApprovalModal((prev) => ({ ...prev, open: false }))}
              disabled={subjectApprovalModal.loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmSubjectApproval}
              disabled={subjectApprovalModal.loading}
              className={`px-6 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 ${
                subjectApprovalModal.status === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {subjectApprovalModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              Confirm {subjectApprovalModal.status === "approved" ? "Approval" : "Rejection"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Approval Modal */}
      <Modal
        isOpen={approvalModal.open}
        onClose={() => setApprovalModal((prev) => ({ ...prev, open: false }))}
        showCloseButton
        className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin"
      >
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="flex justify-center mb-2"><FullLogo /></div>
            <h1 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
            <p className="text-sm font-medium text-gray-700 uppercase tracking-wider">Academic Training Wing</p>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {approvalModal.cadetIds.length === 1 ? "Cadet Approval" : `Bulk Approval (${approvalModal.cadetIds.length} cadets)`}
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Subject: <span className="font-medium text-gray-700">{subjectModule?.subject_name} ({subjectModule?.subject_code})</span>
          </p>

          {/* Compact marks table */}
          {approvalModal.cadetIds.length > 0 && subjectModule?.marksheet?.marks && (
            <div className="mb-4 overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-b border-r border-gray-200 px-2 py-1.5 text-center text-gray-600">Sl.</th>
                    <th className="border-b border-r border-gray-200 px-2 py-1.5 text-left text-gray-600">Name</th>
                    <th className="border-b border-r border-gray-200 px-2 py-1.5 text-center text-gray-600">BD/No</th>
                    {[...subjectModule.marksheet.marks].sort((a, b) => a.id - b.id).map((sm) => (
                      <th key={sm.id} className="border-b border-r border-gray-200 px-2 py-1.5 text-center whitespace-nowrap text-gray-600">
                        {sm.name}
                        <br />
                        <span className="font-normal text-gray-400">/{sm.estimate_mark}</span>
                      </th>
                    ))}
                    <th className="border-b border-gray-200 px-2 py-1.5 text-center whitespace-nowrap">
                      Total<br /><span className="font-normal">/{totalMaxMarks}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {approvalModal.cadetIds.map((cadetId, index) => {
                    const cadet = result?.result_getting_cadets?.find((c) => c.cadet_id === cadetId);
                    if (!cadet) return null;
                    return (
                      <tr key={cadetId} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="border-t border-r border-gray-100 px-2 py-1.5 text-center text-gray-500">{index + 1}</td>
                        <td className="border-t border-r border-gray-100 px-2 py-1.5 font-medium text-gray-900">{cadet.cadet?.name || "N/A"}</td>
                        <td className="border-t border-r border-gray-100 px-2 py-1.5 text-center text-gray-600">{cadet.cadet_bd_no}</td>
                        {[...subjectModule.marksheet.marks!].sort((a, b) => a.id - b.id).map((sm) => (
                          <td key={sm.id} className="border-t border-r border-gray-100 px-2 py-1.5 text-center">
                            {cadet.is_present ? (
                              <span className="font-medium">{getCadetMark(cadet, sm.id).toFixed(1)}</span>
                            ) : <span className="text-gray-400">—</span>}
                          </td>
                        ))}
                        <td className="border-t border-gray-100 px-2 py-1.5 text-center font-bold">
                          {cadet.is_present ? calculateTotalMarks(cadet).toFixed(1) : "—"}
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

          {/* Rejected reason */}
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
              onClick={() => setApprovalModal((prev) => ({ ...prev, open: false }))}
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
    </div>
  );
}
