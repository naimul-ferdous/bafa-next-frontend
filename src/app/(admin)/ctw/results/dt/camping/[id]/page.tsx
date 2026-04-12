/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwDrillResultService } from "@/libs/services/ctwDrillResultService";
import { ctwCommonService } from "@/libs/services/ctwCommonService";
import { ctwApprovalService } from "@/libs/services/ctwApprovalService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import { Modal } from "@/components/ui/modal/index";
import type { CtwDrillResult } from "@/libs/types/ctwDrill";
import { getOrdinal } from "@/libs/utils/formatter";

const CAMPING_MODULE_CODE = "camping";

export default function CampingResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const resultId = params?.id as string;

  const [result, setResult] = useState<CtwDrillResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [campingModuleId, setCampingModuleId] = useState<number | null>(null);
  const [moduleLoading, setModuleLoading] = useState(true);

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

  const [moduleApprovalModal, setModuleApprovalModal] = useState<{
    open: boolean;
    status: "approved" | "rejected";
    rejectedReason: string;
    loading: boolean;
    error: string;
  }>({ open: false, status: "approved", rejectedReason: "", loading: false, error: "" });

  // Fetch campingModuleId
  useEffect(() => {
    if (!user?.id) return;
    const fetchModuleId = async () => {
      try {
        setModuleLoading(true);
        const options = await ctwCommonService.getCampingFormOptions(user?.id || 0);
        if (options?.module) {
          setCampingModuleId(options.module.id);
        } else {
          setCampingModuleId(null);
          setError("Module not found.");
        }
      } catch {
        setCampingModuleId(null);
        setError("Failed to fetch module ID.");
      } finally {
        setModuleLoading(false);
      }
    };
    if (user?.id) fetchModuleId();
  }, [user?.id]);

  const loadData = useCallback(async () => {
    if (campingModuleId === null || resultId === undefined) return;
    try {
      setLoading(true);
      const data = await ctwDrillResultService.getResult(campingModuleId, parseInt(resultId));
      if (data) {
        if ((data as any).cadet_approvals) {
          (data as any).cadet_approvals.sort((a: any, b: any) => b.id - a.id);
        }
        if ((data as any).module_approvals) {
          (data as any).module_approvals.sort((a: any, b: any) => b.id - a.id);
        }
        setResult(data);
        setSelectedCadetIds([]);
      } else {
        setError("Result not found");
      }
    } catch (err) {
      console.error("Failed to load result:", err);
      setError("Failed to load result data");
    } finally {
      setLoading(false);
    }
  }, [resultId, campingModuleId]);

  useEffect(() => {
    if (!moduleLoading && resultId) loadData();
  }, [resultId, moduleLoading, loadData]);

  // --- Authority / permission logic ---
  const approvalAuthorities = (result as any)?.approval_authorities ?? [];
  const primaryRoleIds = (user as any)?.roles?.filter((r: any) => r.pivot?.is_primary).map((r: any) => r.id) ?? [];
  const allRoleIds = (user as any)?.roles?.map((r: any) => r.id) ?? [];
  const userRoleIds = primaryRoleIds.length > 0 ? primaryRoleIds : allRoleIds;
  const userId = user?.id;

  const myAuthority = approvalAuthorities.find((a: any) =>
    (a.user_id && a.user_id === userId) || (a.role_id && userRoleIds.includes(a.role_id))
  ) ?? null;

  const canApprove = (() => {
    return approvalAuthorities.some((a: any) => {
      const hasPermission = a.is_initial_cadet_approve || a.is_cadet_approve;
      if (!hasPermission) return false;
      if (a.user_id && a.user_id === userId) return true;
      if (a.role_id && userRoleIds.includes(a.role_id)) return true;
      return false;
    });
  })();

  const canInitialForward = (() => {
    return approvalAuthorities.some((a: any) => {
      if (!a.is_initial_cadet_approve || !a.is_active) return false;
      if (a.user_id && a.user_id === userId) return true;
      if (a.role_id && userRoleIds.includes(a.role_id)) return true;
      return false;
    });
  })();

  const cadetApprovals = (result as any)?.cadet_approvals ?? [];
  const isForwarded = ((result as any)?.module_approvals?.length ?? 0) > 0;

  const allCadetsApproved = (() => {
    const marks = result?.achieved_marks ?? [];
    if (marks.length === 0) return false;
    const authorityId = (myAuthority as any)?.id;
    return marks.every((m: any) => {
      const approval =
        cadetApprovals.find((a: any) => a.cadet_id === m.cadet_id && a.authority_id === authorityId) ??
        (canInitialForward ? cadetApprovals.find((a: any) => a.cadet_id === m.cadet_id && !a.authority_id) : undefined);
      return approval?.status === "approved";
    });
  })();

  const isMyTurn = canInitialForward ? !isForwarded : (((result as any)?.module_approvals?.find((sa: any) => sa.authority_id === (myAuthority as any)?.id))?.status === "pending");
  const canApproveAction = canApprove && isMyTurn;

  const allCadetsApprovedByMe = (() => {
    if (!myAuthority) return false;
    const marks = result?.achieved_marks ?? [];
    if (marks.length === 0) return false;
    return marks.every((m: any) => {
      const a = cadetApprovals.find((ap: any) => ap.cadet_id === m.cadet_id && ap.authority_id === (myAuthority as any).id);
      return a?.status === "approved";
    });
  })();

  const myModuleApproval = myAuthority
    ? (result as any)?.module_approvals?.find((sa: any) => sa.authority_id === (myAuthority as any).id)
    : null;
  const isModuleApproved = myModuleApproval?.status === "approved";

  const canApproveModule = canApprove && isMyTurn && allCadetsApprovedByMe && !isModuleApproved && !canInitialForward;
  const showForwardButton = canInitialForward && !isForwarded && allCadetsApproved;

  const getNextAuthority = useCallback(() => {
    const sorted = [...approvalAuthorities].filter((a: any) => a.is_active).sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
    if (!myAuthority) return sorted.find((a: any) => !a.is_initial_cadet_approve) ?? null;
    return sorted.find((a: any) => (a.sort ?? 0) > ((myAuthority as any).sort ?? 0)) ?? null;
  }, [approvalAuthorities, myAuthority]);

  // Chain authorities for visible timeline
  const chainAuthorities = useMemo(() => {
    return [...approvalAuthorities].sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
  }, [approvalAuthorities]);

  const visibleAuthorities = myAuthority
    ? chainAuthorities.filter((a: any) => (a.sort ?? 0) <= ((myAuthority as any).sort ?? 0))
    : [];

  const getCadetApprovalStatus = (cadetId: number) => {
    const authorityId = (myAuthority as any)?.id;
    const approval = cadetApprovals.find((a: any) =>
      Number(a.cadet_id) === Number(cadetId) &&
      (Number(a.authority_id) === Number(authorityId) || (canInitialForward && !a.authority_id)) &&
      a.is_active
    );
    return approval?.status ?? "pending";
  };

  const getCadetApprovalRecord = (cadetId: number) => {
    const authorityId = (myAuthority as any)?.id;
    return cadetApprovals.find((a: any) =>
      Number(a.cadet_id) === Number(cadetId) &&
      (Number(a.authority_id) === Number(authorityId) || (canInitialForward && !a.authority_id)) &&
      a.is_active
    );
  };

  const pendingCadetIds = (result?.achieved_marks ?? [])
    ?.filter((m: any) => {
      if (!myAuthority) return false;
      const approval = cadetApprovals.find((a: any) =>
        Number(a.cadet_id) === Number(m.cadet_id) &&
        (Number(a.authority_id) === Number((myAuthority as any).id) || (canInitialForward && !a.authority_id)) &&
        a.is_active
      );
      return !approval || approval.status === "pending";
    })
    .map((m: any) => m.cadet_id) ?? [];

  const allPendingSelected =
    pendingCadetIds.length > 0 &&
    pendingCadetIds.every((id: number) => selectedCadetIds.includes(id));

  const toggleCadet = (cadetId: number) => {
    setSelectedCadetIds(prev => prev.includes(cadetId) ? prev.filter(id => id !== cadetId) : [...prev, cadetId]);
  };

  const toggleSelectAll = () => {
    setSelectedCadetIds(allPendingSelected ? [] : pendingCadetIds);
  };

  const openApprovalModal = (cadetIds: number[]) => {
    setApprovalModal({ open: true, cadetIds, status: "approved", rejectedReason: "", loading: false, error: "" });
  };

  // --- Actions ---
  const confirmApproval = async () => {
    if (!result || !campingModuleId) return;
    if (approvalModal.status === "rejected" && !approvalModal.rejectedReason.trim()) {
      setApprovalModal(prev => ({ ...prev, error: "Rejection reason is required." }));
      return;
    }
    setApprovalModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      await ctwApprovalService.approveCadets({
        course_id: result.course_id,
        semester_id: result.semester_id,
        module_id: campingModuleId,
        ctw_result_id: result.id,
        cadet_ids: approvalModal.cadetIds,
        authority_id: (myAuthority as any)?.id ?? null,
        status: approvalModal.status,
        rejected_reason: approvalModal.status === "rejected" ? approvalModal.rejectedReason : undefined,
      });
      setApprovalModal({ open: false, cadetIds: [], status: "approved", rejectedReason: "", loading: false, error: "" });
      setSelectedCadetIds([]);
      await loadData();
    } catch (err: any) {
      const msg = err?.errors
        ? Object.values(err.errors).flat().join(" ")
        : err?.message || "Failed to update approval status.";
      setApprovalModal(prev => ({ ...prev, loading: false, error: msg }));
    }
  };

  const confirmForward = async () => {
    if (!result || !campingModuleId) return;
    setForwardModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      const nextAuth = getNextAuthority();
      await ctwApprovalService.forwardModule({
        course_id: result.course_id,
        semester_id: result.semester_id,
        module_id: campingModuleId,
        ctw_result_id: result.id,
        authority_ids: nextAuth ? [nextAuth.id] : [],
      });
      setForwardModal({ open: false, loading: false, error: "" });
      await loadData();
    } catch (err: any) {
      const msg = err?.message || "Failed to forward result.";
      setForwardModal(prev => ({ ...prev, loading: false, error: msg }));
    }
  };

  const confirmModuleApproval = async () => {
    if (!result || !campingModuleId) return;
    if (moduleApprovalModal.status === "rejected" && !moduleApprovalModal.rejectedReason.trim()) {
      setModuleApprovalModal(prev => ({ ...prev, error: "Rejected reason is required." }));
      return;
    }
    setModuleApprovalModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      const nextAuthority = getNextAuthority();
      await ctwApprovalService.approveModule({
        course_id: result.course_id,
        semester_id: result.semester_id,
        module_id: campingModuleId,
        ctw_result_id: result.id,
        status: moduleApprovalModal.status,
        rejected_reason: moduleApprovalModal.status === "rejected" ? moduleApprovalModal.rejectedReason : undefined,
        cadet_ids: (result?.achieved_marks ?? []).map((m: any) => m.cadet_id),
        authority_id: (myAuthority as any)?.id ?? null,
        authority_ids: nextAuthority ? [nextAuthority.id] : [],
      });
      setModuleApprovalModal(prev => ({ ...prev, open: false, loading: false }));
      await loadData();
    } catch (err: any) {
      const msg = err?.message || "Failed to update module approval.";
      setModuleApprovalModal(prev => ({ ...prev, loading: false, error: msg }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate total marks
  const calculateTotalMarks = () => {
    if (!result?.achieved_marks) return 0;
    return result.achieved_marks.reduce((sum, mark) => sum + parseFloat(String(mark.achieved_mark || 0)), 0);
  };

  // Ranking with position and remarks
  const rankedMarks = useMemo(() => {
    if (!result?.achieved_marks) return [];
    const sorted = [...result.achieved_marks].map(m => ({
      ...m,
      markVal: parseFloat(String(m.achieved_mark || 0)),
    }));
    sorted.sort((a, b) => b.markVal - a.markVal);
    sorted.forEach((item, idx) => {
      if (idx === 0) {
        (item as any).position = 1;
      } else if (item.markVal === sorted[idx - 1].markVal) {
        (item as any).position = (sorted[idx - 1] as any).position;
      } else {
        (item as any).position = idx + 1;
      }
      (item as any).remark = "-";
    });
    return sorted;
  }, [result?.achieved_marks]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
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
            onClick={() => router.push("/ctw/results/dt/camping")}
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
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ctw/results/dt/camping")}
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
          {isModuleApproved && !canInitialForward && canApprove && (
            <span className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-green-50 text-green-700 border border-green-200">
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              Module Approved
            </span>
          )}
          {canApproveModule && (
            <button
              onClick={() => setModuleApprovalModal({ open: true, status: "approved", rejectedReason: "", loading: false, error: "" })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
            >
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              Approve Module
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => router.push(`/ctw/results/dt/camping/${result.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Result
          </button>
        </div>
      </div>

      {/* Content */}
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
            CTW Camping Result Sheet
          </p>
        </div>

        {/* Result Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Result Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Course</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.course?.name || "N/A"} ({result.course?.code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Semester</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.semester?.name || "N/A"} ({result.semester?.code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Program</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.program?.name || "N/A"} ({result.program?.code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Branch</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.branch?.name || "N/A"} ({result.branch?.code || "N/A"})</span>
            </div>
            {result.group && (
              <div className="flex">
                <span className="w-48 text-gray-900 font-medium">Group</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1">{result.group.name} ({result.group.code})</span>
              </div>
            )}
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Exam Type</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.exam_type?.name || "N/A"}</span>
            </div>
            {result.remarks && (
              <div className="flex col-span-2">
                <span className="w-48 text-gray-900 font-medium">Remarks</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1">{result.remarks}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cadets Marks Table */}
        {result.achieved_marks && result.achieved_marks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
              Cadets Marks
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    {canApproveAction && pendingCadetIds.length > 0 && (
                      <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle no-print">
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
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Ser</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">BD/No</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Rank</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Name</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Branch</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Instructor</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle text-blue-700">Achieved Mark</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Position</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Remarks</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle no-print">Status</th>
                    {canApproveAction && !isForwarded && (
                      <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle no-print">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rankedMarks.map((mark, index) => {
                    const approval = getCadetApprovalRecord(mark.cadet_id);
                    const status = getCadetApprovalStatus(mark.cadet_id);
                    const isPending = status === "pending";
                    return (
                      <tr key={mark.id}>
                        {canApproveAction && pendingCadetIds.length > 0 && (
                          <td className="border border-black px-2 py-2 text-center no-print">
                            {isPending ? (
                              <input
                                type="checkbox"
                                checked={selectedCadetIds.includes(mark.cadet_id)}
                                onChange={() => toggleCadet(mark.cadet_id)}
                                className="w-4 h-4"
                              />
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        )}
                        <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                        <td className="border border-black px-2 py-2 text-center">{mark.cadet?.bd_no || mark.cadet?.cadet_number || "N/A"}</td>
                        <td className="border border-black px-2 py-2 text-center">
                          {mark.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank?.short_name ||
                           mark.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank?.name ||
                           "Officer Cadet"}
                        </td>
                        <td className="border border-black px-2 py-2 font-medium">{mark.cadet?.name || "N/A"}</td>
                        <td className="border border-black px-2 py-2 text-center">{mark.cadet?.assigned_branchs?.find((b: any) => b.is_current)?.branch?.name || result.branch?.name || "N/A"}</td>
                        <td className="border border-black px-2 py-2 text-center">
                          {result.instructor?.name || "N/A"}
                          <div className="text-xs text-gray-500">{result.instructor?.service_number || ""}</div>
                        </td>
                        <td className="border border-black px-2 py-2 text-center text-blue-700 font-bold">
                          {parseFloat(String(mark.achieved_mark || 0)).toFixed(2)}
                        </td>
                        <td className="border border-black px-2 py-2 text-center">
                          {getOrdinal((mark as any).position)}
                        </td>
                        <td className={`border border-black px-2 py-2 text-center ${(mark as any).remark === "Failed" ? "text-red-600" : "text-gray-400"}`}>
                          {(mark as any).remark}
                        </td>
                        {/* Status — per-authority timeline */}
                        <td className="border border-black px-2 py-2 no-print">
                          {visibleAuthorities.length === 0 ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-gray-500 font-bold">Status:</span>
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {visibleAuthorities.map((authority: any, idx: number) => {
                                const label = authority.role?.name || authority.user?.name || `Step ${idx + 1}`;
                                const colors: Record<string, string> = {
                                  pending: "bg-yellow-100 text-yellow-800",
                                  approved: "bg-green-100 text-green-800",
                                  rejected: "bg-red-100 text-red-800",
                                };
                                const allMatchingRecords = cadetApprovals.filter((a: any) => {
                                  return Number(a.cadet_id) === Number(mark.cadet_id) &&
                                    (Number(a.authority_id) === Number(authority.id) || (authority.is_initial_cadet_approve && !a.authority_id));
                                });
                                if (allMatchingRecords.length === 0) {
                                  const authModuleApproval = (result as any)?.module_approvals?.find((sa: any) => Number(sa.authority_id) === Number(authority.id));
                                  if (authModuleApproval) {
                                    return (
                                      <div key={authority.id} className="flex items-center gap-1">
                                        <span className="text-[9px] text-gray-500 truncate max-w-[80px]" title={label}>{label}:</span>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase ${colors[authModuleApproval.status] ?? ""}`}>
                                          {authModuleApproval.status} (Mod)
                                        </span>
                                      </div>
                                    );
                                  }
                                  return <div key={authority.id} className="flex items-center gap-1"><span className="text-[9px] text-gray-500 font-bold">{label}:</span> <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase bg-yellow-100 text-yellow-800">Pending</span></div>;
                                }
                                const latestRec = allMatchingRecords[0];
                                const st = latestRec.status;
                                return (
                                  <div key={authority.id} className="flex items-center gap-1">
                                    <span className="text-[9px] text-gray-500 font-bold">{label}:</span>
                                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase ${colors[st] ?? ""}`}>
                                      {st}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        {/* Action */}
                        {canApproveAction && !isForwarded && (
                          <td className="border border-black px-2 py-2 text-center no-print">
                            {isPending ? (
                              <button
                                onClick={() => openApprovalModal([mark.cadet_id])}
                                className="px-2 py-1 text-[10px] font-semibold bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Approve
                              </button>
                            ) : status === "approved" ? (
                              <button
                                onClick={() => openApprovalModal([mark.cadet_id])}
                                className="px-2 py-1 text-[10px] font-semibold bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                              >
                                Change
                              </button>
                            ) : null}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {/* Total Row */}
                  <tr className="font-semibold">
                    <td colSpan={7} className="border border-black px-2 py-2 text-center font-bold">TOTAL</td>
                    <td className="border border-black px-2 py-2 text-center text-blue-700 font-bold">
                      {calculateTotalMarks().toFixed(2)}
                    </td>
                    <td colSpan={canApproveAction ? 4 : 3} className="border border-black px-2 py-2 no-print"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            System Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className={`flex-1 ${result.is_active ? "text-green-600" : "text-red-600"}`}>
                {result.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created By</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.creator?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created At</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {result.created_at ? new Date(result.created_at).toLocaleString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Last Updated</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {result.updated_at ? new Date(result.updated_at).toLocaleString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer with date */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {/* Approval Modal */}
      <Modal
        isOpen={approvalModal.open}
        onClose={() => setApprovalModal(prev => ({ ...prev, open: false }))}
        showCloseButton
        className="max-w-lg"
      >
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="flex justify-center mb-2"><FullLogo /></div>
            <h1 className="text-lg font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
            <p className="text-sm font-medium text-gray-700 uppercase">CTW Camping</p>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {approvalModal.cadetIds.length === 1 ? "Cadet Approval" : `Cadets Approval (${approvalModal.cadetIds.length} cadets)`}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Module: <span className="font-medium text-gray-700">Camping</span>
          </p>

          {/* Cadet list preview */}
          {approvalModal.cadetIds.length > 0 && result?.achieved_marks && (
            <div className="mb-4 overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-2 py-1 text-center">Ser</th>
                    <th className="border border-gray-200 px-2 py-1 text-center">BD/No</th>
                    <th className="border border-gray-200 px-2 py-1 text-left">Name</th>
                    <th className="border border-gray-200 px-2 py-1 text-center">Mark</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalModal.cadetIds.map((cadetId, idx) => {
                    const mark = result.achieved_marks?.find(m => m.cadet_id === cadetId);
                    if (!mark) return null;
                    return (
                      <tr key={cadetId} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                        <td className="border border-gray-200 px-2 py-1 text-center">{idx + 1}</td>
                        <td className="border border-gray-200 px-2 py-1 text-center font-mono">{mark.cadet?.bd_no || mark.cadet?.cadet_number || "N/A"}</td>
                        <td className="border border-gray-200 px-2 py-1 font-bold text-gray-900">{mark.cadet?.name || "N/A"}</td>
                        <td className="border border-gray-200 px-2 py-1 text-center font-bold text-blue-700">{parseFloat(String(mark.achieved_mark || 0)).toFixed(2)}</td>
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
                  onClick={() => setApprovalModal(prev => ({ ...prev, status: s, rejectedReason: "", error: "" }))}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold capitalize transition-colors ${
                    approvalModal.status === s
                      ? s === "approved"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-red-600 text-white border-red-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {s === "approved" ? "Approve" : "Reject"}
                </button>
              ))}
            </div>
          )}

          {approvalModal.status === "rejected" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={approvalModal.rejectedReason}
                onChange={(e) => setApprovalModal(prev => ({ ...prev, rejectedReason: e.target.value }))}
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
              onClick={() => setApprovalModal(prev => ({ ...prev, open: false }))}
              disabled={approvalModal.loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmApproval}
              disabled={approvalModal.loading}
              className={`px-6 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 ${
                approvalModal.status === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {approvalModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              {approvalModal.status === "approved" ? "Confirm Approve" : "Confirm Reject"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Forward Modal */}
      <Modal
        isOpen={forwardModal.open}
        onClose={() => setForwardModal(prev => ({ ...prev, open: false }))}
        showCloseButton
        className="max-w-lg"
      >
        <div className="p-6">
          <div className="flex items-center gap-1 mb-4">
            <div className="flex items-center justify-center w-12 h-12">
              <img src="/images/logo/logo.png" alt="BAFA Logo" width={50} height={50} className="dark:hidden" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Forward to Higher Authority</h2>
              <p className="text-xs text-gray-500">Initial module result forwarding</p>
            </div>
          </div>

          {result && (
            <div className="mb-5 rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
              {([
                ["Course", result.course?.name || "\u2014"],
                ["Semester", result.semester?.name || "\u2014"],
                ["Program", result.program?.name || "\u2014"],
                ["Module", "Camping"],
                ["Exam Type", result.exam_type?.name || "\u2014"],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex px-4 py-2.5">
                  <span className="w-28 text-gray-500 shrink-0">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          )}

          {myAuthority && (
            <div className="flex justify-between items-center gap-2 mb-4">
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-1">Your Authority Level</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{(myAuthority as any).role?.name}</span>
                </div>
              </div>
              <Icon icon="hugeicons:arrow-right-02" className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-1">Next Authority Level</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{getNextAuthority()?.role?.name || "\u2014"}</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-5">
            This will mark the module result as forwarded to the higher authority for further review and approval.
          </p>

          {forwardModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {forwardModal.error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
            <button
              onClick={() => setForwardModal(prev => ({ ...prev, open: false }))}
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

      {/* Module Approval Modal */}
      <Modal
        isOpen={moduleApprovalModal.open}
        onClose={() => setModuleApprovalModal(prev => ({ ...prev, open: false }))}
        showCloseButton
        className="max-w-lg"
      >
        <div className="p-6">
          <div className="flex items-center gap-1 mb-4">
            <div className="flex items-center justify-center w-12 h-12">
              <img src="/images/logo/logo.png" alt="BAFA Logo" width={50} height={50} className="dark:hidden" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Module Approval</h2>
              <p className="text-xs text-gray-500">Approve module result at your authority level</p>
            </div>
          </div>

          {result && (
            <div className="mb-5 rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
              {([
                ["Course", result.course?.name || "\u2014"],
                ["Semester", result.semester?.name || "\u2014"],
                ["Program", result.program?.name || "\u2014"],
                ["Module", "Camping"],
                ["Exam Type", result.exam_type?.name || "\u2014"],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex px-4 py-2.5">
                  <span className="w-28 text-gray-500 shrink-0">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          )}

          {myAuthority && (
            <div className="flex justify-between items-center gap-2 mb-5">
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-1">Your Authority Level</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{(myAuthority as any).role?.name}</span>
                </div>
              </div>
              <Icon icon="hugeicons:arrow-right-02" className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-1">Next Authority Level</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{getNextAuthority()?.role?.name || "\u2014"}</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-5">
            This will approve the module result at your authority level and forward it to the next authority for further review.
          </p>

          {moduleApprovalModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {moduleApprovalModal.error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
            <button
              onClick={() => setModuleApprovalModal(prev => ({ ...prev, open: false }))}
              disabled={moduleApprovalModal.loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmModuleApproval}
              disabled={moduleApprovalModal.loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              {moduleApprovalModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              Confirm Approval
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
