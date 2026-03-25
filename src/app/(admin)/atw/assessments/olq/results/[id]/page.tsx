/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwAssessmentOlqResultService } from "@/libs/services/atwAssessmentOlqResultService";
import { atwOlqCadetApprovalService } from "@/libs/services/atwOlqCadetApprovalService";
import { atwOlqSemesterApprovalService } from "@/libs/services/atwOlqSemesterApprovalService";
import { atwOlqApprovalAuthorityService } from "@/libs/services/atwOlqApprovalAuthorityService";
import { useAuth } from "@/context/AuthContext";
import FullLogo from "@/components/ui/fulllogo";
import { getOrdinal } from "@/libs/utils/formatter";
import type { AtwAssessmentOlqResult } from "@/libs/types/atwAssessmentOlq";
import type { AtwOlqCadetApproval } from "@/libs/types/atwOlqCadetApproval";
import type { FilePrintType } from "@/libs/types/filePrintType";
import PrintTypeModal from "@/components/ui/modal/PrintTypeModal";
import { Modal } from "@/components/ui/modal";
import { AtwOlqSemesterApproval } from "@/libs/types/atwOlqSemesterApproval";

export default function OlqResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;
  const { user } = useAuth();

  const [result, setResult] = useState<AtwAssessmentOlqResult | null>(null);
  const [approvals, setApprovals] = useState<AtwOlqCadetApproval[]>([]);
  const [semesterApprovals, setSemesterApprovals] = useState<AtwOlqSemesterApproval[]>([]);
  const [semesterApproval, setSemesterApproval] = useState<AtwOlqSemesterApproval | null>(null);
  const [allAuthorities, setAllAuthorities] = useState<any[]>([]);
  const [currentAuthority, setCurrentAuthority] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasApprovalAuthority, setHasApprovalAuthority] = useState<boolean | undefined>(undefined);
  const [currentAuthorityId, setCurrentAuthorityId] = useState<number | null | undefined>(undefined);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);

  // Bulk select state
  const [selectedCadetIds, setSelectedCadetIds] = useState<number[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Approval modal
  const [approvalModal, setApprovalModal] = useState<{
    open: boolean;
    cadetIds: number[];
    loading: boolean;
    error: string;
    type: "approve" | "reject";
    reason?: string;
  }>({ open: false, cadetIds: [], loading: false, error: "", type: "approve" });

  // Forward modal
  const [forwardModal, setForwardModal] = useState<{
    open: boolean;
    loading: boolean;
    error: string;
  }>({ open: false, loading: false, error: "" });

  const loadData = useCallback(async () => {
    if (currentAuthorityId === undefined) return; // Wait for authority check

    try {
      setLoading(true);
      const data = await atwAssessmentOlqResultService.getResult(parseInt(resultId));
      if (data) {
        setResult(data);
        setSelectedCadetIds([]);

        // Use approvals from the combined API response
        if (data.cadet_approvals) {
          setApprovals(data.cadet_approvals);
        }

        if (data.semester_approvals) {
          setSemesterApprovals(data.semester_approvals);
          // Check if there is an approval for the current user
          const myApproval = user?.id
            ? data.semester_approvals.find((a) => a.forwarded_by === user.id)
            : null;
          setSemesterApproval(myApproval || null);
        }
      } else {
        setError("OLQ Result not found");
      }
    } catch (err) {
      console.error("Failed to load OLQ result:", err);
      setError("Failed to load OLQ result data");
    } finally {
      setLoading(false);
    }
  }, [resultId, currentAuthorityId, user?.id]);

  useEffect(() => {
    if (resultId && currentAuthorityId !== undefined) loadData();
  }, [resultId, loadData, currentAuthorityId]);

  useEffect(() => {
    const checkAuthority = async () => {
      if (!user) return;
      try {
        const res = await atwOlqApprovalAuthorityService.getAuthorities({ allData: true, is_active: true });
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
      } catch (err) {
        console.error("Failed to fetch approval authorities:", err);
      }
    };
    checkAuthority();
  }, [user]);

  // --- Helpers ---
  const visibleAuthorities = currentAuthority
    ? allAuthorities.filter((a) => a.sort <= currentAuthority.sort)
    : allAuthorities; // Fallback if no specific authority match (e.g. admin viewing)

  const getCadetApproval = (cadetId: number, authId: number): AtwOlqCadetApproval | undefined =>
    approvals.find((a) => a.cadet_id === cadetId && a.authority_id === authId);

  const getCurrentCadetApproval = (cadetId: number): AtwOlqCadetApproval | undefined =>
    currentAuthorityId ? getCadetApproval(cadetId, currentAuthorityId) : undefined;

  const pendingCadetIds = (result?.result_cadets ?? [])
    .filter((c) => {
      if (!currentAuthorityId) return false;
      return getCurrentCadetApproval(c.cadet_id)?.status !== "approved";
    })
    .map((c) => c.cadet_id);

  const allCadetsApproved =
    (result?.result_cadets ?? []).length > 0 &&
    !!currentAuthorityId &&
    (result?.result_cadets ?? []).every(
      (c) => getCurrentCadetApproval(c.cadet_id)?.status === "approved"
    );

  const allPendingSelected =
    pendingCadetIds.length > 0 &&
    pendingCadetIds.every((id) => selectedCadetIds.includes(id));

  const toggleCadet = (cadetId: number) => {
    const approval = getCurrentCadetApproval(cadetId);
    if (approval?.status === "approved") return; // already approved, can't toggle
    setSelectedCadetIds((prev) =>
      prev.includes(cadetId) ? prev.filter((id) => id !== cadetId) : [...prev, cadetId]
    );
  };

  const toggleSelectAll = () =>
    setSelectedCadetIds(allPendingSelected ? [] : pendingCadetIds);

  const openApprovalModal = (cadetIds: number[]) =>
    setApprovalModal({ open: true, cadetIds, loading: false, error: "", type: "approve" });

  const openRejectModal = (cadetIds: number[]) =>
    setApprovalModal({ open: true, cadetIds, loading: false, error: "", type: "reject", reason: "" });

  const confirmBulkAction = async () => {
    if (!result || !currentAuthorityId) return;
    setApprovalModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      if (approvalModal.type === "approve") {
        await atwAssessmentOlqResultService.bulkApprove({
          result_id: result.id,
          cadet_ids: approvalModal.cadetIds,
          authority_id: currentAuthorityId,
        });
      } else {
        await atwAssessmentOlqResultService.bulkReject({
          result_id: result.id,
          cadet_ids: approvalModal.cadetIds,
          authority_id: currentAuthorityId,
          reason: approvalModal.reason,
        });
      }
      setApprovalModal((prev) => ({ ...prev, open: false, loading: false }));
      await loadData();
    } catch (err: any) {
      setApprovalModal((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || `Failed to ${approvalModal.type}. Please try again.`,
      }));
    }
  };

  const confirmForward = async () => {
    if (!result) return;
    setForwardModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      await atwOlqSemesterApprovalService.store({
        course_id: result.course_id,
        semester_id: result.semester_id,
        program_id: result.program_id,
        status: "pending",
        forwarded_by: user?.id || undefined,
        forwarded_at: new Date().toISOString(),
        current_authority_id: currentAuthorityId || undefined,
      } as any);
      setForwardModal({ open: false, loading: false, error: "" });
      await loadData();
    } catch (err: any) {
      setForwardModal((prev) => ({ ...prev, loading: false, error: err?.message || "Failed to forward." }));
    }
  };

  const handlePrintClick = () => setIsPrintModalOpen(true);
  const confirmPrint = (type: FilePrintType) => {
    setSelectedPrintType(type);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 100);
  };

  const estimatedMarks = result?.olq_type?.estimated_marks || [];

  const calculateTotal = useCallback((cadetMarks: any[]) => {
    let total = 0;
    estimatedMarks.forEach((em) => {
      const mark = cadetMarks.find((m: any) => m.atw_assessment_olq_type_estimated_mark_id === em.id);
      const achieved = mark ? parseFloat(String(mark.achieved_mark || 0)) : 0;
      total += parseFloat(String(em.estimated_mark || 0)) * achieved;
    });
    if (result?.olq_type?.is_multiplier) {
      const mult = parseFloat(result.olq_type.multiplier || "1");
      total *= mult;
    }
    return total;
  }, [estimatedMarks, result?.olq_type?.is_multiplier, result?.olq_type?.multiplier]);

  const rankedCadets = useMemo(() => {
    return (result?.result_cadets || [])
      .map((cadet) => ({
        cadet_id: cadet.cadet_id,
        total: cadet.is_present ? calculateTotal(cadet.marks || []) : -1,
        cadet_number: cadet.cadet?.cadet_number || cadet.bd_no || "",
      }))
      .sort((a, b) => b.total !== a.total ? b.total - a.total : a.cadet_number.localeCompare(b.cadet_number, undefined, { numeric: true }));
  }, [result?.result_cadets, calculateTotal]);

  const maxTotal = useMemo(() => {
    let total = 0;
    estimatedMarks.forEach((em) => {
      total += parseFloat(String(em.estimated_mark || 0)) * 10;
    });
    if (result?.olq_type?.is_multiplier) {
      const mult = parseFloat(result.olq_type.multiplier || "1");
      total *= mult;
    }
    return total || 1; // Prevent division by zero
  }, [estimatedMarks, result?.olq_type?.is_multiplier, result?.olq_type?.multiplier]);

  const getPosition = (cadetId: number) => {
    const cadet = result?.result_cadets?.find((c) => c.cadet_id === cadetId);
    if (!cadet?.is_present) return "—";
    const index = rankedCadets.findIndex((rc) => rc.cadet_id === cadetId);
    return index === -1 ? "—" : getOrdinal(index + 1);
  };

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
          <p className="text-red-600">{error || "OLQ Result not found"}</p>
          <button
            onClick={() => router.push("/atw/assessments/olq/results")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to OLQ Results
          </button>
        </div>
      </div>
    );
  }

  const groupedCadets = result.grouped_cadets || [];
  const activeGroup = groupedCadets[activeTabIndex];

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
          .tab-container {
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
            @top-right  {
              content: "BAF - ${result.olq_type?.type_name}";
              font-size: 10pt;
              text-align: right;
            }

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

      {/* Action Bar */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => history.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>

        <div className="flex items-center gap-3">
          {/* Bulk select buttons */}
          {selectedCadetIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openApprovalModal(selectedCadetIds)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
              >
                <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
                Approve ({selectedCadetIds.length})
              </button>
              <button
                onClick={() => openRejectModal(selectedCadetIds)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm font-medium"
              >
                <Icon icon="hugeicons:cancel-circle" className="w-4 h-4" />
                Reject ({selectedCadetIds.length})
              </button>
            </div>
          )}

          {/* Forward button — conditional logic */}
          {hasApprovalAuthority && (
            semesterApproval && semesterApproval.forwarded_by === user?.id ? (
              <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg border border-gray-200 flex items-center gap-2 text-sm font-medium">
                <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4 text-green-500" />
                Already forwarded to higher authority
              </span>
            ) : (
              <button
                onClick={() => setForwardModal({ open: true, loading: false, error: "" })}
                disabled={!allCadetsApproved}
                title={!allCadetsApproved ? "All cadets must be approved before forwarding" : "Forward to next authority"}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
                <Icon icon="hugeicons:arrow-right-double" className="w-4 h-4" />
                Forward
              </button>
            )
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

      <div className="p-4 cv-content">
        <div className="mb-4">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider">Academy Training Wing</p>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider">OLQ Assessment : Offr Cdts</p>
          <p className="text-center font-medium text-gray-900 tracking-wider">
            <span className="uppercase">No {result.course?.name}</span> : {result.program?.name}
          </p>
          <p className="text-center font-medium text-gray-900 tracking-wider pb-2">({result.semester?.name})</p>

          {/* Active Tab Indicator for Print */}
          <div className="hidden print:block mt-2">
            <p className="text-center text-lg font-bold text-blue-800 uppercase underline decoration-2 underline-offset-4">
              {activeGroup?.name}
            </p>
          </div>
        </div>

        {groupedCadets.length > 1 && (
          <div className="tab-container no-print mb-2">
            <div className="flex flex-wrap justify-end gap-2">
              {groupedCadets.map((group, index) => (
                <button
                  key={`tab-${index}`}
                  onClick={() => setActiveTabIndex(index)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-2 ${activeTabIndex === index
                      ? "bg-blue-600 text-white border border-blue-200"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                >
                  <Icon
                    icon={group.is_flying_group ? "hugeicons:airplane-01" : "hugeicons:user-group"}
                    className={`w-4 h-4 ${activeTabIndex === index ? "text-white" : "text-gray-400"}`}
                  />
                  {group.name}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTabIndex === index ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                    {group.cadets.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cadets & Marks Table */}
        {activeGroup && activeGroup.cadets.length > 0 && (
          <div className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    {/* Bulk select header — no-print */}
                    {hasApprovalAuthority && !allCadetsApproved && (
                      <th className="border border-black px-2 py-2 text-center no-print w-10" rowSpan={3}>
                        <input
                          type="checkbox"
                          checked={allPendingSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded cursor-pointer"
                          title="Select all pending"
                        />
                      </th>
                    )}
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Sl.</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>BD</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={2}>Rk</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={2}>Name</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={2}>Br</th>
                    <th
                      className="border border-black px-3 py-2 text-center font-bold"
                      colSpan={estimatedMarks.length + 3}
                    >
                      Character Trails (Marks Out of 10)
                    </th>
                    <th className="border border-black px-3 py-2 text-center font-bold no-print" rowSpan={3}>
                      Status Timeline
                    </th>
                    {hasApprovalAuthority && !allCadetsApproved && (
                      <th className="border border-black px-3 py-2 text-center font-bold no-print" rowSpan={3}>
                        Action
                      </th>
                    )}
                  </tr>
                  <tr>
                    {estimatedMarks.map((mark) => (
                      <th key={mark.id} className="border border-black p-2 text-center align-middle">
                        <div className="h-32 flex items-center justify-center w-8 mx-auto">
                          <span className="font-semibold [writing-mode:vertical-rl] rotate-180">{mark.event_name}</span>
                        </div>
                      </th>
                    ))}
                    <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={2}>
                      Total {result.olq_type?.is_multiplier ? `x ${result.olq_type.multiplier}` : ""}
                    </th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Position</th>
                    <th className="border border-black px-3 py-2 text-center font-bold">Percentile</th>
                  </tr>
                  <tr>
                    <th className="border border-black px-3 py-2 text-center" colSpan={5}>Allotted Score</th>
                    {estimatedMarks.map((mark) => (
                      <th key={`est-${mark.id}`} className="border border-black px-2 py-1 text-center">
                        <span className="block">{parseFloat(String(mark.estimated_mark)).toFixed(0)}</span>
                      </th>
                    ))}
                    <th className="border border-black px-3 py-2 text-center">%</th>
                  </tr>
                </thead>
                <tbody>
                  {activeGroup.cadets.map((cadet: any, cadetIndex: number) => {
                    const cadetName = cadet.cadet?.name || "Unknown";
                    const currentRank = cadet.cadet?.assigned_ranks?.find((r: any) => r.is_current)?.rank || cadet.cadet?.assigned_ranks?.[0]?.rank;
                    const cadetRank = currentRank?.short_name || currentRank?.name || "—";
                    const currentBranch = cadet.cadet?.assigned_branchs?.find((b: any) => b.is_current)?.branch || cadet.cadet?.assigned_branchs?.[0]?.branch;
                    const cadetBranchCode = currentBranch?.code || "—";

                    const currentApproval = getCurrentCadetApproval(cadet.cadet_id);
                    const isApproved = currentApproval?.status === "approved";
                    const isRejected = currentApproval?.status === "rejected";
                    const isSelected = selectedCadetIds.includes(cadet.cadet_id);

                    return (
                      <tr key={cadet.cadet_id}>
                        {/* Checkbox + approve cell — no-print */}
                        {hasApprovalAuthority && !allCadetsApproved && (
                          <td className="border border-black px-2 py-2 text-center no-print">
                            <div className="flex flex-col items-center gap-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isApproved}
                                onChange={() => toggleCadet(cadet.cadet_id)}
                                className="w-4 h-4 rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </div>
                          </td>
                        )}

                        <td className="border border-black px-3 py-2 text-center font-medium">{cadetIndex + 1}</td>
                        <td className="border border-black px-3 py-2 text-center">{cadet.bd_no}</td>
                        <td className="border border-black px-3 py-2 text-center">{cadetRank}</td>
                        <td className={`border border-black px-3 py-2 font-medium ${!cadet.is_present ? "text-red-500" : ""}`}>
                          {cadetName}
                        </td>
                        <td className="border border-black px-3 py-2 text-center">{cadetBranchCode}</td>

                        {estimatedMarks.map((em, i) => {
                          const mark = cadet.marks?.find((m: any) => m.atw_assessment_olq_type_estimated_mark_id === em.id);
                          const achieved = mark ? parseFloat(String(mark.achieved_mark)) : 0;
                          return (
                            <td key={i} className="border border-black px-2 py-2 text-center">
                              {cadet.is_present ? achieved.toFixed(2) : "—"}
                            </td>
                          );
                        })}

                        <td className="border border-black px-2 py-2 text-center font-medium">
                          {cadet.is_present ? calculateTotal(cadet.marks || []).toFixed(2) : "—"}
                        </td>
                        <td className="border border-black px-2 py-2 text-center font-medium">
                          {getPosition(cadet.cadet_id)}
                        </td>
                        <td className="border border-black px-2 py-2 text-center font-medium">
                          {cadet.is_present
                            ? ((calculateTotal(cadet.marks || []) / maxTotal) * 100).toFixed(2)
                            : "—"}
                        </td>

                        {/* Status Timeline column — no-print */}
                        <td className="border border-black px-2 py-2 text-left no-print">
                          <div className="flex flex-col gap-1.5 min-w-[120px]">
                            {visibleAuthorities.map((auth) => {
                              const approval = getCadetApproval(cadet.cadet_id, auth.id);
                              return (
                                <div key={`td-status-${auth.id}`} className="flex items-center justify-between gap-2 border-b border-gray-200 last:border-0 pb-1.5 last:pb-0">
                                  <span className="text-[10px] font-medium text-gray-600 leading-tight">
                                    {auth.role?.name || `Authority ${auth.sort}`}:
                                  </span>
                                  {approval?.status === "approved" ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded border border-green-200 whitespace-nowrap">
                                      <Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3" />
                                      Approved
                                    </span>
                                  ) : approval?.status === "rejected" ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded border border-red-200 whitespace-nowrap">
                                      <Icon icon="hugeicons:cancel-circle" className="w-3 h-3" />
                                      Rejected
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded border border-yellow-200 whitespace-nowrap">
                                      <Icon icon="hugeicons:clock-01" className="w-3 h-3" />
                                      Pending
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* Action column — no-print */}
                        {hasApprovalAuthority && !allCadetsApproved && (
                          <td className="border border-black px-2 py-2 text-center no-print">
                            <div className="flex flex-col gap-1">
                              {!isApproved && (
                                <button
                                  onClick={() => openApprovalModal([cadet.cadet_id])}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded"
                                  title="Approve this cadet"
                                >
                                  <Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3" />
                                  Approve
                                </button>
                              )}
                              {!isRejected && !isApproved && (
                                <button
                                  onClick={() => openRejectModal([cadet.cadet_id])}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded"
                                  title="Reject this cadet"
                                >
                                  <Icon icon="hugeicons:cancel-circle" className="w-3 h-3" />
                                  Reject
                                </button>
                              )}
                            </div>
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

        <div>
          <div className="w-full flex justify-center mt-12">
            <p className="text-sm uppercase text-gray-900 font-semibold underline">Countersigned by</p>
          </div>
          <div className="min-h-32" />
        </div>
      </div>

      {/* Approve/Reject Confirmation Modal */}
      <Modal isOpen={approvalModal.open} onClose={() => setApprovalModal((p) => ({ ...p, open: false }))} showCloseButton className="max-w-sm">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {approvalModal.type === "approve" ? "Approve" : "Reject"} Cadet{approvalModal.cadetIds.length > 1 ? "s" : ""}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {approvalModal.type === "approve" ? "Approve" : "Reject"} <span className="font-semibold text-gray-700">{approvalModal.cadetIds.length}</span> cadet{approvalModal.cadetIds.length > 1 ? "s" : ""}?
            This action cannot be undone.
          </p>

          {approvalModal.type === "reject" && (
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Rejection Reason</label>
              <textarea
                value={approvalModal.reason}
                onChange={(e) => setApprovalModal(p => ({ ...p, reason: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none min-h-[80px]"
                placeholder="Enter reason for rejection..."
              />
            </div>
          )}

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
              onClick={confirmBulkAction}
              disabled={approvalModal.loading || (approvalModal.type === "reject" && !approvalModal.reason?.trim())}
              className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 text-sm font-medium ${approvalModal.type === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}
            >
              {approvalModal.loading
                ? <><Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />Processing...</>
                : <><Icon icon={approvalModal.type === "approve" ? "hugeicons:checkmark-circle-02" : "hugeicons:cancel-circle"} className="w-4 h-4" />{approvalModal.type === "approve" ? "Approve" : "Reject"}</>
              }
            </button>
          </div>
        </div>
      </Modal>

      {/* Forward Confirmation Modal */}
      <Modal isOpen={forwardModal.open} onClose={() => setForwardModal((p) => ({ ...p, open: false }))} showCloseButton className="max-w-sm">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Forward Result</h2>
          <p className="text-sm text-gray-500 mb-4">
            All cadets have been approved. Do you want to forward this result to the next authority?
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

      <PrintTypeModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirm={confirmPrint}
      />
    </div>
  );
}
