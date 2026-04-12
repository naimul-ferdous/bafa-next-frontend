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

function SignatureBox({ auth, signer, approvedAt, position }: {
  auth: { id: number; role?: { name: string } | null; user?: { name: string } | null };
  signer: { name: string; rank?: { name: string; short_name: string } | null; signature?: string | null; designation?: string | null } | null;
  approvedAt?: string | null;
  position?: 'first' | 'middle' | 'last';
}) {
  const [imgFailed, setImgFailed] = React.useState(false);

  const dateStr = approvedAt
    ? (() => {
      const d = new Date(approvedAt);
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      return `${day}-${month}-${d.getFullYear()}`;
    })()
    : null;

  const label = position === 'first' ? 'Prepared & Checked By'
    : position === 'last' ? 'Approved By'
      : auth.role?.name ?? auth.user?.name ?? '—';

  return (
    <div className="signature-box flex flex-col items-start min-w-[180px]">
      <p className="sig-label text-sm uppercase mb-1">{label}</p>
      <div className="sig-area w-full flex items-end justify-start pb-1" style={{ height: 60 }}>
        {signer?.signature && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signer.signature}
            alt=""
            className="max-h-14 max-w-[150px] object-contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="text-sm italic text-gray-400">Signature not provided</span>
        )}
      </div>
      {signer && (
        <p className="sig-name text-sm font-bold text-gray-900 uppercase mt-1">{signer.name}</p>
      )}
      {signer?.rank?.short_name && (
        <p className="sig-rank text-xs font-semibold">{signer.rank.short_name}</p>
      )}
      {signer?.designation && (
        <p className="sig-designation text-xs text-gray-700">{signer.designation}</p>
      )}
      {dateStr && (
        <p className="sig-date text-xs text-gray-500 pt-0.5 border-t border-gray-800 mt-1">{dateStr}</p>
      )}
    </div>
  );
}

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);

  // Bulk select state
  const [selectedCadetIds, setSelectedCadetIds] = useState<number[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Approval modal
  const [approvalModal, setApprovalModal] = useState<{
    open: boolean;
    cadetIds: number[];
    status: "approved" | "rejected";
    rejectedReason: string;
    loading: boolean;
    error: string;
  }>({ open: false, cadetIds: [], status: "approved", rejectedReason: "", loading: false, error: "" });

  // Forward modal
  const [forwardModal, setForwardModal] = useState<{
    open: boolean;
    loading: boolean;
    error: string;
  }>({ open: false, loading: false, error: "" });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [data, authRes] = await Promise.all([
        atwAssessmentOlqResultService.getResult(parseInt(resultId)),
        atwOlqApprovalAuthorityService.getAuthorities({ allData: true, is_active: true }),
      ]);

      if (authRes?.data) {
        setAllAuthorities([...authRes.data].sort((a, b) => a.sort - b.sort));
      }

      if (data) {
        setResult(data);
        setSelectedCadetIds([]);
        if (data.cadet_approvals) setApprovals(data.cadet_approvals);
        if (data.semester_approvals) {
          setSemesterApprovals(data.semester_approvals);
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
  }, [resultId, user?.id]);

  useEffect(() => { if (resultId) loadData(); }, [resultId, loadData]);

  // Detect current user's authority — same pattern as counseling results page
  const currentAuthority = useMemo(() => {
    if (!allAuthorities.length || !user) return null;
    const userRoles = (user as any)?.roles ?? [];
    const primaryRole = userRoles.find((r: any) => r.pivot?.is_primary);
    const isPrimaryInstructor = primaryRole?.slug === 'instructor';
    const roleIdsToCheck: number[] = [];
    if (primaryRole?.id) roleIdsToCheck.push(Number(primaryRole.id));
    if (isPrimaryInstructor) {
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
  const hasApprovalAuthority = !!currentAuthority;

  const higherAuthority = useMemo(() => {
    if (!currentAuthority) return null;
    return allAuthorities.find((a) => a.sort === currentAuthority.sort + 1) ?? null;
  }, [allAuthorities, currentAuthority]);

  // --- Helpers ---
  const visibleAuthorities = currentAuthority
    ? allAuthorities.filter((a) => a.sort <= currentAuthority.sort)
    : allAuthorities; // Fallback if no specific authority match (e.g. admin viewing)

  const getCadetApproval = (cadetId: number, authId: number): AtwOlqCadetApproval | undefined =>
    approvals.find((a) => a.cadet_id === cadetId && a.authority_id === authId);

  const getCurrentCadetApproval = (cadetId: number): AtwOlqCadetApproval | undefined =>
    currentAuthorityId ? getCadetApproval(cadetId, currentAuthorityId) : undefined;

  // Check if previous authority (one level below current) has approved a specific cadet
  const isPrevAuthorityApproved = (cadetId: number): boolean => {
    if (!currentAuthority || allAuthorities.length === 0) return false;
    const sorted = [...allAuthorities].sort((a, b) => Number(a.sort) - Number(b.sort));
    const myPos = sorted.findIndex((a) => Number(a.id) === Number(currentAuthority.id));
    if (myPos <= 0) return true; // Lowest authority — no prerequisite
    const prevAuth = sorted[myPos - 1];
    return approvals.some(
      (a) => Number(a.cadet_id) === Number(cadetId) && Number(a.authority_id) === Number(prevAuth.id) && a.status === "approved"
    );
  };

  const pendingCadetIds = (result?.result_cadets ?? [])
    .filter((c) => {
      if (!currentAuthorityId) return false;
      if (!isPrevAuthorityApproved(c.cadet_id)) return false;
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
    setApprovalModal({ open: true, cadetIds, status: "approved", rejectedReason: "", loading: false, error: "" });

  const confirmBulkAction = async () => {
    if (!result || !currentAuthorityId) return;
    if (approvalModal.status === "rejected" && !approvalModal.rejectedReason.trim()) {
      setApprovalModal(p => ({ ...p, error: "Rejection reason is required." }));
      return;
    }
    setApprovalModal(p => ({ ...p, loading: true, error: "" }));
    try {
      if (approvalModal.status === "approved") {
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
          reason: approvalModal.rejectedReason,
        });
      }
      setApprovalModal(p => ({ ...p, open: false, loading: false }));
      await loadData();
    } catch (err: any) {
      setApprovalModal(p => ({ ...p, loading: false, error: err?.message || "Failed. Please try again." }));
    }
  };

  const confirmForward = async () => {
    if (!result) return;
    setForwardModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      await atwOlqSemesterApprovalService.store({
        course_id: result.course_id,
        semester_id: result.semester_id,
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
          .cv-content { width: 100% !important; max-width: none !important; }
          table { font-size: 14px !important; }
          .print-div { max-width: 60vh !important; margin: 0 auto !important; }
          .no-print { display: none !important; }
          .tab-container { display: none !important; }
          .signature-section {
            margin-top: 40px !important;
            padding-top: 20px !important;
            display: flex !important;
            justify-content: space-between !important;
            gap: 40px !important;
            padding-left: 8px !important;
            padding-right: 8px !important;
            page-break-inside: avoid !important;
          }
          .signature-box {
            min-width: 180px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .signature-box .sig-label {
            font-size: 10px !important;
            font-weight: 700 !important;
            color: #b91c1c !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            margin-bottom: 4px !important;
          }
          .signature-box .sig-area {
            height: 60px !important;
            display: flex !important;
            align-items: flex-end !important;
            padding-bottom: 4px !important;
            margin-bottom: 4px !important;
          }
          .signature-box .sig-name {
            font-size: 11px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            color: #111827 !important;
            margin-top: 2px !important;
          }
          .signature-box .sig-rank {
            font-size: 11px !important;
            font-weight: 600 !important;
            color: #f97316 !important;
          }
          .signature-box .sig-designation {
            font-size: 10px !important;
            color: #374151 !important;
          }
          .signature-box .sig-date {
            font-size: 10px !important;
            color: #6b7280 !important;
            padding-top: 3px !important;
            border-top: 1px solid #1f2937 !important;
            margin-top: 4px !important;
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
                Forward to higher authority
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
            <span className="uppercase">No {result.course?.name}</span>
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
                            {isPrevAuthorityApproved(cadet.cadet_id) && !isApproved && (
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleCadet(cadet.cadet_id)}
                                  className="w-4 h-4 rounded cursor-pointer"
                                />
                              </div>
                            )}
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
                          {cadet.is_present && isPrevAuthorityApproved(cadet.cadet_id) ? calculateTotal(cadet.marks || []).toFixed(2) : "—"}
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
                            {(() => {
                              const sorted = [...allAuthorities].sort((a, b) => Number(a.sort) - Number(b.sort));
                              return visibleAuthorities.map((auth) => {
                                const approval = getCadetApproval(cadet.cadet_id, auth.id);
                                const authPos = sorted.findIndex((a) => Number(a.id) === Number(auth.id));
                                const prevAuth = authPos > 0 ? sorted[authPos - 1] : null;
                                const prevApproved = !prevAuth || approvals.some(
                                  (a) => Number(a.cadet_id) === Number(cadet.cadet_id) && Number(a.authority_id) === Number(prevAuth.id) && a.status === "approved"
                                );
                                return (
                                  <div key={`td-status-${auth.id}`} className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-medium text-gray-600 leading-tight flex items-center gap-1">
                                      {auth.role?.name || `Authority ${auth.sort}`}{Number(auth.id) === Number(currentAuthorityId) && (
                                        <span className="text-blue-600 text-[10px]">(me)</span>
                                      )} :
                                    </span>
                                    {approval?.status === "approved" ? (
                                      <span className="inline-flex items-center gap-1 text-green-700 text-[10px] font-bold whitespace-nowrap">
                                        <Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3" />
                                        Approved
                                      </span>
                                    ) : approval?.status === "rejected" ? (
                                      <span className="inline-flex items-center gap-1 text-red-700 text-[10px] font-bold whitespace-nowrap">
                                        <Icon icon="hugeicons:cancel-circle" className="w-3 h-3" />
                                        Rejected
                                      </span>
                                    ) : prevApproved ? (
                                      <span className="inline-flex items-center gap-1 text-yellow-700 text-[10px] font-bold whitespace-nowrap">
                                        <Icon icon="hugeicons:clock-01" className="w-3 h-3" />
                                        Pending
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-gray-400 text-[10px] font-medium whitespace-nowrap">
                                        <Icon icon="hugeicons:clock-02" className="w-3 h-3" />
                                        Waiting
                                      </span>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </td>

                        {/* Action column — no-print */}
                        {hasApprovalAuthority && !allCadetsApproved && (
                          <td className="border border-black px-2 py-2 text-center no-print">
                            <div className="flex flex-col gap-1">
                              {!isApproved && isPrevAuthorityApproved(cadet.cadet_id) && (
                                <button
                                  onClick={() => openApprovalModal([cadet.cadet_id])}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded"
                                  title="Approve / Reject this cadet"
                                >
                                  <Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3" />
                                  Approve
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

        {/* Signature Section */}
        {(() => {
          const signatureAuthorities = [...allAuthorities]
            .filter((a: any) => a.is_signature)
            .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
          if (signatureAuthorities.length === 0) return null;
          return (
            <div className="signature-section max-w-5xl mx-auto mt-10 flex justify-between gap-10 px-2">
              {signatureAuthorities.map((auth: any, sigIdx: number) => {
                const sigPosition: 'first' | 'middle' | 'last' =
                  sigIdx === 0 ? 'first'
                    : sigIdx === signatureAuthorities.length - 1 ? 'last'
                      : 'middle';

                const semApproval = semesterApprovals.find(
                  (sa) => sa.current_authority_id === auth.id
                ) ?? null;

                const rawSigner = semApproval?.forwarder ?? null;

                const signer = rawSigner ? {
                  name: rawSigner.name,
                  signature: rawSigner.signature ?? null,
                  rank: rawSigner.rank ?? null,
                  designation: auth.role?.name ?? null,
                } : null;

                const approvedAt = semApproval?.forwarded_at ?? semApproval?.approved_at ?? null;

                return (
                  <SignatureBox
                    key={auth.id}
                    auth={auth}
                    signer={signer}
                    approvedAt={approvedAt}
                    position={sigPosition}
                  />
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Approval Modal — follows counseling [id] design */}
      <Modal isOpen={approvalModal.open} onClose={() => setApprovalModal(p => ({ ...p, open: false }))} showCloseButton className="max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 flex items-center justify-center"><FullLogo /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">OLQ Cadet Approval</h2>
              <p className="text-xs text-gray-500">{currentAuthority?.role?.name || "Authority"} approval</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            OLQ Type: <span className="font-medium text-gray-800">{result?.olq_type?.type_name || "—"}</span>
          </p>

          {/* Cadet list */}
          <div className="mb-4 rounded-lg border border-gray-200 overflow-hidden text-xs">
            {approvalModal.cadetIds.map((cadetId, i) => {
              const cadet = result?.result_cadets?.find(c => Number(c.cadet_id) === Number(cadetId));
              const currentRank = cadet?.cadet?.assigned_ranks?.find((r: any) => r.is_current);
              return (
                <div key={cadetId} className={`flex items-center gap-3 px-3 py-2 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                  <span className="font-mono font-bold text-gray-600">{cadet?.bd_no || cadet?.cadet?.cadet_number || "—"}</span>
                  <span className="text-gray-400">{currentRank?.rank?.short_name || currentRank?.rank?.name || "—"}</span>
                  <span className="font-semibold text-gray-800">{cadet?.cadet?.name || "—"}</span>
                </div>
              );
            })}
          </div>

          {/* Status toggle */}
          <div className="flex gap-3 mb-4">
            {(["approved", "rejected"] as const).map(s => (
              <button
                key={s}
                onClick={() => setApprovalModal(p => ({ ...p, status: s, rejectedReason: "", error: "" }))}
                className={`flex-1 py-2 rounded-lg border text-sm font-semibold capitalize transition-colors ${approvalModal.status === s
                    ? s === "approved" ? "bg-green-600 text-white border-green-600" : "bg-red-600 text-white border-red-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {s === "approved" ? "✓ Approve" : "✗ Reject"}
              </button>
            ))}
          </div>

          {approvalModal.status === "rejected" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={approvalModal.rejectedReason}
                onChange={e => setApprovalModal(p => ({ ...p, rejectedReason: e.target.value }))}
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
              onClick={() => setApprovalModal(p => ({ ...p, open: false }))}
              disabled={approvalModal.loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmBulkAction}
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
      <Modal isOpen={forwardModal.open} onClose={() => setForwardModal(p => ({ ...p, open: false }))} showCloseButton className="max-w-lg">
        <div className="p-6">
          <div className="flex items-center gap-1 mb-4">
            <div className="flex items-center justify-center w-12 h-12">
              <FullLogo />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Forward to Higher Authority</h2>
              <p className="text-xs text-gray-500">ATW OLQ result forwarding</p>
            </div>
          </div>

          {result && (
            <div className="mb-5 rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
              {([
                ["Course", result.course?.name || "—"],
                ["Semester", result.semester?.name || "—"],
                ["OLQ Type", result.olq_type?.type_name || "—"],
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
            This will mark the OLQ results as forwarded to the higher authority for further review and approval. This action records your approval at the result level.
          </p>

          {forwardModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {forwardModal.error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
            <button
              onClick={() => setForwardModal(p => ({ ...p, open: false }))}
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

      <PrintTypeModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirm={confirmPrint}
      />
    </div>
  );
}
