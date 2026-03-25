/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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

  const [rejectedPanelItems, setRejectedPanelItems] = useState<any[]>([]);
  const [rejectedPanelLoading, setRejectedPanelLoading] = useState(false);
  const [resubmitLoading, setResubmitLoading] = useState<number | null>(null);
  const [rejectDownModal, setRejectDownModal] = useState<{
    open: boolean; item: any | null; reason: string; loading: boolean; error: string;
  }>({ open: false, item: null, reason: '', loading: false, error: '' });

  const [editMarksModal, setEditMarksModal] = useState<{
    open: boolean;
    item: any | null;
    marks: Record<number, number>;
    loading: boolean;
    error: string;
  }>({ open: false, item: null, marks: {}, loading: false, error: "" });

  const [viewRejectedModal, setViewRejectedModal] = useState<{
    open: boolean;
    item: any | null;
  }>({ open: false, item: null });

  const [resubmitModal, setResubmitModal] = useState<{
    open: boolean;
    item: any | null;
    loading: boolean;
    error: string;
  }>({ open: false, item: null, loading: false, error: "" });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await atwResultService.getResult(parseInt(resultId));
      if (data) {
        // Sort approvals by ID descending to ensure we always pick the latest one with find()
        if (data.cadet_approvals) {
          data.cadet_approvals.sort((a: any, b: any) => b.id - a.id);
        }
        if (data.subject_approvals) {
          data.subject_approvals.sort((a: any, b: any) => b.id - a.id);
        }
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

  const loadRejectedPanel = useCallback(async () => {
    if (!result) return;
    try {
      setRejectedPanelLoading(true);
      const items = await atwApprovalService.getRejectedCadetPanel({
        course_id: result.course_id,
        semester_id: result.semester_id,
        program_id: result.program_id,
        subject_id: result.atw_subject_id,
      });
      setRejectedPanelItems(items);
    } catch {
      setRejectedPanelItems([]);
    } finally {
      setRejectedPanelLoading(false);
    }
  }, [result]);

  useEffect(() => {
    loadRejectedPanel();
  }, [loadRejectedPanel]);

  const handleOpenEditMarks = (item: any) => {
    const marks: Record<number, number> = {};
    if (item.marks && Array.isArray(item.marks)) {
      item.marks.forEach((m: any) => {
        marks[m.atw_subjects_module_marksheet_mark_id] = parseFloat(String(m.achieved_mark || 0));
      });
    } else {
      // Fallback to result data if item.marks is empty
      const cadetInResult = result?.result_getting_cadets?.find(c => c.cadet_id === item.cadet_id);
      cadetInResult?.cadet_marks?.forEach((m: any) => {
        marks[m.atw_subjects_module_marksheet_mark_id] = parseFloat(String(m.achieved_mark || 0));
      });
    }
    setEditMarksModal({ open: true, item, marks, loading: false, error: "" });
  };

  const handleSaveMarks = async () => {
    if (!editMarksModal.item || !result || !result.result_getting_cadets) return;
    setEditMarksModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      const subjectId = result.atw_subject_id || result.atw_subject_module_id;
      if (!subjectId) throw new Error("Subject ID not found");

      const combinedMarksList = allMarksList.filter((m: AtwSubjectsModuleMarksheetMark) => m.is_combined);
      const marksArray: any[] = [
        ...Object.entries(editMarksModal.marks).map(([id, val]) => ({
          atw_subjects_module_marksheet_mark_id: parseInt(id),
          achieved_mark: val,
          subject_id: subjectId,
          is_active: true
        })),
        ...combinedMarksList.map((m: AtwSubjectsModuleMarksheetMark) => ({
          atw_subjects_module_marksheet_mark_id: m.id,
          achieved_mark: calcCombinedFromInputs(m, editMarksModal.marks),
          subject_id: subjectId,
          is_active: true
        })),
      ];

      // Find the cadet in the current result getting cadets list
      const updatedCadets: any[] = result.result_getting_cadets.map(c => {
        if (c.cadet_id === editMarksModal.item.cadet_id) {
          return {
            cadet_id: c.cadet_id,
            cadet_bd_no: c.cadet_bd_no,
            remarks: c.remarks,
            is_present: c.is_present,
            absent_reason: c.absent_reason,
            is_active: c.is_active,
            marks: marksArray
          };
        }
        return {
          cadet_id: c.cadet_id,
          cadet_bd_no: c.cadet_bd_no,
          remarks: c.remarks,
          is_present: c.is_present,
          absent_reason: c.absent_reason,
          is_active: c.is_active,
          marks: c.cadet_marks?.map(cm => ({
            atw_subjects_module_marksheet_mark_id: cm.atw_subjects_module_marksheet_mark_id,
            achieved_mark: cm.achieved_mark,
            subject_id: subjectId,
            is_active: true
          }))
        };
      });

      await atwResultService.updateResult(result.id, {
        course_id: result.course_id,
        semester_id: result.semester_id,
        program_id: result.program_id,
        branch_id: result.branch_id,
        exam_type_id: result.exam_type_id,
        atw_subject_id: result.atw_subject_id,
        instructor_id: result.instructor_id,
        is_active: result.is_active,
        cadets: updatedCadets
      });

      // Auto-resubmit after saving marks
      await atwApprovalService.resubmitRejectedCadet({
        course_id: result.course_id,
        semester_id: result.semester_id,
        program_id: result.program_id,
        cadet_id: editMarksModal.item.cadet_id,
        subject_id: subjectId as number,
      });

      setEditMarksModal({ open: false, item: null, marks: {}, loading: false, error: "" });
      await loadData();
      await loadRejectedPanel();
    } catch (err: any) {
      setEditMarksModal(prev => ({ ...prev, loading: false, error: err?.message || "Failed to update marks." }));
    }
  };

  const handleResubmit = (item: any) => {
    setResubmitModal({ open: true, item, loading: false, error: "" });
  };

  const handleConfirmResubmit = async () => {
    const item = resubmitModal.item;
    if (!item) return;
    setResubmitModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      await atwApprovalService.resubmitRejectedCadet({
        course_id: item.course_id,
        semester_id: item.semester_id,
        program_id: item.program_id,
        cadet_id: item.cadet_id,
        subject_id: item.subject_id,
      });
      setResubmitModal({ open: false, item: null, loading: false, error: "" });
      await loadRejectedPanel();
      await loadData();
    } catch (err: any) {
      setResubmitModal((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || "Failed to resubmit.",
      }));
    }
  };

  const handleRejectDown = async () => {
    if (!rejectDownModal.item) return;
    if (!rejectDownModal.reason.trim()) {
      setRejectDownModal(prev => ({ ...prev, error: 'Rejection reason is required.' }));
      return;
    }
    const item = rejectDownModal.item;
    setRejectDownModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await atwApprovalService.approveCadets({
        course_id: item.course_id,
        semester_id: item.semester_id,
        program_id: item.program_id,
        subject_id: item.subject_id,
        cadet_ids: [item.cadet_id],
        authority_id: item.my_authority_id,
        status: 'rejected',
        rejected_reason: rejectDownModal.reason,
      });
      setRejectDownModal({ open: false, item: null, reason: '', loading: false, error: '' });
      await loadRejectedPanel();
      await loadData();
    } catch (err: any) {
      setRejectDownModal(prev => ({ ...prev, loading: false, error: err?.message || 'Failed to reject.' }));
    }
  };

  const handleApproveUpdated = async (item: any) => {
    try {
      setResubmitLoading(item.cadet_id);
      await atwApprovalService.approveCadets({
        course_id: item.course_id,
        semester_id: item.semester_id,
        program_id: item.program_id,
        subject_id: item.subject_id,
        cadet_ids: [item.cadet_id],
        authority_id: item.my_authority_id,
        status: 'approved',
      });
      await loadRejectedPanel();
      await loadData();
    } catch {
      alert('Failed to approve cadet.');
    } finally {
      setResubmitLoading(null);
    }
  };

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

    const isEnggResult = !!(result?.system_programs_changeable_semester_id);
    const isInitialLevel = !myAuthority || !!(myAuthority as any).is_initial_cadet_approve;

    if (isInitialLevel) {
      if (isEnggResult) {
        // Engineering result → forward to the authority with is_only_engg: true
        return authorities.find((a: any) => a.is_only_engg) || null;
      }
      // Regular result → forward to the first non-initial authority that is NOT only_engg
      return authorities.find((a: any) => !a.is_initial_cadet_approve && !a.is_only_engg) || null;
    }

    // Find authorities with sort strictly greater than mine
    return authorities.find(a => (a.sort ?? 0) > (myAuthority.sort ?? 0)) || null;
  }, [result?.approval_authorities, result?.system_programs_changeable_semester_id, myAuthority]);

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

  // Find the subject approval record for the current user's authority
  const mySubjectApproval = myAuthority
    ? result?.subject_approvals?.find((sa) => sa.authority_id === (myAuthority as any).id)
    : null;

  // For UI: isForwarded means "has the process moved past the initial step"
  // This is determined by subject_approvals having any entry (created when instructor clicks Forward).
  const isForwarded = (result?.subject_approvals?.length ?? 0) > 0;

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
  const isMyTurn = canInitialForward ? !isForwarded : (mySubjectApproval?.status === 'pending');
  const canApproveAction = canApprove && isMyTurn && !isSubjectApproved;

  // Show "Approve Subject" button only for non-initial-cadet-approve authorities
  const canApproveSubject = canApprove && isMyTurn && allCadetsApprovedByMe && !isSubjectApproved && !canInitialForward;

  // Show "Forward" button ONLY for the initial step (Instructor)
  const showForwardButton = canInitialForward && !isForwarded && allCadetsApproved;

  // Authorities filtered to only those relevant to this result (engineering vs non-engineering)
  const chainAuthorities = useMemo(() => {
    const isEngg = !!(result as any)?.subject_group?.system_programs_changeable_semester_id;
    const sorted = [...(result?.approval_authorities ?? [])].sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
    return sorted.filter((auth: any) => {
      if (auth.is_only_engg) return isEngg;
      const hasPeerEngg = sorted.some((a: any) => a.is_only_engg && (a.sort ?? 0) === (auth.sort ?? 0));
      if (hasPeerEngg) return !isEngg;
      return true;
    });
  }, [result]);

  // Authorities visible to this user: their own step + all steps below (sort <=), filtered to relevant chain
  const visibleAuthorities = myAuthority
    ? chainAuthorities.filter((a: any) => (a.sort ?? 0) <= (myAuthority.sort ?? 0))
    : [];

  // --- Approval helpers ---
  const pendingCadetIds = result?.result_getting_cadets
    ?.filter((c) => {
      if (!myAuthority?.is_initial_cadet_approve && !myAuthority?.is_cadet_approve) return false;

      const authorityId = (myAuthority as any)?.id;
      // Strictly look for the ACTIVE record for the current authority
      const approval = result.cadet_approvals?.find((a) =>
        Number(a.cadet_id) === Number(c.cadet_id) &&
        (Number(a.authority_id) === Number(authorityId) || (canInitialForward && !a.authority_id)) &&
        a.is_active
      );

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
        status: "approved", // When forwarding from instructor, they are effectively approving their part
        cadet_ids: result.result_getting_cadets?.map((c) => c.cadet_id) ?? [],
        authority_id: (myAuthority as any)?.id ?? null,
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
        authority_id: (myAuthority as any)?.id ?? null,
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

  // Lower authority entry (one step below myAuthority in the sorted chain)
  const lowerAuthorityEntry = (() => {
    if (!myAuthority) return null;
    const mySort = (myAuthority as any).sort ?? 0;
    return [...chainAuthorities].reverse().find((a: any) => (a.sort ?? 0) < mySort) ?? null;
  })();

  // Returns true if the lower authority has approved this cadet AFTER the current user's rejection
  const lowerAuthorityReapprovedAfterRejection = (cadetId: number, myRejectionId: number): boolean => {
    if (!lowerAuthorityEntry || !result?.cadet_approvals) return false;
    const lowerAuthId = (lowerAuthorityEntry as any).id;
    const isInitial = !!(lowerAuthorityEntry as any).is_initial_cadet_approve;
    return result.cadet_approvals.some((a: any) =>
      Number(a.cadet_id) === Number(cadetId) &&
      (isInitial ? (!a.authority_id || Number(a.authority_id) === Number(lowerAuthId)) : Number(a.authority_id) === Number(lowerAuthId)) &&
      a.status === 'approved' &&
      a.id > myRejectionId
    );
  };

  // Helper to get approval status for a cadet — scoped to the current user's authority step
  const getCadetApproval = (cadetId: number): AtwResultMarkCadetApproval | undefined => {
    if (!result?.cadet_approvals || !myAuthority) return undefined;
    const authorityId = (myAuthority as any).id;
    // Strictly pick the ACTIVE record for this authority context
    return (
      result.cadet_approvals.find((a) =>
        Number(a.cadet_id) === Number(cadetId) &&
        (Number(a.authority_id) === Number(authorityId) || (canInitialForward && !a.authority_id)) &&
        a.is_active
      )
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
    if (mark.is_combined) return getCadetMark(cadet, mark.id); // stored value is already final
    const obtained = getCadetMark(cadet, mark.id);
    const estimate = parseFloat(String(mark.estimate_mark || 0));
    const percentage = parseFloat(String(mark.percentage || 0));
    if (estimate === 0 && percentage === 0) return 0;
    if (estimate === percentage || estimate === 0) return obtained;
    return (obtained / estimate) * percentage;
  };

  // Calculate total marks for a cadet — excludes referenced marks, includes combined
  const calculateTotalMarks = (cadet: any) => {
    const subjectModule = getSubjectModule();
    if (!subjectModule?.marksheet?.marks) return 0;
    const allMarks = subjectModule.marksheet.marks;
    const rIds = new Set(allMarks.flatMap((m: AtwSubjectsModuleMarksheetMark) =>
      m.is_combined && m.combined_cols ? m.combined_cols.map((c: any) => c.referenced_mark_id) : []
    ));
    return allMarks.reduce((sum: number, mark: AtwSubjectsModuleMarksheetMark) => {
      if (rIds.has(mark.id)) return sum;
      return sum + getWeightedMark(cadet, mark);
    }, 0);
  };

  // Helper to determine colSpan for dynamic marks group
  const getGroupColSpan = (marks: AtwSubjectsModuleMarksheetMark[]) => {
    return marks.reduce((acc: number, m) => {
      const estimate = parseFloat(String(m.estimate_mark || 0));
      const percentage = parseFloat(String(m.percentage || 0));
      return acc + (!m.is_combined && estimate !== percentage ? 2 : 1);
    }, 0);
  };

  // Compute refMarkIds for the current subject module
  const subjectModuleForRef = getSubjectModule();
  const allMarksList = subjectModuleForRef?.marksheet?.marks || [];
  const refMarkIds = new Set(allMarksList.flatMap((m: AtwSubjectsModuleMarksheetMark) =>
    m.is_combined && m.combined_cols ? m.combined_cols.map((c: any) => c.referenced_mark_id) : []
  ));
  const marksById = Object.fromEntries(allMarksList.map((m: AtwSubjectsModuleMarksheetMark) => [m.id, m]));

  // Calculate combined mark value from input marks (for edit modal)
  const calcCombinedFromInputs = (mark: AtwSubjectsModuleMarksheetMark, inputs: Record<number, number>): number => {
    if (!mark.combined_cols || mark.combined_cols.length === 0) return 0;
    const bestCount = mark.combined_cols.length - 1;
    if (bestCount <= 0) return 0;
    const refVals = mark.combined_cols.map((col: any) => {
      const refMark = marksById[col.referenced_mark_id] as AtwSubjectsModuleMarksheetMark;
      return { val: parseFloat(String(inputs[col.referenced_mark_id] ?? 0)) || 0, est: Number(refMark?.estimate_mark) || 0 };
    }).sort((a: any, b: any) => b.val - a.val).slice(0, bestCount);
    const sumIn = refVals.reduce((a: number, r: any) => a + r.val, 0);
    const sumEst = refVals.reduce((a: number, r: any) => a + r.est, 0);
    return sumEst > 0 ? (sumIn / sumEst) * Number(mark.percentage) : sumIn;
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
      <style dangerouslySetInnerHTML={{
        __html: `
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

      {/* Authority Chain */}
      {/* {(result.approval_authorities?.length ?? 0) > 0 && (
        <div className="no-print px-4 pb-2">
          <div className="flex items-center flex-wrap gap-y-1">
            {chainAuthorities.map((auth: any, idx: number) => {
              const isMe = (myAuthority as any)?.id === auth.id;
              const isLast = idx === chainAuthorities.length - 1;

              let isApproved = false;
              let isPending = false;
              let statusText = 'Not reached';

              if (auth.is_initial_cadet_approve) {
                isApproved = isForwarded;
                statusText = isApproved ? 'Forwarded' : 'Not reached';
              } else {
                const sa = result.subject_approvals?.find((s: any) => s.authority_id === auth.id);
                isApproved = sa?.status === 'approved';
                isPending = sa?.status === 'pending';
                statusText = isApproved ? 'Approved' : isPending ? 'Pending' : 'Not reached';
              }

              const dotColor = isApproved ? 'bg-green-500' : isPending ? 'bg-yellow-400' : isMe ? 'bg-blue-500' : 'bg-gray-300';
              const dotIcon = isApproved
                ? <Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3 text-white" />
                : isPending
                  ? <Icon icon="hugeicons:clock-01" className="w-3 h-3 text-white" />
                  : <Icon icon="hugeicons:circle" className="w-3 h-3 text-white opacity-60" />;

              return (
                <div key={auth.id} className="flex items-center">
                  <div className={`flex flex-col items-center px-2 py-1 rounded-lg border ${isMe ? 'bg-blue-50 border-blue-300' : isApproved ? 'bg-green-50 border-green-200' : isPending ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${dotColor}`}>
                        {dotIcon}
                      </div>
                      <span className={`text-xs font-medium ${isMe ? 'text-blue-700' : isApproved ? 'text-green-700' : isPending ? 'text-yellow-700' : 'text-gray-500'}`}>
                        {auth.role?.name || auth.user?.name || `Auth #${auth.id}`}
                        {isMe && <span className="ml-1 text-[9px] text-blue-400">(me)</span>}
                      </span>
                    </div>
                    <span className={`text-[9px] mt-0.5 ${isApproved ? 'text-green-600' : isPending ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {statusText}
                    </span>
                  </div>
                  {!isLast && (
                    <Icon icon="hugeicons:arrow-right-01" className={`w-4 h-4 mx-1 shrink-0 ${isApproved ? 'text-green-400' : 'text-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )} */}

      {/* Content */}
      <div className="p-4 cv-content">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>

          {result.system_programs_changeable_semester_id ? (
            <>
              {(result as any).subject_group?.university && (
                <p className="text-center text-base font-bold text-gray-900 uppercase">
                  {(result as any).subject_group.university.name}
                  {(result as any).subject_group.university.short_name ? ` (${(result as any).subject_group.university.short_name})` : ""}
                </p>
              )}
              {(result as any).subject_group?.university_department && (
                <p className="text-center text-gray-900 uppercase underline">
                  DEPT OF {(result as any).subject_group.university_department.name}
                  {(result as any).subject_group.university_department.code ? ` (${(result as any).subject_group.university_department.code})` : ""}
                </p>
              )}
              <div className="mb-2">
                <p className="text-center text-gray-900 uppercase underline">
                  RESULT SHEET : {result.exam_type?.name || result.exam_type?.code || ""}
                </p>
                <p className="text-center text-gray-900 uppercase underline">
                  COURSE: {result.subject?.subject_name ? `${result.subject.subject_name}` : ""}{`(${result.subject?.subject_code})` || ""}
                </p>
                {(result as any).subject_group?.university_semester?.name && (
                  <p className="text-center text-gray-900 uppercase underline">
                    SESSION 2025-2026, {(result as any).subject_group.university_semester.name}
                  </p>
                )}
                {result.subject?.subjects_credit != null && (
                  <p className="text-center text-gray-900 uppercase underline">
                    CREDIT HOUR : {result.subject.subjects_credit}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <h1 className="text-center text-xl font-bold text-gray-900 uppercase">
                Bangladesh Air Force Academy
              </h1>
              <div className="mb-2">
                <p className="text-center font-medium text-gray-900 uppercase underline">Academic Training Wing</p>
                <p className="text-center font-medium text-gray-900 uppercase underline">
                  {result.exam_type?.code} {result.semester?.name} Exam : {result.created_at ? new Date(result.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : ""}
                </p>
                <p className="text-center font-medium text-gray-900 uppercase underline">{result.course?.name} ({result.program?.is_changeable && result.changeable_program ? result.changeable_program.name : result.program?.name})</p>
                <p className="text-center font-medium text-gray-900 uppercase underline">Marks Sheet</p>
              </div>
            </>
          )}

        </div>

        {/* Rejected Cadet Panel */}
        {rejectedPanelItems.length > 0 && (
          <div className="mb-6 overflow-hidden no-print">
            <div className="flex items-center gap-2 py-2">
              <Icon icon="hugeicons:alert-02" className="w-5 h-5 text-orange-500" />
              Rejected Cadets
              {rejectedPanelItems.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                  {rejectedPanelItems.length}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              {rejectedPanelLoading ? (
                <div className="flex justify-center py-4">
                  <Icon icon="hugeicons:fan-01" className="w-6 h-6 animate-spin text-orange-400" />
                </div>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-orange-50 text-orange-900">
                      <th className="px-2 py-2 border border-orange-200 text-center">Sl</th>
                      <th className="px-2 py-2 border border-orange-200 text-left">BD No</th>
                      <th className="px-2 py-2 border border-orange-200 text-left">Rank</th>
                      <th className="px-2 py-2 border border-orange-200 text-left">Name</th>
                      <th className="px-2 py-2 border border-orange-200 text-left">Branch</th>
                      <th className="px-2 py-2 border border-orange-200 text-left">Rejected By</th>
                      <th className="px-2 py-2 border border-orange-200 text-left">Reason</th>
                      <th className="px-2 py-2 border border-orange-200 text-left">Status</th>
                      <th className="px-2 py-2 border border-orange-200 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedPanelItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/40">
                        <td className="px-2 py-2 border border-orange-100 text-center">{idx + 1}</td>
                        <td className="px-2 py-2 border border-orange-100 font-mono font-bold">{item.cadet_bd_no}</td>
                        <td className="px-2 py-2 border border-orange-100">{item.cadet_rank}</td>
                        <td className="px-2 py-2 border border-orange-100 font-medium">{item.cadet_name}</td>
                        <td className="px-2 py-2 border border-orange-100">{item.cadet_branch}</td>
                        <td className="px-2 py-2 border border-orange-100 text-red-700 font-medium">{item.rejected_by}</td>
                        <td className="px-2 py-2 border border-orange-100 text-gray-600 max-w-[200px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate flex-1" title={item.rejected_reason || ''}>
                              {item.rejected_reason || '—'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewRejectedModal({ open: true, item });
                              }}
                              className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                              title="View Details"
                            >
                              <Icon icon="hugeicons:view" className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-2 py-2 border border-orange-100">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.state === 'updated_pending_review' || item.state === 'instructor_updated'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {item.message}
                          </span>
                        </td>
                        <td className="px-2 py-2 border border-orange-100 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {item.can_edit_marks && (
                              <button
                                onClick={() => handleOpenEditMarks(item)}
                                className="px-2 py-1 text-[9px] bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                              >
                                <Icon icon="hugeicons:pencil-edit-01" className="w-3 h-3" />
                                Update Marks
                              </button>
                            )}
                            {item.can_resubmit && (
                              <button
                                onClick={() => handleResubmit(item)}
                                className="px-2 py-1 text-[9px] bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                                title="Re-submit after correction"
                              >
                                Re-submit
                              </button>
                            )}
                            {item.can_approve && (
                              <button
                                onClick={() => handleApproveUpdated(item)}
                                disabled={resubmitLoading === item.cadet_id}
                                className="px-2 py-1 text-[9px] bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                              >
                                {resubmitLoading === item.cadet_id && <Icon icon="hugeicons:fan-01" className="w-3 h-3 animate-spin" />}
                                Approve
                              </button>
                            )}
                            {item.can_reject_down && (
                              <button
                                onClick={() => setRejectDownModal({ open: true, item, reason: '', loading: false, error: '' })}
                                className="px-2 py-1 text-[9px] bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-1"
                                title="Reject to lower authority"
                              >
                                <Icon icon="hugeicons:arrow-down-01" className="w-3 h-3" />
                                Reject ↓
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

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
                  {/* Header Row 2 — single-col groups get rowSpan=2 */}
                  <tr>
                    {groupKeys.map(key => {
                      const colSpan = getGroupColSpan(markGroups[key]);
                      const groupLabel = key === 'classtest' ? 'Class Test' :
                        key === 'quiztest' ? 'Quiz Test' :
                          key === 'midsemester' ? 'Mid Semester' :
                            key === 'endsemester' ? 'End Semester' :
                              key.replace(/([A-Z])/g, ' $1').trim();
                      if (colSpan === 1) {
                        const sm = markGroups[key][0];
                        const pct = parseFloat(String(sm.percentage || 0));
                        return (
                          <th key={key} rowSpan={2} className="border border-black px-2 py-1 text-center capitalize align-middle">
                            <div className="text-xs font-medium">{sm.name}</div>
                            <div className="text-xs font-bold">{pct % 1 === 0 ? pct : pct.toFixed(2)}%</div>
                          </th>
                        );
                      }
                      const groupTotal = markGroups[key].reduce((acc, m) => acc + parseFloat(String(m.percentage || 0)), 0);
                      return (
                        <th key={key} colSpan={colSpan} className="border border-black px-2 py-1 text-center capitalize">
                          {groupLabel}<br />
                          <span className="">{groupTotal % 1 === 0 ? groupTotal : groupTotal.toFixed(2)}%</span>
                        </th>
                      );
                    })}
                  </tr>
                  {/* Header Row 3 — only multi-col groups */}
                  <tr>
                    {groupKeys.flatMap(key => {
                      if (getGroupColSpan(markGroups[key]) === 1) return [];
                      return markGroups[key].map(sm => {
                        const estimate = parseFloat(String(sm.estimate_mark || 0));
                        const percentage = parseFloat(String(sm.percentage || 0));
                        const isDiff = !sm.is_combined && estimate !== percentage;
                        return isDiff ? (
                          <React.Fragment key={sm.id}>
                            <th className="border border-black px-2 py-1 text-center text-xs">{estimate}%</th>
                            <th className="border border-black px-2 py-1 text-center text-xs">{percentage}%</th>
                          </React.Fragment>
                        ) : (
                          <th key={sm.id} className="border border-black px-2 py-1 text-center text-xs">
                            {sm.name} <br />
                            {percentage}%
                          </th>
                        );
                      });
                    })}
                  </tr>
                </thead>
                <tbody>
                  {result.result_getting_cadets.map((cadet, index) => {
                    const approval = getCadetApproval(cadet.cadet_id);
                    const isPending = !approval || approval.status === "pending";
                    const isRejected = approval?.status === "rejected";
                    const canReapprove = isRejected && lowerAuthorityReapprovedAfterRejection(cadet.cadet_id, approval!.id);
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
                            if (sm.is_combined) {
                              return (
                                <td key={sm.id} className="border border-black px-2 py-2 text-center font-medium">
                                  {cadet.is_present ? getCadetMark(cadet, sm.id).toFixed(2) : "—"}
                                </td>
                              );
                            }
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
                            <span className="text-gray-800 text-xs">—</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {visibleAuthorities.map((authority: any, idx: number) => {
                                const label = authority.role?.name || authority.user?.name || `Step ${idx + 1}`;
                                const colors: Record<string, string> = {
                                  pending: "bg-yellow-100 text-yellow-800",
                                  approved: "bg-green-100 text-green-800",
                                  rejected: "bg-red-100 text-red-800",
                                };

                                // Get ALL matching records for this authority/cadet (History + Active)
                                const allMatchingRecords = result.cadet_approvals?.filter((a) => {
                                  return Number(a.cadet_id) === Number(cadet.cadet_id) &&
                                    (Number(a.authority_id) === Number(authority.id) || (authority.is_initial_cadet_approve && !a.authority_id));
                                }) ?? [];

                                if (allMatchingRecords.length === 0) {
                                  // Check for subject-level approval as fallback
                                  const authSubjectApproval = result.subject_approvals?.find(sa => Number(sa.authority_id) === Number(authority.id));
                                  if (authSubjectApproval) {
                                    return (
                                      <div key={authority.id} className="flex flex-col gap-0.5 border-b border-gray-100 last:border-0 pb-1 mb-1">
                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                          <span className="text-[9px] text-gray-500 truncate max-w-[80px]" title={label}>{label}:</span>
                                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase ${colors[authSubjectApproval.status] ?? ""}`}>
                                            {authSubjectApproval.status} (Subj)
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return <div key={authority.id} className="flex items-center gap-1"><span className="text-[9px] text-gray-500">{label}:</span> <span className="text-[9px] text-gray-300">—</span></div>;
                                }
                                const latestRec = allMatchingRecords[0];
                                const st = latestRec.status;
                                return (
                                  <div key={authority.id} className="flex items-center gap-1 pb-1 mb-1">
                                    <span className="text-[9px] text-gray-500 font-bold">{label}:</span>
                                    <div className="pl-1">
                                      <div className="flex items-center gap-1">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase ${colors[st] ?? ""}`}>
                                          {st}
                                        </span>
                                      </div>
                                    </div>
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
                            ) : canReapprove ? (
                              <button
                                onClick={() => openApprovalModal([cadet.cadet_id])}
                                className="px-2 py-1 text-[10px] font-semibold bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                              >
                                Re-approve
                              </button>
                            ) : isRejected ? (
                              <span className="px-2 py-1 text-[10px] text-red-500 font-semibold">Awaiting correction</span>
                            ) : null}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>{/* end overflow-x-auto */}

            {/* Approval Timeline — inside the table section, only for non-initial-cadet-approve users */}
            {/* {!canInitialForward && result.approval_authorities && result.approval_authorities.length > 0 && (
              <div className="no-print mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-3">Approval Progress</p>
                <div className="flex items-start flex-wrap gap-y-4">
                  {chainAuthorities.map((authority: any, index: number) => {
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
                          status === 'active' ? 'bg-blue-500 text-white' :
                            'bg-gray-200 text-gray-800';
                      const labelCls =
                        status === 'completed' ? 'text-green-700' :
                          status === 'active' ? 'text-blue-700' :
                            'text-gray-800';
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
                          {index < chainAuthorities.length - 1 && (
                            <div className={`w-10 h-0.5 mb-6 ${lineCls}`} />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )} */}
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
        {/* <div className="p-6">
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
                  <td className="px-3 py-2 text-gray-900">{result?.program?.is_changeable && result?.changeable_program ? result.changeable_program.name : result?.program?.name || "—"}</td>
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
        </div> */}
        <div className="p-6">
          <div className="flex items-center gap-1 mb-4">
            <div className="flex items-center justify-center w-12 h-12">
              <Image
                src="/images/logo/logo.png"
                alt="BAFA Logo"
                width={50}
                height={50}
                className="dark:hidden"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Forward to Higher Authority</h2>
              <p className="text-xs text-gray-500">Initial subject result forwarding</p>
            </div>
          </div>

          {result && (() => {
            const r = result;
            const subjectModule = r.subject?.module || r.subject || r.atw_subject_module;
            const rows: [string, string][] = [
              ["Course", r.course?.name || "—"],
              ["Semester", r.semester?.name || "—"],
              ["Program", (r.program?.is_changeable && r.changeable_program ? r.changeable_program.name : r.program?.name) || "—"],
              ["Subject", subjectModule?.subject_name ? `${subjectModule.subject_name} (${subjectModule.subject_code})` : "—"],
              ["Exam Type", r.exam_type?.name || "—"],
            ];
            return (
              <div className="mb-5 rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
                {rows.map(([label, value]) => (
                  <div key={label} className="flex px-4 py-2.5">
                    <span className="w-28 text-gray-500 shrink-0">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {myAuthority && (
            <div className="flex justify-between items-center gap-2">
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-1">Your Authority Level</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{(myAuthority as any).role?.name}</span>
                </div>
              </div>
              <div>
                <Icon icon="hugeicons:arrow-right-02" className="w-5 h-5 text-blue-600 inline-block mr-2" />
              </div>
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-1">Next Authority Level</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{getNextAuthority()?.role?.name}</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-5">
            This will mark the subject result as forwarded to the higher authority for further review and approval. This action records your approval at the subject level.
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

      {/* Subject Approval Modal */}
      <Modal
        isOpen={subjectApprovalModal.open}
        onClose={() => setSubjectApprovalModal((prev) => ({ ...prev, open: false }))}
        showCloseButton
        className="max-w-lg"
      >
        <div className="p-6">
          <div className="flex items-center gap-1 mb-4">
            <div className="flex items-center justify-center w-12 h-12">
              <Image
                src="/images/logo/logo.png"
                alt="BAFA Logo"
                width={50}
                height={50}
                className="dark:hidden"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Subject Approval</h2>
              <p className="text-xs text-gray-500">Approve subject result at your authority level</p>
            </div>
          </div>

          {result && (() => {
            const r = result;
            const sm = r.subject?.module || r.subject || r.atw_subject_module;
            const rows: [string, string][] = [
              ["Course", r.course?.name || "—"],
              ["Semester", r.semester?.name || "—"],
              ["Program", r.program?.name || "—"],
              ["Subject", sm?.subject_name ? `${sm.subject_name} (${sm.subject_code})` : "—"],
              ["Exam Type", r.exam_type?.name || "—"],
            ];
            return (
              <div className="mb-5 rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
                {rows.map(([label, value]) => (
                  <div key={label} className="flex px-4 py-2.5">
                    <span className="w-28 text-gray-500 shrink-0">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {myAuthority && (
            <div className="flex justify-between items-center gap-2 mb-5">
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-1">Your Authority Level</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{(myAuthority as any).role?.name}</span>
                </div>
              </div>
              <div>
                <Icon icon="hugeicons:arrow-right-02" className="w-5 h-5 text-blue-600 inline-block mr-2" />
              </div>
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-1">Next Authority Level</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{getNextAuthority()?.role?.name}</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-5">
            This will approve the subject result at your authority level and forward it to the next authority for further review.
          </p>

          {subjectApprovalModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {subjectApprovalModal.error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
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
              className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              {subjectApprovalModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              Confirm Approval
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
            <h1 className="text-lg font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
            <p className="text-sm font-medium text-gray-700 uppercase">Academic Training Wing</p>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {approvalModal.cadetIds.length === 1 ? "Cadet Approval" : `Cadets Approval (${approvalModal.cadetIds.length} cadets)`}
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Subject: <span className="font-medium text-gray-700">{subjectModule?.subject_name} ({subjectModule?.subject_code})</span>
          </p>

          {/* Compact marks table - now mirroring main table */}
          {approvalModal.cadetIds.length > 0 && (
            <div className="mb-4 overflow-x-auto rounded-lg border border-black">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  {/* Header Row 1 */}
                  <tr>
                    <th rowSpan={3} className="border border-l-0 border-t-0 border-black px-1 py-1 text-center align-middle">Ser</th>
                    <th rowSpan={3} className="border border-t-0 border-black px-1 py-1 text-center align-middle">BD/No</th>
                    <th rowSpan={3} className="border border-t-0 border-black px-1 py-1 text-center align-middle font-bold">Name</th>
                    <th colSpan={
                      groupKeys.reduce((acc, key) => acc + getGroupColSpan(markGroups[key]), 0)
                    } className="border border-t-0 border-black px-1 py-1 text-center uppercase font-bold">
                      Marks Obtained
                    </th>
                    {hasWeightedLogic && (
                      <th rowSpan={3} className="border border-r-0 border-t-0 border-black px-1 py-1 text-center align-middle font-bold">
                        Total<br />{totalMaxMarks}
                      </th>
                    )}
                  </tr>
                  {/* Header Row 2 — single-col groups get rowSpan=2 */}
                  <tr>
                    {groupKeys.map(key => {
                      const colSpan = getGroupColSpan(markGroups[key]);
                      const groupLabel = key === 'classtest' ? 'Class Test' :
                        key === 'quiztest' ? 'Quiz Test' :
                          key === 'midsemester' ? 'Mid Semester' :
                            key === 'endsemester' ? 'End Semester' :
                              key.replace(/([A-Z])/g, ' $1').trim();
                      if (colSpan === 1) {
                        const sm = markGroups[key][0];
                        const pct = parseFloat(String(sm.percentage || 0));
                        return (
                          <th key={key} rowSpan={2} className="border border-black px-1 py-0.5 text-center capitalize font-bold align-middle">
                            <div className="text-[9px]">{sm.name}</div>
                            <div className="text-[9px]">({pct % 1 === 0 ? pct : pct.toFixed(2)}%)</div>
                          </th>
                        );
                      }
                      const groupTotal = markGroups[key].reduce((acc, m) => acc + parseFloat(String(m.percentage || 0)), 0);
                      return (
                        <th key={key} colSpan={colSpan} className="border border-black px-1 py-0.5 text-center capitalize font-bold">
                          {groupLabel}<br />
                          <span className="text-[10px] font-normal">({groupTotal % 1 === 0 ? groupTotal : groupTotal.toFixed(2)}%)</span>
                        </th>
                      );
                    })}
                  </tr>
                  {/* Header Row 3 — only multi-col groups */}
                  <tr>
                    {groupKeys.flatMap(key => {
                      if (getGroupColSpan(markGroups[key]) === 1) return [];
                      return markGroups[key].map(sm => {
                        const estimate = parseFloat(String(sm.estimate_mark || 0));
                        const percentage = parseFloat(String(sm.percentage || 0));
                        const isDiff = !sm.is_combined && estimate !== percentage;
                        return isDiff ? (
                          <React.Fragment key={sm.id}>
                            <th className="border border-black px-1 py-0.5 text-center text-[9px] font-bold">{sm.name} <br /> ({estimate})</th>
                            <th className="border border-black px-1 py-0.5 text-center text-[9px] font-bold">{percentage}% of Obt. Mks.</th>
                          </React.Fragment>
                        ) : (
                          <th key={sm.id} className="border border-black px-1 py-0.5 text-center text-[9px] font-bold">{sm.name} <br /> ({percentage})</th>
                        );
                      });
                    })}
                  </tr>
                </thead>
                <tbody>
                  {approvalModal.cadetIds.map((cadetId, index) => {
                    const cadets = result?.result_getting_cadets ?? [];
                    const cadet = cadets.find((c) => c.cadet_id === cadetId);
                    if (!cadet) return null;
                    const isLast = index === approvalModal.cadetIds.length - 1;
                    const lastCls = isLast ? "border-b-0" : "";
                    return (
                      <tr key={cadet.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                        <td className={`border border-l-0 border-black px-1 py-1 text-center ${lastCls}`}>{index + 1}</td>
                        <td className={`border border-black px-1 py-1 text-center font-mono ${lastCls}`}>{cadet.cadet_bd_no}</td>
                        <td className={`border border-black px-1 py-1 font-bold text-gray-900 ${lastCls}`}>{cadet.cadet?.name || "N/A"}</td>

                        {groupKeys.map(key =>
                          markGroups[key].map(sm => {
                            const estimate = parseFloat(String(sm.estimate_mark || 0));
                            const percentage = parseFloat(String(sm.percentage || 0));
                            if (sm.is_combined) {
                              return (
                                <td key={sm.id} className={`border border-black px-1 py-1 text-center font-bold ${lastCls}`}>
                                  {cadet.is_present ? getCadetMark(cadet, sm.id).toFixed(2) : "—"}
                                </td>
                              );
                            }
                            const isDiff = estimate !== percentage;
                            return isDiff ? (
                              <React.Fragment key={sm.id}>
                                <td className={`border border-black px-1 py-1 text-center ${lastCls}`}>
                                  {cadet.is_present ? getCadetMark(cadet, sm.id).toFixed(2) : "—"}
                                </td>
                                <td className={`border border-black px-1 py-1 text-center font-bold ${lastCls}`}>
                                  {cadet.is_present ? getWeightedMark(cadet, sm).toFixed(2) : "—"}
                                </td>
                              </React.Fragment>
                            ) : (
                              <td key={sm.id} className={`border border-black px-1 py-1 text-center ${lastCls}`}>
                                {cadet.is_present ? getCadetMark(cadet, sm.id).toFixed(2) : "—"}
                              </td>
                            );
                          })
                        )}

                        {/* Total Marks */}
                        {hasWeightedLogic && (
                          <td className={`border border-r-0 border-black px-1 py-1 text-center font-bold ${lastCls}`}>
                            {cadet.is_present ? Math.ceil(calculateTotalMarks(cadet)) : "—"}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Status selector - hidden for initial authority */}
          {!canInitialForward && (
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
          )}

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

      {/* Reject Down Modal */}
      <Modal
        isOpen={rejectDownModal.open}
        onClose={() => setRejectDownModal(prev => ({ ...prev, open: false }))}
        showCloseButton
        className="max-w-md"
      >
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Icon icon="hugeicons:alert-02" className="w-5 h-5 text-orange-500" />
            Reject to Lower Authority
          </h2>
          {rejectDownModal.item && (
            <p className="text-sm text-gray-600 mb-4">
              Cadet: <span className="font-medium text-gray-900">{rejectDownModal.item.cadet_name}</span>
              {rejectDownModal.item.cadet_bd_no && rejectDownModal.item.cadet_bd_no !== '—' && (
                <span className="ml-1 text-gray-800">({rejectDownModal.item.cadet_bd_no})</span>
              )}
            </p>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectDownModal.reason}
              onChange={e => setRejectDownModal(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
              rows={3}
              placeholder="Enter reason for rejection..."
            />
          </div>
          {rejectDownModal.error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {rejectDownModal.error}
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setRejectDownModal(prev => ({ ...prev, open: false }))}
              disabled={rejectDownModal.loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectDown}
              disabled={rejectDownModal.loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
            >
              {rejectDownModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              Confirm Reject
            </button>
          </div>
        </div>
      </Modal>
      {/* Re-submit Confirmation Modal */}
      <Modal
        isOpen={resubmitModal.open}
        onClose={() => !resubmitModal.loading && setResubmitModal({ open: false, item: null, loading: false, error: "" })}
        showCloseButton
        className="max-w-md"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Icon icon="hugeicons:checkmark-circle-02" className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 uppercase">Confirm Re-submission</h2>
            <div className="h-1 w-20 bg-green-500 rounded-full mt-2"></div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
            <p className="text-sm text-center text-gray-600">
              Are you sure you have updated the marks for<br />
              <span className="font-bold text-gray-900">{resubmitModal.item?.cadet_name}</span>
              {resubmitModal.item?.cadet_bd_no && <span className="text-gray-800 ml-1">({resubmitModal.item?.cadet_bd_no})</span>}?
            </p>
          </div>

          {resubmitModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {resubmitModal.error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setResubmitModal({ open: false, item: null, loading: false, error: "" })}
              disabled={resubmitModal.loading}
              className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmResubmit}
              disabled={resubmitModal.loading}
              className="px-8 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2"
            >
              {resubmitModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              Confirm & Re-submit
            </button>
          </div>
        </div>
      </Modal>

      {/* View Rejection Details Modal */}
      <Modal
        isOpen={viewRejectedModal.open}
        onClose={() => setViewRejectedModal({ open: false, item: null })}
        showCloseButton
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2"><FullLogo /></div>
            <h1 className="text-lg font-bold text-gray-900 uppercase">Rejection Details</h1>
            <div className="h-1 w-20 bg-orange-500 rounded-full mx-auto mt-2"></div>
          </div>

          {viewRejectedModal.item && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-orange-50 p-4 rounded-xl border border-orange-100">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Cadet: <span className="font-bold text-gray-900">{viewRejectedModal.item.cadet_name} ({viewRejectedModal.item.cadet_bd_no})</span></p>
                  <p className="text-sm text-gray-600">Rank/Branch: <span className="font-medium text-gray-800">{viewRejectedModal.item.cadet_rank} / {viewRejectedModal.item.cadet_branch}</span></p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Rejected By: <span className="font-bold text-red-600">{viewRejectedModal.item.rejected_by}</span></p>
                  <p className="text-sm text-gray-600">Date: <span className="font-medium text-gray-800">{viewRejectedModal.item.rejected_at ? new Date(viewRejectedModal.item.rejected_at).toLocaleString() : '—'}</span></p>
                </div>
                <div className="col-span-full mt-2 border-t border-orange-200 pt-2">
                  <p className="text-sm font-bold text-gray-700 mb-1">Rejection Reason:</p>
                  <div className="p-3 bg-white rounded-lg border border-orange-200 text-sm text-red-700 italic leading-relaxed shadow-sm">
                    `{viewRejectedModal.item.rejected_reason}`
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-900 uppercase mb-3 px-1 flex items-center gap-2">
                <Icon icon="hugeicons:table-02" className="w-4 h-4 text-gray-500" />
                Cadet Result Breakdown
              </h3>
              <div className="overflow-x-auto rounded-lg border border-black mb-6">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th rowSpan={3} className="border border-b-0 border-l-0 border-black px-2 py-2 text-center align-middle">BD/No</th>
                      <th rowSpan={3} className="border border-b-0 border-black px-2 py-2 text-center align-middle font-bold">Name</th>
                      <th colSpan={
                        groupKeys.reduce((acc, key) => acc + getGroupColSpan(markGroups[key]), 0)
                      } className="border border-b-0 border-black px-2 py-1 text-center uppercase font-bold">
                        Marks Obtained
                      </th>
                      {hasWeightedLogic && (
                        <th rowSpan={3} className="border border-b-0 border-r-0 border-black px-2 py-2 text-center align-middle font-bold">
                          Total<br />{totalMaxMarks}
                        </th>
                      )}
                    </tr>
                    <tr className="bg-gray-50">
                      {groupKeys.map(key => {
                        const colSpan = getGroupColSpan(markGroups[key]);
                        const groupLabel = key === 'classtest' ? 'Class Test' :
                          key === 'quiztest' ? 'Quiz Test' :
                            key === 'midsemester' ? 'Mid Semester' :
                              key === 'endsemester' ? 'End Semester' :
                                key.replace(/([A-Z])/g, ' $1').trim();
                        if (colSpan === 1) {
                          const sm = markGroups[key][0];
                          const pct = parseFloat(String(sm.percentage || 0));
                          return (
                            <th key={key} rowSpan={2} className="border border-black px-2 py-0.5 text-center capitalize font-bold align-middle">
                              <div className="text-[9px]">{sm.name}</div>
                              <div className="text-[9px]">({pct % 1 === 0 ? pct : pct.toFixed(2)}%)</div>
                            </th>
                          );
                        }
                        const groupTotal = markGroups[key].reduce((acc, m) => acc + parseFloat(String(m.percentage || 0)), 0);
                        return (
                          <th key={key} colSpan={colSpan} className="border border-black px-2 py-0.5 text-center capitalize font-bold">
                            {groupLabel}<br />
                            <span className="text-[10px] font-normal">({groupTotal % 1 === 0 ? groupTotal : groupTotal.toFixed(2)}%)</span>
                          </th>
                        );
                      })}
                    </tr>
                    <tr className="bg-gray-50">
                      {groupKeys.flatMap(key => {
                        if (getGroupColSpan(markGroups[key]) === 1) return [];
                        return markGroups[key].map(sm => {
                          const estimate = parseFloat(String(sm.estimate_mark || 0));
                          const percentage = parseFloat(String(sm.percentage || 0));
                          const isDiff = !sm.is_combined && estimate !== percentage;
                          return isDiff ? (
                            <React.Fragment key={sm.id}>
                              <th className="border border-t-0 border-black px-2 py-0.5 text-center text-[9px] font-bold">{sm.name} <br /> ({estimate})</th>
                              <th className="border border-t-0 border-black px-2 py-0.5 text-center text-[9px] font-bold">{percentage}% of Obt. Mks.</th>
                            </React.Fragment>
                          ) : (
                            <th key={sm.id} className="border border-t-0 border-black px-2 py-0.5 text-center text-[9px] font-bold">{sm.name} <br /> ({percentage})</th>
                          );
                        });
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const cadet = result.result_getting_cadets?.find(c => c.cadet_id === viewRejectedModal.item.cadet_id);
                      if (!cadet) return null;
                      return (
                        <tr className="bg-white">
                          <td className="border border-l-0 border-black px-2 py-2 text-center font-mono">{cadet.cadet_bd_no}</td>
                          <td className="border border-black px-2 py-2 font-bold text-gray-900">{cadet.cadet?.name || "N/A"}</td>

                          {groupKeys.map(key =>
                            markGroups[key].map(sm => {
                              const estimate = parseFloat(String(sm.estimate_mark || 0));
                              const percentage = parseFloat(String(sm.percentage || 0));
                              if (sm.is_combined) {
                                return (
                                  <td key={sm.id} className="border border-black px-2 py-2 text-center font-bold">{cadet.is_present ? getCadetMark(cadet, sm.id).toFixed(2) : "—"}</td>
                                );
                              }
                              const isDiff = estimate !== percentage;
                              const obtained = getCadetMark(cadet, sm.id);
                              const weighted = getWeightedMark(cadet, sm);
                              return isDiff ? (
                                <React.Fragment key={sm.id}>
                                  <td className="border border-black px-2 py-2 text-center">{cadet.is_present ? obtained.toFixed(2) : "—"}</td>
                                  <td className="border border-black px-2 py-2 text-center font-bold text-blue-700">{cadet.is_present ? weighted.toFixed(2) : "—"}</td>
                                </React.Fragment>
                              ) : (
                                <td key={sm.id} className="border border-black px-2 py-2 text-center font-bold">{cadet.is_present ? obtained.toFixed(2) : "—"}</td>
                              );
                            })
                          )}

                          {hasWeightedLogic && (
                            <td className="border border-r-0 border-black px-2 py-2 text-center font-bold bg-blue-50/50">
                              {cadet.is_present ? Math.ceil(calculateTotalMarks(cadet)) : "—"}
                            </td>
                          )}
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setViewRejectedModal({ open: false, item: null })}
              className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
            >
              Close Details
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Marks Modal */}
      <Modal
        isOpen={editMarksModal.open}
        onClose={() => !editMarksModal.loading && setEditMarksModal({ open: false, item: null, marks: {}, loading: false, error: "" })}
        showCloseButton
        className="max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-thin"
      >
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="flex justify-center mb-2"><FullLogo /></div>
            <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
            <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Update Cadet Marks</h2>
          </div>

          {editMarksModal.item && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
              <div>
                <p className="text-[10px] text-gray-800 uppercase font-bold mb-0.5">Name</p>
                <p className="font-semibold text-gray-900">{editMarksModal.item.cadet_name}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-800 uppercase font-bold mb-0.5">BD No</p>
                <p className="font-mono font-semibold text-gray-900">{editMarksModal.item.cadet_bd_no}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-800 uppercase font-bold mb-0.5">Rank</p>
                <p className="font-semibold text-gray-900">{editMarksModal.item.cadet_rank}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-800 uppercase font-bold mb-0.5">Branch</p>
                <p className="font-semibold text-gray-900">{editMarksModal.item.cadet_branch}</p>
              </div>
            </div>
          )}

          {/* Marks Table — same layout as ResultForm */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                {/* Row 1 — group headers */}
                <tr>
                  {groupKeys.map(key => (
                    <th
                      key={key}
                      className="border border-black px-3 py-2 text-center font-semibold uppercase"
                      colSpan={getGroupColSpan(markGroups[key])}
                    >
                      {key === 'classtest' ? 'Class Test' :
                        key === 'quiztest' ? 'Quiz Test' :
                          key === 'midsemester' ? 'Mid Semester' :
                            key === 'endsemester' ? 'End Semester' :
                              key.replace(/([A-Z])/g, ' $1').trim()}
                    </th>
                  ))}
                  <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={3}>TOTAL</th>
                </tr>
                {/* Row 2 — mark names */}
                <tr>
                  {groupKeys.flatMap(key =>
                    markGroups[key].map(sm => (
                      <th key={sm.id}
                        className="border border-black px-2 py-2 text-center"
                        colSpan={!sm.is_combined && Number(sm.estimate_mark) !== Number(sm.percentage) ? 2 : 1}
                      >
                        <div className="text-xs font-medium uppercase">{sm.name}</div>
                      </th>
                    ))
                  )}
                </tr>
                {/* Row 3 — sub-labels */}
                <tr>
                  {groupKeys.flatMap(key =>
                    markGroups[key].map(sm => {
                      if (!sm.is_combined && Number(sm.estimate_mark) !== Number(sm.percentage)) {
                        return (
                          <React.Fragment key={`sub-${sm.id}`}>
                            <th className="border border-black px-1 py-1 text-center">{Number(sm.estimate_mark).toFixed(0)}</th>
                            <th className="border border-black px-1 py-1 text-center">{Number(sm.percentage).toFixed(0)}</th>
                          </React.Fragment>
                        );
                      }
                      return (
                        <th key={`sub-${sm.id}`} className="border border-black px-1 py-1 text-center">
                          {Number(sm.percentage).toFixed(0)}
                        </th>
                      );
                    })
                  )}
                </tr>
              </thead>
              <tbody>
                {editMarksModal.item && (() => {
                  const rowTotal = groupKeys.reduce((acc, key) => {
                    return acc + markGroups[key].reduce((gAcc, sm) => {
                      if (refMarkIds.has(sm.id)) return gAcc;
                      if (sm.is_combined) return gAcc + calcCombinedFromInputs(sm, editMarksModal.marks);
                      const inputMark = parseFloat(String(editMarksModal.marks[sm.id] ?? 0)) || 0;
                      let adjusted = inputMark;
                      if (Number(sm.estimate_mark) !== Number(sm.percentage) && sm.estimate_mark > 0) {
                        adjusted = (inputMark / sm.estimate_mark) * sm.percentage;
                      }
                      return gAcc + adjusted;
                    }, 0);
                  }, 0);

                  return (
                    <tr className="hover:bg-gray-50">
                      {groupKeys.flatMap(key =>
                        markGroups[key].map(sm => {
                          const inputMark = editMarksModal.marks[sm.id] ?? 0;
                          const isSplit = !sm.is_combined && Number(sm.estimate_mark) !== Number(sm.percentage);
                          const convertedValue = isSplit && sm.estimate_mark > 0
                            ? (parseFloat(String(inputMark)) / sm.estimate_mark) * sm.percentage
                            : 0;

                          if (sm.is_combined) {
                            const combinedVal = calcCombinedFromInputs(sm, editMarksModal.marks);
                            return (
                              <td key={sm.id} className="border border-black px-2 py-1 text-center font-bold bg-blue-50 text-blue-800">
                                {combinedVal.toFixed(2)}
                              </td>
                            );
                          }

                          if (isSplit) {
                            return (
                              <React.Fragment key={sm.id}>
                                <td className="border border-black px-2 py-1 text-center">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="[0-9]*\.?[0-9]*"
                                    value={inputMark !== undefined ? inputMark : ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                        const num = parseFloat(val);
                                        setEditMarksModal(prev => ({
                                          ...prev,
                                          marks: { ...prev.marks, [sm.id]: isNaN(num) ? 0 : Math.min(num, sm.estimate_mark) }
                                        }));
                                      }
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm font-bold focus:ring-0 focus:outline-none bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="0"
                                  />
                                </td>
                                <td className="border border-black px-2 py-1 text-center text-gray-900">
                                  {convertedValue.toFixed(2)}
                                </td>
                              </React.Fragment>
                            );
                          }
                          return (
                            <td key={sm.id} className="border border-black px-2 py-1 text-center">
                              <input
                                type="text"
                                inputMode="decimal"
                                pattern="[0-9]*\.?[0-9]*"
                                value={inputMark !== undefined ? inputMark : ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                    const num = parseFloat(val);
                                    setEditMarksModal(prev => ({
                                      ...prev,
                                      marks: { ...prev.marks, [sm.id]: isNaN(num) ? 0 : Math.min(num, sm.estimate_mark) }
                                    }));
                                  }
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm font-bold focus:ring-0 focus:outline-none bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0"
                              />
                            </td>
                          );
                        })
                      )}
                      <td className="border border-black px-3 py-2 text-center whitespace-nowrap font-black">
                        {(Number(rowTotal) || 0).toFixed(2)} ~ {Math.ceil(Number(rowTotal) || 0)}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>

          {editMarksModal.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {editMarksModal.error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={() => setEditMarksModal({ open: false, item: null, marks: {}, loading: false, error: "" })}
              disabled={editMarksModal.loading}
              className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMarks}
              disabled={editMarksModal.loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 shadow-md hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {editMarksModal.loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
              Save & Auto-Resubmit
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
