/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwOneMileResultService } from "@/libs/services/ctwOneMileResultService";
import { ctwCommonService } from "@/libs/services/ctwCommonService";
import { ctwApprovalService } from "@/libs/services/ctwApprovalService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import { Modal } from "@/components/ui/modal/index";
import type { CtwOneMileResult } from "@/libs/types/ctwOneMile";

const TWO_KM_10_STATION_MODULE_CODE = "2_km_10_station";

export default function TwoKmTenStationResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;
  const { user } = useAuth();

  const [result, setResult] = useState<CtwOneMileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [twoKmTenModuleId, setTwoKmTenModuleId] = useState<number | null>(null);
  const [moduleLoading, setModuleLoading] = useState(true);

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

  const [rejectedPanelItems, setRejectedPanelItems] = useState<any[]>([]);
  const [rejectedPanelLoading, setRejectedPanelLoading] = useState(false);
  const [resubmitLoading, setResubmitLoading] = useState<number | null>(null);
  const [rejectDownModal, setRejectDownModal] = useState<{
    open: boolean; item: any | null; reason: string; loading: boolean; error: string;
  }>({ open: false, item: null, reason: "", loading: false, error: "" });

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

  useEffect(() => {
    if (!user?.id) return;
    const fetchModuleId = async () => {
      try {
        setModuleLoading(true);
        const options = await ctwCommonService.getTwoKmTenStationFormOptions(user?.id || 0);
        if (options?.module) {
          setTwoKmTenModuleId(options.module.id);
        } else {
          setTwoKmTenModuleId(null);
          setLoading(false);
          setError("Module not found.");
        }
      } catch {
        setTwoKmTenModuleId(null);
        setLoading(false);
        setError("Failed to fetch module ID.");
      } finally {
        setModuleLoading(false);
      }
    };
    fetchModuleId();
  }, [user?.id]);

  const loadData = useCallback(async () => {
    if (twoKmTenModuleId === null || resultId === undefined) return;
    try {
      setLoading(true);
      const data = await ctwOneMileResultService.getResult(twoKmTenModuleId, parseInt(resultId));
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
  }, [resultId, twoKmTenModuleId]);

  useEffect(() => {
    if (!moduleLoading && resultId) loadData();
  }, [resultId, moduleLoading, loadData]);

  const loadRejectedPanel = useCallback(async () => {
    if (!result || !twoKmTenModuleId) return;
    try {
      setRejectedPanelLoading(true);
      const items = await ctwApprovalService.getRejectedCadetPanel({
        course_id: result.course_id,
        semester_id: result.semester_id,
        module_id: twoKmTenModuleId,
      });
      setRejectedPanelItems(items);
    } catch {
      setRejectedPanelItems([]);
    } finally {
      setRejectedPanelLoading(false);
    }
  }, [result, twoKmTenModuleId]);

  useEffect(() => {
    loadRejectedPanel();
  }, [loadRejectedPanel]);

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

  const chainAuthorities = useMemo(() => {
    return [...approvalAuthorities].sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
  }, [approvalAuthorities]);

  const visibleAuthorities = myAuthority
    ? chainAuthorities.filter((a: any) => (a.sort ?? 0) <= ((myAuthority as any).sort ?? 0))
    : [];

  const lowerAuthorityEntry = (() => {
    if (!myAuthority) return null;
    const mySort = (myAuthority as any).sort ?? 0;
    return [...chainAuthorities].reverse().find((a: any) => (a.sort ?? 0) < mySort) ?? null;
  })();

  const lowerAuthorityReapprovedAfterRejection = (cadetId: number, myRejectionId: number): boolean => {
    if (!lowerAuthorityEntry || !cadetApprovals) return false;
    const lowerAuthId = (lowerAuthorityEntry as any).id;
    const isInitial = !!(lowerAuthorityEntry as any).is_initial_cadet_approve;
    return cadetApprovals.some((a: any) =>
      Number(a.cadet_id) === Number(cadetId) &&
      (isInitial ? (!a.authority_id || Number(a.authority_id) === Number(lowerAuthId)) : Number(a.authority_id) === Number(lowerAuthId)) &&
      a.status === "approved" &&
      a.id > myRejectionId
    );
  };

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

  const confirmApproval = async () => {
    if (!result || !twoKmTenModuleId) return;
    if (approvalModal.status === "rejected" && !approvalModal.rejectedReason.trim()) {
      setApprovalModal(prev => ({ ...prev, error: "Rejection reason is required." }));
      return;
    }
    setApprovalModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      await ctwApprovalService.approveCadets({
        course_id: result.course_id,
        semester_id: result.semester_id,
        module_id: twoKmTenModuleId,
        ctw_result_id: result.id,
        cadet_ids: approvalModal.cadetIds,
        authority_id: (myAuthority as any)?.id ?? null,
        status: approvalModal.status,
        rejected_reason: approvalModal.status === "rejected" ? approvalModal.rejectedReason : undefined,
      });
      setApprovalModal({ open: false, cadetIds: [], status: "approved", rejectedReason: "", loading: false, error: "" });
      setSelectedCadetIds([]);
      await loadData();
      await loadRejectedPanel();
    } catch (err: any) {
      const msg = err?.errors
        ? Object.values(err.errors).flat().join(" ")
        : err?.message || "Failed to update approval status.";
      setApprovalModal(prev => ({ ...prev, loading: false, error: msg }));
    }
  };

  const confirmForward = async () => {
    if (!result || !twoKmTenModuleId) return;
    setForwardModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      const nextAuth = getNextAuthority();
      await ctwApprovalService.forwardModule({
        course_id: result.course_id,
        semester_id: result.semester_id,
        module_id: twoKmTenModuleId,
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
    if (!result || !twoKmTenModuleId) return;
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
        module_id: twoKmTenModuleId,
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

  const handleRejectDown = async () => {
    if (!rejectDownModal.item) return;
    if (!rejectDownModal.reason.trim()) {
      setRejectDownModal(prev => ({ ...prev, error: "Rejection reason is required." }));
      return;
    }
    const item = rejectDownModal.item;
    setRejectDownModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      await ctwApprovalService.approveCadets({
        course_id: item.course_id,
        semester_id: item.semester_id,
        module_id: twoKmTenModuleId!,
        ctw_result_id: result?.id,
        cadet_ids: [item.cadet_id],
        authority_id: item.my_authority_id,
        status: "rejected",
        rejected_reason: rejectDownModal.reason,
      });
      setRejectDownModal({ open: false, item: null, reason: "", loading: false, error: "" });
      await loadRejectedPanel();
      await loadData();
    } catch (err: any) {
      setRejectDownModal(prev => ({ ...prev, loading: false, error: err?.message || "Failed to reject." }));
    }
  };

  const handleResubmit = (item: any) => {
    setResubmitModal({ open: true, item, loading: false, error: "" });
  };

  const handleConfirmResubmit = async () => {
    const item = resubmitModal.item;
    if (!item || !twoKmTenModuleId) return;
    setResubmitModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      await ctwApprovalService.resubmitRejectedCadet({
        course_id: item.course_id,
        semester_id: item.semester_id,
        module_id: twoKmTenModuleId,
        cadet_id: item.cadet_id,
      });
      setResubmitModal({ open: false, item: null, loading: false, error: "" });
      await loadRejectedPanel();
      await loadData();
    } catch (err: any) {
      setResubmitModal(prev => ({
        ...prev,
        loading: false,
        error: err?.message || "Failed to resubmit.",
      }));
    }
  };

  const handleApproveUpdated = async (item: any) => {
    try {
      setResubmitLoading(item.cadet_id);
      await ctwApprovalService.approveCadets({
        course_id: item.course_id,
        semester_id: item.semester_id,
        module_id: twoKmTenModuleId!,
        ctw_result_id: result?.id,
        cadet_ids: [item.cadet_id],
        authority_id: item.my_authority_id,
        status: "approved",
      });
      await loadRejectedPanel();
      await loadData();
    } catch {
      alert("Failed to approve cadet.");
    } finally {
      setResubmitLoading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const estimatedMark = (result as any)?.estimated_mark;
  const stationDetails: any[] = estimatedMark?.details ?? [];
  const conversationMark = estimatedMark?.conversation_mark;

  const getStationDataForCadet = (mark: any, stationDetailId: number) => {
    const detail = mark.details?.find((d: any) => d.ctw_results_module_estimated_marks_details_id === stationDetailId);
    return detail ?? null;
  };

  const hasStationData = stationDetails.length > 0;

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
            onClick={() => router.push("/ctw/results/pf/2km10station")}
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
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ctw/results/pf/2km10station")}
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
        </div>
      </div>

      <div className="p-8 cv-content">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
            CTW 2KM 10 Station Result Sheet
          </p>
        </div>

        {rejectedPanelItems.length > 0 && (
          <div className="mb-6 overflow-hidden no-print">
            <div className="flex items-center gap-2 py-2">
              <Icon icon="hugeicons:alert-02" className="w-5 h-5 text-orange-500" />
              Rejected Cadets
              <span className="ml-1 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                {rejectedPanelItems.length}
              </span>
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
                            <span className="truncate flex-1" title={item.rejected_reason || ""}>
                              {item.rejected_reason || "\u2014"}
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
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            item.state === "updated_pending_review" || item.state === "instructor_updated"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {item.message}
                          </span>
                        </td>
                        <td className="px-2 py-2 border border-orange-100 text-center">
                          <div className="flex items-center justify-center gap-1">
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
                                onClick={() => setRejectDownModal({ open: true, item, reason: "", loading: false, error: "" })}
                                className="px-2 py-1 text-[9px] bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-1"
                                title="Reject to lower authority"
                              >
                                <Icon icon="hugeicons:arrow-down-01" className="w-3 h-3" />
                                Reject
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

        {result.achieved_marks && result.achieved_marks.length > 0 && (
          <div className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    {canApproveAction && pendingCadetIds.length > 0 && (
                      <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={2}>
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
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>SL</th>
                    <th className="border border-black px-2 py-2 text-center align-middle whitespace-nowrap" rowSpan={2}>BD</th>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>Rk</th>
                    <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={2}>Name</th>
                    <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={2}>Br</th>
                    {hasStationData ? stationDetails.map((sd: any, i: number) => (
                      <th key={sd.id || i} className="border border-black px-1 py-1 text-center align-middle" colSpan={2}>
                        {sd.name}
                      </th>
                    )) : (
                      <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>Mark</th>
                    )}
                    {hasStationData && (
                      <>
                        <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>
                          Total {estimatedMark?.details?.reduce((sum: number, d: any) => sum + parseFloat(String(d.male_marks || 0)), 0) || ""}
                        </th>
                        <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>
                          Conv {estimatedMark?.conversation_mark ? `(${estimatedMark.conversation_mark})` : ""}
                        </th>
                      </>
                    )}
                    {canApprove && (
                      <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={2}>Status</th>
                    )}
                    {canApproveAction && !isForwarded && (
                      <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={2}>Action</th>
                    )}
                  </tr>
                  {hasStationData && (
                    <tr>
                      {stationDetails.map((sd: any, i: number) => {
                        const firstMark = result.achieved_marks?.[0];
                        const detail = firstMark?.details?.find((d: any) => d.ctw_results_module_estimated_marks_details_id === sd.id);
                        const isTimeBased = !!detail?.achieved_time;
                        return (
                          <React.Fragment key={sd.id || i}>
                            <th className="border border-black px-1 py-1 text-center text-xs font-normal">{isTimeBased ? "Time" : "Qty"}</th>
                            <th className="border border-black px-1 py-1 text-center text-xs font-normal">Mks</th>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {result.achieved_marks.map((mark: any, index: number) => {
                    const approval = getCadetApprovalRecord(mark.cadet_id);
                    const status = getCadetApprovalStatus(mark.cadet_id);
                    const isPending = status === "pending";
                    const isRejected = status === "rejected";
                    const canReapprove = isRejected && approval?.id && lowerAuthorityReapprovedAfterRejection(mark.cadet_id, approval.id);

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
                            "-"}
                        </td>
                        <td className="border border-black px-2 py-2 font-medium text-black">
                          {mark.cadet?.name || "N/A"}
                          {(mark.cadet as any)?.gender?.toLowerCase() === "female" && (
                            <span className="ml-1 text-pink-600 font-semibold text-xs">(F)</span>
                          )}
                        </td>
                        <td className="border border-black px-2 py-2">{mark.cadet?.assigned_branchs?.find((br: any) => br.is_current)?.branch?.name || result.branch?.name || "N/A"}</td>
                        {hasStationData ? stationDetails.map((sd: any, di: number) => {
                          const detail = getStationDataForCadet(mark, sd.id);
                          return (
                            <React.Fragment key={sd.id || di}>
                              <td className="border border-black px-1 py-1 text-center">
                                {detail?.achieved_time || (detail?.qty !== null && detail?.qty !== undefined ? detail.qty : "-")}
                              </td>
                              <td className="border border-black px-1 py-1 text-center">
                                {parseFloat(String(detail?.marks || 0)).toFixed(2)}
                              </td>
                            </React.Fragment>
                          );
                        }) : (
                          <td className="border border-black px-2 py-2 text-center font-bold">
                            {parseFloat(String(mark.achieved_mark || 0)).toFixed(2)}
                          </td>
                        )}
                        {hasStationData && (
                          <>
                            <td className="border border-black px-2 py-2 text-center font-bold">
                              {mark.details?.reduce((sum: number, d: any) => sum + parseFloat(String(d.marks || 0)), 0).toFixed(2) || "0.00"}
                            </td>
                            <td className="border border-black px-2 py-2 text-center font-bold">
                              {(() => {
                                const totalMks = mark.details?.reduce((sum: number, d: any) => sum + parseFloat(String(d.marks || 0)), 0) || 0;
                                const maxTotal = stationDetails.reduce((sum: number, sd: any) => sum + parseFloat(String(sd.male_marks || 0)), 0);
                                const convLimit = parseFloat(String(estimatedMark?.conversation_mark || 0));
                                if (maxTotal > 0 && convLimit > 0) {
                                  return ((totalMks / maxTotal) * convLimit).toFixed(2);
                                }
                                return totalMks.toFixed(2);
                              })()}
                            </td>
                          </>
                        )}
                        {canApprove && (
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
                        )}
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
                            ) : canReapprove ? (
                              <button
                                onClick={() => openApprovalModal([mark.cadet_id])}
                                className="px-2 py-1 text-[10px] font-semibold bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                              >
                                Re-approve
                              </button>
                            ) : isRejected ? (
                              <span className="px-2 py-1 text-[10px] text-red-500 font-semibold">Awaiting correction</span>
                            ) : null}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

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
            <p className="text-sm font-medium text-gray-700 uppercase">CTW 2KM 10 Station</p>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {approvalModal.cadetIds.length === 1 ? "Cadet Approval" : `Cadets Approval (${approvalModal.cadetIds.length} cadets)`}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Module: <span className="font-medium text-gray-700">2KM 10 Station</span>
          </p>

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
                    const mark = result.achieved_marks?.find((m: any) => m.cadet_id === cadetId);
                    if (!mark) return null;
                    return (
                      <tr key={cadetId} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                        <td className="border border-gray-200 px-2 py-1 text-center">{idx + 1}</td>
                        <td className="border border-gray-200 px-2 py-1 text-center font-mono">{mark.cadet?.bd_no || mark.cadet?.cadet_number || "N/A"}</td>
                        <td className="border border-gray-200 px-2 py-1 font-bold text-gray-900">{mark.cadet?.name || "N/A"}</td>
                        <td className="border border-gray-200 px-2 py-1 text-center font-bold">{mark.details?.reduce((sum: number, d: any) => sum + parseFloat(String(d.marks || 0)), 0).toFixed(2) || "0.00"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

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
                ["Module", "2KM 10 Station"],
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
                ["Module", "2KM 10 Station"],
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
              {rejectDownModal.item.cadet_bd_no && rejectDownModal.item.cadet_bd_no !== "\u2014" && (
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
              Are you sure you want to re-submit marks for<br />
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

      <Modal
        isOpen={viewRejectedModal.open}
        onClose={() => setViewRejectedModal({ open: false, item: null })}
        showCloseButton
        className="max-w-lg"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2"><FullLogo /></div>
            <h1 className="text-lg font-bold text-gray-900 uppercase">Rejection Details</h1>
            <div className="h-1 w-20 bg-orange-500 rounded-full mx-auto mt-2"></div>
          </div>

          {viewRejectedModal.item && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Cadet</p>
                  <p className="font-bold text-gray-900">{viewRejectedModal.item.cadet_name} ({viewRejectedModal.item.cadet_bd_no})</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Rank / Branch</p>
                  <p className="font-medium text-gray-800">{viewRejectedModal.item.cadet_rank} / {viewRejectedModal.item.cadet_branch}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Rejected By</p>
                  <p className="font-bold text-red-600">{viewRejectedModal.item.rejected_by}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Date</p>
                  <p className="font-medium text-gray-800">{viewRejectedModal.item.rejected_at ? new Date(viewRejectedModal.item.rejected_at).toLocaleString() : "\u2014"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-gray-700 mb-1">Rejection Reason:</p>
                <div className="p-3 bg-white rounded-lg border border-orange-200 text-sm text-red-700 italic leading-relaxed shadow-sm">
                  {viewRejectedModal.item.rejected_reason || "No reason provided"}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setViewRejectedModal({ open: false, item: null })}
              className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
            >
              Close Details
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
