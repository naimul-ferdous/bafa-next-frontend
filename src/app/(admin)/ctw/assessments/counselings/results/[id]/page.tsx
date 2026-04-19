/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwAssessmentCounselingResultService } from "@/libs/services/ctwAssessmentCounselingResultService";
import { ctwCounselingCadetApprovalService } from "@/libs/services/ctwCounselingCadetApprovalService";
import { useAuth } from "@/context/AuthContext";
import FullLogo from "@/components/ui/fulllogo";
import type { CtwCounselingCadetApproval } from "@/libs/types/ctwCounselingCadetApproval";
import type { FilePrintType } from "@/libs/types/filePrintType";
import PrintTypeModal from "@/components/ui/modal/PrintTypeModal";
import { Modal } from "@/components/ui/modal";

function SignatureBlock({
  signature,
  name,
  rank,
  designation,
  dateStr,
}: {
  signature?: string | null;
  name?: string | null;
  rank?: string | null;
  designation?: string | null;
  dateStr?: string | null;
}) {
  const [imgFailed, setImgFailed] = React.useState(false);
  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full flex items-end justify-center pb-1 min-h-[40px]">
        {signature && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signature}
            alt=""
            className="max-h-14 max-w-[150px] object-contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="text-[9px] italic text-gray-400">Signature not provided</span>
        )}
      </div>
      {name && <p className="text-[10px] font-bold text-gray-900 uppercase mt-0.5">{name}</p>}
      {rank && <p className="text-[9px] font-semibold text-gray-700">{rank}</p>}
      {designation && <p className="text-[9px] text-gray-600">{designation}</p>}
      {dateStr && (
        <p className="text-[9px] text-gray-500 pt-0.5 border-t border-gray-800 mt-1">{dateStr}</p>
      )}
    </div>
  );
}

export default function ResultDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = use(params);
  const resultId = parseInt(resolvedParams.id);

  const [result, setResult] = useState<any>(null);
  const [allAuthorities, setAllAuthorities] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<CtwCounselingCadetApproval[]>([]);
  const [semesterApprovals, setSemesterApprovals] = useState<any[]>([]);
  const [semesterApproval, setSemesterApproval] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);

  const [approvalModal, setApprovalModal] = useState<{
    open: boolean;
    cadetIds: number[];
    status: "approved" | "rejected";
    rejectedReason: string;
    loading: boolean;
    error: string;
  }>({ open: false, cadetIds: [], status: "approved", rejectedReason: "", loading: false, error: "" });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await ctwAssessmentCounselingResultService.getResult(resultId);
      if (!data) { setError("Result not found"); return; }
      setResult(data);

      const consolidated = await ctwAssessmentCounselingResultService.getConsolidatedResults({
        course_id: data.course_id,
        semester_id: data.semester_id,
      });
      if (consolidated) {
        setAllAuthorities(consolidated.authorities || []);
        setApprovals(consolidated.approvals || []);
        setSemesterApprovals(consolidated.semester_approvals || []);
        if ((consolidated.semester_approvals || []).length > 0 && user?.id) {
          const mine = consolidated.semester_approvals.find((a: any) => a.forwarded_by === user.id);
          setSemesterApproval(mine || null);
        } else {
          setSemesterApproval(null);
        }
      }
    } catch (err) {
      console.error("Failed to load counseling result:", err);
      setError("Failed to load result data");
    } finally {
      setLoading(false);
    }
  }, [resultId, user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

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

  const instructorAuthority = useMemo(() => {
    if (!result || !allAuthorities.length) return null;
    const instructor = result.instructor as any;
    if (!instructor) return null;
    const instructorRoleIds = (instructor.roles ?? []).map((r: any) => Number(r.id));
    return allAuthorities.find((a: any) =>
      (a.user_id && Number(a.user_id) === Number(instructor.id)) ||
      (a.role_id && instructorRoleIds.includes(Number(a.role_id)))
    ) ?? null;
  }, [result, allAuthorities]);

  const canCurrentAuthorityApprove = useMemo(() => {
    if (!currentAuthority || allAuthorities.length === 0 || semesterApproval) return false;
    const sortedAuthorities = [...allAuthorities].sort((a, b) => Number(a.sort) - Number(b.sort));
    const myPosition = sortedAuthorities.findIndex(a => Number(a.id) === Number(currentAuthority.id));
    if (myPosition === 0) return true;
    const prevAuthority = sortedAuthorities[myPosition - 1];
    const hasBeenForwardedByPrev =
      semesterApprovals.some((sa: any) =>
        sa.current_authority_id
          ? Number(sa.current_authority_id) === Number(prevAuthority.id)
          : semesterApprovals.length >= myPosition
      );
    if (!hasBeenForwardedByPrev) return false;
    const cadets = result?.result_cadets ?? [];
    return cadets.some((c: any) =>
      approvals.some(a =>
        Number(a.cadet_id) === Number(c.cadet_id) &&
        Number(a.authority_id) === Number(prevAuthority.id) &&
        a.status === "approved"
      )
    );
  }, [currentAuthority, allAuthorities, semesterApproval, semesterApprovals, result, approvals]);

  const isApprovedByMe = (cadetId: number) =>
    approvals.some(a =>
      Number(a.cadet_id) === Number(cadetId) &&
      Number(a.authority_id) === Number(currentAuthorityId) &&
      a.status === "approved"
    );

  const allApprovedByMe = (result?.result_cadets ?? []).every((rc: any) => isApprovedByMe(rc.cadet_id));

  const signatureAuthorities = [...allAuthorities]
    .filter((a: any) => a.is_signature)
    .sort((a, b) => Number(a.sort) - Number(b.sort));

  const openApprovalModal = (cadetIds: number[]) =>
    setApprovalModal({ open: true, cadetIds, status: "approved", rejectedReason: "", loading: false, error: "" });

  const confirmApproval = async () => {
    if (!currentAuthorityId || !result) return;
    if (approvalModal.status === "rejected" && !approvalModal.rejectedReason.trim()) {
      setApprovalModal(p => ({ ...p, error: "Rejection reason is required." }));
      return;
    }
    setApprovalModal(p => ({ ...p, loading: true, error: "" }));
    try {
      await ctwCounselingCadetApprovalService.bulkApprove({
        authority_id: currentAuthorityId,
        status: approvalModal.status,
        approved_by: user?.id,
        approved_date: new Date().toISOString(),
        rejection_reason: approvalModal.rejectedReason || undefined,
        cadets: approvalModal.cadetIds.map(cadetId => ({
          cadet_id: Number(cadetId),
          course_id: result.course_id,
          semester_id: result.semester_id,
          program_id: result.program_id ?? undefined,
          branch_id: result.branch_id ?? undefined,
        })),
      });
      setApprovalModal(p => ({ ...p, open: false, loading: false }));
      await loadData();
    } catch (err: any) {
      setApprovalModal(p => ({ ...p, loading: false, error: err?.message || "Failed to approve." }));
    }
  };

  const handlePrintClick = () => setIsPrintModalOpen(true);
  const confirmPrint = (type: FilePrintType) => {
    setSelectedPrintType(type);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 100);
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
          <p className="text-red-600 font-medium">{error || "Result not found"}</p>
          <button
            onClick={() => router.push("/ctw/assessments/counselings/results")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const availableEvents = (result.counseling_type?.events || [])
    .filter((e: any) => e.is_active)
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200 min-h-screen">
      <style jsx global>{`
        @media print {
          .cv-content { width: 100% !important; max-width: none !important; }
          table { font-size: 14px !important; }
          .print-div { max-width: 60vh !important; margin: 0 auto !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: A3 landscape;
            margin: 14mm 10mm 14mm 10mm;
            @top-left { content: ""; }
            @top-center {
              content: "${(selectedPrintType?.name ?? '').replace(/"/g, '\\"')}";
              font-size: 10pt; white-space: pre; text-align: center; text-transform: uppercase;
            }
            @top-right { content: "BAF - 102"; font-size: 10pt; text-align: right; }
            @bottom-left { content: ""; }
            @bottom-center {
              content: "${(selectedPrintType?.name ?? '').replace(/"/g, '\\"')}" "\\A" counter(page);
              font-size: 10pt; white-space: pre; text-align: center; text-transform: uppercase;
            }
            @bottom-right { content: ""; }
          }
        }
      ` }} />

      {/* Top action bar */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white flex items-center gap-2 transition-all"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          {currentAuthority && canCurrentAuthorityApprove && !allApprovedByMe && (
            <button
              onClick={() => openApprovalModal((result.result_cadets ?? []).map((rc: any) => rc.cadet_id))}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
            >
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              Approve All ({result.result_cadets?.length ?? 0})
            </button>
          )}
          {currentAuthority && allApprovedByMe && (
            <span className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium flex items-center gap-2">
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              Approved by {currentAuthority.role?.name || "You"}
            </span>
          )}
          <button
            onClick={handlePrintClick}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white flex items-center gap-2 transition-all"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      <div className="p-4 cv-content">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-center text-xl font-semibold text-gray-900 uppercase underline">
            INTERVIEW/COUNSELLING Record
          </h1>
          <h1 className="text-center text-xl font-semibold text-gray-900 uppercase underline">
            BAF Academy
          </h1>
        </div>

        {/* Batch info */}
        <div className="py-3 mb-8 px-2">
          <div className="flex flex-wrap justify-between items-center text-sm">
            <div className="flex gap-1.5">
              <span>BD/No:</span>
              <span className="font-bold text-gray-900 underline">
                {result.result_cadets && result.result_cadets.length === 1
                  ? result.result_cadets[0].bd_no
                  : result.result_cadets && result.result_cadets.length > 1 ? "Multiple" : "—"}
              </span>
            </div>
            <div className="flex gap-1.5">
              <span>Name:</span>
              <span className="font-bold text-gray-900 underline">
                {result.result_cadets && result.result_cadets.length === 1
                  ? (() => {
                    const ranks = result.result_cadets[0].cadet?.assigned_ranks;
                    const rank = ranks?.find((r: any) => r.is_current)?.rank || ranks?.[0]?.rank;
                    return rank?.short_name || rank?.name || "—";
                  })()
                  : result.result_cadets && result.result_cadets.length > 1 ? "Multiple" : "—"}
                  {' '}
                {result.result_cadets && result.result_cadets.length === 1
                  ? result.result_cadets[0].cadet?.name
                  : result.result_cadets && result.result_cadets.length > 1 ? "Batch Report" : "—"}
              </span>
            </div>
            <div className="flex gap-1.5">
              <span>Term:</span>
              <span className="font-bold text-gray-900 underline">{result.semester?.name || "—"}</span>
            </div>
            <div className="flex gap-1.5">
              <span>Course:</span>
              <span className="font-bold text-gray-900 uppercase underline">{result.course?.name || "—"}</span>
            </div>
          </div>
        </div>

        {/* Individual Cadet Reports */}
        <div className="space-y-16">
          {result.result_cadets?.map((rc: any, rcIdx: any) => {
            return (
              <div key={rcIdx} className="report-block">
                {result.result_cadets && result.result_cadets.length > 1 && (
                  <div className="mb-2 flex gap-4 text-sm font-bold uppercase">
                    <span>BD/No: {rc.bd_no}</span>
                    <span>Name: {rc.cadet?.name}</span>
                  </div>
                )}

                {/* Assessment Table */}
                <table className="w-full border-collapse border border-black text-sm">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="px-3 py-3 text-center font-bold text-gray-700 border-r border-black w-[15%]">Events</th>
                      <th className="px-3 py-3 text-center font-bold text-gray-700 border-r border-black w-[35%]">Remarks</th>
                      <th className="px-3 py-3 text-center font-bold text-gray-700 border-r border-black w-[12%]">{`Cadets' Initial & Date`}</th>
                      <th className="px-3 py-3 text-center font-bold text-gray-700 border-r border-black w-[18%]">Counseling Officer (Rank & Name)</th>
                      {signatureAuthorities.map((auth: any, idx: number) => (
                        <th
                          key={auth.id}
                          className={`px-3 py-3 text-center font-bold text-gray-700 uppercase ${idx < signatureAuthorities.length - 1 ? "border-r border-black" : ""}`}
                          style={{ width: `${Math.floor(20 / signatureAuthorities.length)}%` }}
                        >
                          {auth.role?.name || `Auth #${auth.id}`}
                        </th>
                      ))}
                      {signatureAuthorities.length === 0 && (
                        <>
                          <th className="px-3 py-3 text-center font-bold text-gray-700 border-r border-black w-[10%]">OC Wgs</th>
                          <th className="px-3 py-3 text-center font-bold text-gray-700 uppercase w-[10%]">CI BAFA</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {availableEvents.map((event: any, eventIdx: number) => {
                      const cadetRemark = rc.remarks?.find((r: any) => r.ctw_assessment_counseling_event_id === event.id);
                      return (
                        <tr key={event.id} className="border-b border-black">
                          <td className="px-3 py-4 text-gray-900 border-r border-black font-bold">
                            {event.event_name}
                          </td>
                          <td className="px-3 py-4 border-r border-black text-gray-800 leading-relaxed">
                            {!rc.is_present ? (
                              <span className="text-red-500 font-bold uppercase">Absent: {rc.absent_reason || "N/A"}</span>
                            ) : (
                              cadetRemark?.remark || "—"
                            )}
                          </td>
                          {eventIdx === 0 && (
                            <>
                              {/* Cadets' Initial */}
                              <td rowSpan={availableEvents.length || 1} className="px-2 py-4 border-r border-black align-middle text-center bg-white font-mono">
                                <p className="font-bold">{result.counseling_date ? new Date(result.counseling_date).toLocaleDateString("en-GB") : "—"}</p>
                                <p className="text-[11px]">{`Counselling has been shown and understood by the Officer Cadet.`}</p>
                              </td>
                              {/* Counseling Officer */}
                              <td rowSpan={availableEvents.length || 1} className="px-2 py-4 text-gray-900 border-r border-black align-middle bg-white">
                                <SignatureBlock
                                  signature={(result.instructor as any)?.signature}
                                  name={result.instructor?.name}
                                  rank={(result.instructor as any)?.rank?.short_name || (result.instructor as any)?.rank?.name}
                                  designation={instructorAuthority?.role?.name || (result.instructor as any)?.roles?.find((r: any) => r.pivot?.is_primary)?.name}
                                  dateStr={result.counseling_date ? new Date(result.counseling_date).toLocaleDateString("en-GB") : null}
                                />
                              </td>
                              {/* Dynamic signature cells */}
                              {signatureAuthorities.map((auth: any, sIdx: number) => {
                                const isMe = currentAuthority && Number(auth.id) === Number(currentAuthority.id);
                                const cadetApproval = approvals.find(a =>
                                  Number(a.cadet_id) === Number(rc.cadet_id) &&
                                  Number(a.authority_id) === Number(auth.id) &&
                                  a.status === "approved"
                                );
                                const isLastSig = sIdx === signatureAuthorities.length - 1;
                                return (
                                  <td
                                    key={auth.id}
                                    rowSpan={availableEvents.length || 1}
                                    className={`px-2 py-4 align-center bg-white ${!isLastSig ? "border-r border-black" : ""}`}
                                  >
                                    {cadetApproval ? (
                                      <SignatureBlock
                                        signature={(cadetApproval as any).approver?.signature}
                                        name={(cadetApproval as any).approver?.name}
                                        rank={(cadetApproval as any).approver?.rank?.short_name || (cadetApproval as any).approver?.rank?.name}
                                        designation={auth.role?.name}
                                        dateStr={cadetApproval.approved_date ? new Date(cadetApproval.approved_date).toLocaleDateString("en-GB") : null}
                                      />
                                    ) : isMe && canCurrentAuthorityApprove && !isApprovedByMe(rc.cadet_id) ? (
                                      <div className="no-print">
                                        <button
                                          onClick={() => openApprovalModal([rc.cadet_id])}
                                          className="px-2 py-1 text-[10px] font-semibold bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                                        >
                                          Approve
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-gray-200">—</span>
                                    )}
                                  </td>
                                );
                              })}
                              {signatureAuthorities.length === 0 && (
                                <>
                                  <td rowSpan={availableEvents.length || 1} className="px-2 py-4 border-r border-black align-middle text-center bg-white text-gray-300">—</td>
                                  <td rowSpan={availableEvents.length || 1} className="px-2 py-4 align-middle text-center bg-white text-gray-300">—</td>
                                </>
                              )}
                            </>
                          )}
                        </tr>
                      );
                    })}
                    {availableEvents.length === 0 && (
                      <tr>
                        <td colSpan={4 + (signatureAuthorities.length || 2)} className="px-4 py-10 text-center text-gray-400 italic">
                          No events configured for this counseling type.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>

      {/* Approval Modal */}
      <Modal
        isOpen={approvalModal.open}
        onClose={() => setApprovalModal(p => ({ ...p, open: false }))}
        showCloseButton
        className="max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 flex items-center justify-center"><FullLogo /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Cadet Counseling Approval</h2>
              <p className="text-xs text-gray-500">{currentAuthority?.role?.name || "Authority"} approval</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Counseling Type: <span className="font-medium text-gray-800">{result?.counseling_type?.type_name || "—"}</span>
          </p>

          {/* Cadets list */}
          <div className="mb-4 rounded-lg border border-gray-200 overflow-hidden text-xs">
            {approvalModal.cadetIds.map((cadetId, i) => {
              const rc = result?.result_cadets?.find((c: any) => Number(c.cadet_id) === Number(cadetId));
              const currentRank = rc?.cadet?.assigned_ranks?.find((r: any) => r.is_current);
              return (
                <div key={cadetId} className={`flex items-center gap-3 px-3 py-2 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                  <span className="font-mono font-bold text-gray-600">{rc?.bd_no || rc?.cadet?.cadet_number || "—"}</span>
                  <span className="text-gray-400">{currentRank?.rank?.name || "—"}</span>
                  <span className="font-semibold text-gray-800">{rc?.cadet?.name || "—"}</span>
                </div>
              );
            })}
          </div>

          {/* Status selector */}
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

      <PrintTypeModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirm={confirmPrint}
      />
    </div>
  );
}
