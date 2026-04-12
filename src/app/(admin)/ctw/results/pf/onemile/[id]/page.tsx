/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwOneMileResultService } from "@/libs/services/ctwOneMileResultService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import { ctwCommonService } from "@/libs/services/ctwCommonService";
import { ctwApprovalService } from "@/libs/services/ctwApprovalService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import { Modal } from "@/components/ui/modal/index";
import type { CtwOneMileResult } from "@/libs/types/ctwOneMile";
import { getOrdinal } from "@/libs/utils/formatter";

const ONE_MILE_MODULE_CODE = "one_mile";

export default function OneMileResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;
  const { user } = useAuth();

  const [result, setResult] = useState<CtwOneMileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [oneMileModuleId, setOneMileModuleId] = useState<number | null>(null);
  const [oneMileModule, setOneMileModule] = useState<any>(null);
  const [moduleLoading, setModuleLoading] = useState(true);
  const [estimatedMarks, setEstimatedMarks] = useState<any[]>([]);
  const [loadingEstimatedMarks, setLoadingEstimatedMarks] = useState(false);

  const [selectedCadetIds, setSelectedCadetIds] = useState<number[]>([]);
  const [approvalModal, setApprovalModal] = useState({ open: false, cadetIds: [] as number[], status: "approved" as "approved" | "rejected", rejectedReason: "", loading: false, error: "" });
  const [forwardModal, setForwardModal] = useState({ open: false, loading: false, error: "" });
  const [moduleApprovalModal, setModuleApprovalModal] = useState({ open: false, status: "approved" as "approved" | "rejected", rejectedReason: "", loading: false, error: "" });

  useEffect(() => {
    if (!user?.id) return;
    const fetchModuleId = async () => {
      try {
        setModuleLoading(true);
        const options = await ctwCommonService.getOneMileFormOptions(user?.id || 0);
        if (options?.module) {
          setOneMileModuleId(options.module.id);
          setOneMileModule(options.module);
        } else {
          setOneMileModuleId(null);
          setLoading(false);
          setError("Module not found.");
        }
      } catch (err) {
        setOneMileModuleId(null);
        setLoading(false);
        setError("Failed to fetch module ID.");
      } finally {
        setModuleLoading(false);
      }
    };
    fetchModuleId();
  }, [user?.id]);

  useEffect(() => {
    const loadEstimatedMarks = async () => {
      if (!oneMileModuleId || !result?.course_id || !result?.semester_id) {
        return;
      }

      try {
        setLoadingEstimatedMarks(true);
        const response = await ctwResultsModuleService.getEstimatedMarks(oneMileModuleId, {
          semester_id: result.semester_id,
        });
        setEstimatedMarks(response);
      } catch (err) {
        console.error("Failed to load estimated marks:", err);
      } finally {
        setLoadingEstimatedMarks(false);
      }
    };

    if (result) {
      loadEstimatedMarks();
    }
  }, [oneMileModuleId, result?.course_id, result?.semester_id]);

  const getEstimatedMarkInfo = () => {
    if (!result?.exam_type_id) return null;
    return estimatedMarks.find((em: any) => em.exam_type_id === result.exam_type_id);
  };

  useEffect(() => {
    const loadResult = async () => {
      if (oneMileModuleId === null || resultId === undefined) {
        return;
      }

      try {
        setLoading(true);
        const data = await ctwOneMileResultService.getResult(oneMileModuleId, parseInt(resultId));
        if (data) {
          setResult(data);
        } else {
          setError("Result not found");
        }
      } catch (err) {
        console.error("Failed to load result:", err);
        setError("Failed to load result data");
      } finally {
        setLoading(false);
      }
    };

    if (!moduleLoading && resultId) {
      loadResult();
    }
  }, [resultId, oneMileModuleId, moduleLoading]);

  const approvalAuthorities = (result as any)?.approval_authorities ?? [];
  const userRoleIds = (user as any)?.roles?.filter((r: any) => r.pivot?.is_primary).map((r: any) => r.id) ?? [];
  const userId = user?.id;

  const myAuthority = approvalAuthorities.find((a: any) =>
    (a.user_id && a.user_id === userId) || (a.role_id && userRoleIds.includes(a.role_id))
  ) ?? null;

  const canApprove = approvalAuthorities.some((a: any) => {
    const hasPermission = a.is_initial_cadet_approve || a.is_cadet_approve;
    if (!hasPermission) return false;
    if (a.user_id && a.user_id === userId) return true;
    if (a.role_id && userRoleIds.includes(a.role_id)) return true;
    return false;
  });

  const canInitialForward = approvalAuthorities.some((a: any) => {
    if (!a.is_initial_cadet_approve || !a.is_active) return false;
    if (a.user_id && a.user_id === userId) return true;
    if (a.role_id && userRoleIds.includes(a.role_id)) return true;
    return false;
  });

  const cadetApprovals = (result as any)?.cadet_approvals ?? [];
  const allCadetsApproved = (result?.achieved_marks ?? []).length > 0 && (result?.achieved_marks ?? []).every((m: any) => {
    const approval = cadetApprovals.find((a: any) => a.cadet_id === m.cadet_id && a.authority_id === myAuthority?.id);
    return approval?.status === "approved";
  });

  const isForwarded = ((result as any)?.module_approvals?.length ?? 0) > 0;
  const canApproveAction = canApprove && (canInitialForward ? !isForwarded : true);
  const showForwardButton = canInitialForward && !isForwarded && allCadetsApproved;

  const getNextAuthority = () => {
    const sorted = [...approvalAuthorities].filter((a: any) => a.is_active).sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
    if (!myAuthority) return sorted.find((a: any) => !a.is_initial_cadet_approve) ?? null;
    return sorted.find((a: any) => (a.sort ?? 0) > ((myAuthority as any).sort ?? 0)) ?? null;
  };

  const getCadetApprovalStatus = (cadetId: number) => {
    const approval = cadetApprovals.find((a: any) => a.cadet_id === cadetId && a.authority_id === myAuthority?.id);
    return approval?.status ?? "pending";
  };

  const pendingCadetIds = (result?.achieved_marks ?? []).filter((m: any) => getCadetApprovalStatus(m.cadet_id) === "pending").map((m: any) => m.cadet_id);

  const toggleCadet = (cadetId: number) => {
    setSelectedCadetIds(prev => prev.includes(cadetId) ? prev.filter(id => id !== cadetId) : [...prev, cadetId]);
  };

  const toggleSelectAll = () => {
    const allPendingSelected = pendingCadetIds.length > 0 && pendingCadetIds.every((id: number) => selectedCadetIds.includes(id));
    setSelectedCadetIds(allPendingSelected ? [] : pendingCadetIds);
  };

  const confirmApproval = async () => {
    if (!result || !oneMileModuleId) return;
    if (approvalModal.status === "rejected" && !approvalModal.rejectedReason.trim()) {
      setApprovalModal(prev => ({ ...prev, error: "Rejection reason is required." }));
      return;
    }
    setApprovalModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      await ctwApprovalService.approveCadets({
        course_id: result.course_id,
        semester_id: result.semester_id,
        module_id: oneMileModuleId,
        cadet_ids: approvalModal.cadetIds,
        authority_id: (myAuthority as any)?.id ?? null,
        status: approvalModal.status,
        rejected_reason: approvalModal.status === "rejected" ? approvalModal.rejectedReason : undefined,
      });
      setApprovalModal({ open: false, cadetIds: [], status: "approved", rejectedReason: "", loading: false, error: "" });
      setSelectedCadetIds([]);
      window.location.reload();
    } catch (err: any) {
      setApprovalModal(prev => ({ ...prev, loading: false, error: err?.message || "Failed to update approval." }));
    }
  };

  const confirmForward = async () => {
    if (!result || !oneMileModuleId) return;
    setForwardModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      const nextAuth = getNextAuthority();
      await ctwApprovalService.forwardModule({
        course_id: result.course_id,
        semester_id: result.semester_id,
        module_id: oneMileModuleId,
        authority_ids: nextAuth ? [nextAuth.id] : [],
      });
      setForwardModal({ open: false, loading: false, error: "" });
      window.location.reload();
    } catch (err: any) {
      setForwardModal(prev => ({ ...prev, loading: false, error: err?.message || "Failed to forward." }));
    }
  };

  const handlePrint = () => {
    window.print();
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
          <p className="text-red-600">{error || "Result not found"}</p>
          <button
            onClick={() => router.push("/ctw/results/pf/onemile")}
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
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ctw/results/pf/onemile")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
          {canApproveAction && selectedCadetIds.length > 0 && (
            <button onClick={() => setApprovalModal({ open: true, cadetIds: selectedCadetIds, status: "approved", rejectedReason: "", loading: false, error: "" })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium">
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              Approve Selected ({selectedCadetIds.length})
            </button>
          )}
          {showForwardButton && (
            <button onClick={() => setForwardModal({ open: true, loading: false, error: "" })}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium">
              <Icon icon="hugeicons:share-04" className="w-4 h-4" />
              Forward {getNextAuthority() ? `to ${getNextAuthority()?.role?.name || getNextAuthority()?.user?.name || "Next"}` : ""}
            </button>
          )}
          {canInitialForward && isForwarded && (
            <span className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-green-50 text-green-700 border border-green-200">
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" /> Already Forwarded
            </span>
          )}
          <button
            onClick={() => router.push(`/ctw/results/pf/onemile/${result.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Result
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
            CTW One Mile Result Sheet
          </p>
        </div>

        {result.achieved_marks && result.achieved_marks.length > 0 && (
          <div className="mb-6">
            <div className="overflow-x-auto">
              {(() => {
                const estimatedMarkInfo = getEstimatedMarkInfo();
                const practiceCount: number = estimatedMarkInfo?.practice_count || (oneMileModule as any)?.practice_count || 0;
                const convPracticeWeight = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.convert_of_practice || 0) : (oneMileModule ? parseFloat(oneMileModule.convert_of_practice || 0) : 0);
                const convExamWeight = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.convert_of_exam || 0) : (oneMileModule ? parseFloat(oneMileModule.convert_of_exam || 0) : 0);
                const maxTestMark = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.estimated_mark_per_instructor || estimatedMarkInfo.mark || 0) : 0;
                const conversationMark = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.conversation_mark || 0) : 0;
                const hasPrac = practiceCount > 0;
                const rs = hasPrac ? 2 : 1;

                // Compute per-cadet data with conv mark
                const cadetRows = result.achieved_marks.map((mark, index) => {
                  const practices: number[] = [];
                  if (mark.details) {
                    mark.details.forEach(d => {
                      if (d.practices_marks !== null && d.practices_marks !== undefined) {
                        practices.push(parseFloat(String(d.practices_marks)));
                      }
                    });
                  }
                  const avg_practice = practices.length > 0 ? practices.reduce((a, b) => a + b, 0) / practices.length : 0;
                  const test_mark = parseFloat(String(mark.achieved_mark || 0));
                  const conv_practice = (avg_practice * convPracticeWeight) / 100;
                  const conv_exam = (test_mark * convExamWeight) / 100;
                  let finalMark = conv_practice + conv_exam;
                  if (conversationMark > 0 && finalMark > conversationMark) finalMark = conversationMark;
                  const convMark = maxTestMark > 0 ? (finalMark * conversationMark) / maxTestMark : 0;
                  return { mark, index, practices, avg_practice, test_mark, conv_practice, conv_exam, finalMark, convMark, position: 0, remark: "-" };
                });

                // Rank by convMark
                const sorted = [...cadetRows].sort((a, b) => b.convMark - a.convMark);
                sorted.forEach((item, idx) => {
                  if (idx === 0) item.position = 1;
                  else if (item.convMark === sorted[idx - 1].convMark) item.position = sorted[idx - 1].position;
                  else item.position = idx + 1;
                  item.remark = item.convMark < conversationMark * 0.5 ? "Failed" : "-";
                });

                return (
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr>
                        {canApproveAction && (
                          <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={rs}>
                            <input
                              type="checkbox"
                              checked={pendingCadetIds.length > 0 && pendingCadetIds.every((id: number) => selectedCadetIds.includes(id))}
                              onChange={toggleSelectAll}
                              className="w-4 h-4"
                            />
                          </th>
                        )}
                        <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={rs}>SL</th>
                        <th className="border border-black px-2 py-2 text-center align-middle whitespace-nowrap" rowSpan={rs}>BD No.</th>
                        <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={rs}>Rank</th>
                        <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={rs}>Name</th>
                        <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={rs}>Branch</th>
                        {hasPrac && (
                          <th className="border border-black px-2 py-1 text-center align-middle font-semibold" colSpan={practiceCount}>Practices</th>
                        )}
                        <th className="border border-black px-2 py-1 text-center align-middle whitespace-nowrap text-xs font-semibold" rowSpan={rs}>Avg.<br />Prac</th>
                        <th className="border border-black px-2 py-1 text-center align-middle whitespace-nowrap text-xs font-semibold" rowSpan={rs}>Exam</th>
                        <th className="border border-black px-2 py-1 text-center align-middle whitespace-nowrap text-xs font-semibold" rowSpan={rs}>Prac<br />({convPracticeWeight}%)</th>
                        <th className="border border-black px-2 py-1 text-center align-middle whitespace-nowrap text-xs font-semibold" rowSpan={rs}>Exam<br />({convExamWeight}%)</th>
                        <th className="border border-black px-2 py-1 text-center align-middle text-xs font-semibold" rowSpan={rs}>Total</th>
                        <th className="border border-black px-2 py-1 text-center align-middle whitespace-nowrap text-xs font-semibold" rowSpan={rs}>Conv<br />({conversationMark})</th>
                        <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={rs}>Position</th>
                        <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={rs}>Remarks</th>
                        {canApprove && (
                          <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={rs}>Approval</th>
                        )}
                      </tr>
                      {hasPrac && (
                        <tr>
                          {Array.from({ length: practiceCount }, (_, i) => (
                            <th key={i} className="border border-black px-1 py-1 text-center align-middle text-xs font-normal">P{i + 1}</th>
                          ))}
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {cadetRows.map(({ mark, index, practices, avg_practice, test_mark, conv_practice, conv_exam, finalMark, convMark, position, remark }) => (
                        <tr key={mark.id}>
                          {canApproveAction && (
                            <td className="border border-black px-2 py-2 text-center no-print">
                              {getCadetApprovalStatus(mark.cadet_id) === "pending" ? (
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
                            {mark.cadet?.assigned_ranks?.find(ar => ar.rank)?.rank?.short_name ||
                              mark.cadet?.assigned_ranks?.find(ar => ar.rank)?.rank?.name || "-"}
                          </td>
                          <td className="border border-black px-2 py-2 font-medium">{mark.cadet?.name || "N/A"}</td>
                          <td className="border border-black px-2 py-2">{mark.cadet?.assigned_branchs?.find(br => br.branch)?.branch?.name || "N/A"}</td>
                          {hasPrac && Array.from({ length: practiceCount }, (_, i) => (
                            <td key={i} className="border border-black px-2 py-2 text-center">
                              {practices[i] !== undefined ? practices[i].toFixed(2) : "-"}
                            </td>
                          ))}
                          <td className="border border-black px-2 py-2 text-center">{avg_practice.toFixed(2)}</td>
                          <td className="border border-black px-2 py-2 text-center">{test_mark.toFixed(2)}</td>
                          <td className="border border-black px-2 py-2 text-center font-semibold">{conv_practice.toFixed(2)}</td>
                          <td className="border border-black px-2 py-2 text-center font-semibold">{conv_exam.toFixed(2)}</td>
                          <td className="border border-black px-2 py-2 text-center font-bold">{finalMark.toFixed(2)}</td>
                          <td className="border border-black px-2 py-2 text-center font-bold text-blue-700">{convMark.toFixed(2)}</td>
                          <td className="border border-black px-2 py-2 text-center">{getOrdinal(position)}</td>
                          <td className={`border border-black px-2 py-2 text-center ${remark === "Failed" ? "text-red-600 font-semibold" : "text-gray-400"}`}>{remark}</td>
                          {canApprove && (
                            <td className="border border-black px-2 py-2 text-center no-print">
                              {getCadetApprovalStatus(mark.cadet_id) === "approved" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                  <Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3" /> Approved
                                </span>
                              )}
                              {getCadetApprovalStatus(mark.cadet_id) === "rejected" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                  <Icon icon="hugeicons:cancel-circle-02" className="w-3 h-3" /> Rejected
                                </span>
                              )}
                              {getCadetApprovalStatus(mark.cadet_id) === "pending" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                  <Icon icon="hugeicons:clock-01" className="w-3 h-3" /> Pending
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        )}

        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {/* Approval Modal */}
      <Modal isOpen={approvalModal.open} onClose={() => setApprovalModal(prev => ({ ...prev, open: false }))} showCloseButton>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">
            {approvalModal.status === "approved" ? "Approve" : "Reject"} Selected Cadets ({approvalModal.cadetIds.length})
          </h3>
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setApprovalModal(prev => ({ ...prev, status: "approved" }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${approvalModal.status === "approved" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              Approve
            </button>
            <button
              onClick={() => setApprovalModal(prev => ({ ...prev, status: "rejected" }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${approvalModal.status === "rejected" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              Reject
            </button>
          </div>
          {approvalModal.status === "rejected" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
              <textarea
                value={approvalModal.rejectedReason}
                onChange={(e) => setApprovalModal(prev => ({ ...prev, rejectedReason: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder="Enter reason for rejection..."
              />
            </div>
          )}
          {approvalModal.error && <p className="text-red-600 text-sm mb-4">{approvalModal.error}</p>}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setApprovalModal({ open: false, cadetIds: [], status: "approved", rejectedReason: "", loading: false, error: "" })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={confirmApproval}
              disabled={approvalModal.loading}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${approvalModal.status === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} disabled:opacity-50`}
            >
              {approvalModal.loading ? "Processing..." : approvalModal.status === "approved" ? "Confirm Approval" : "Confirm Rejection"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Forward Modal */}
      <Modal isOpen={forwardModal.open} onClose={() => setForwardModal(prev => ({ ...prev, open: false }))} showCloseButton>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">Forward to Next Authority</h3>
          <p className="text-sm text-gray-600 mb-4">
            {getNextAuthority()
              ? `This will forward the module to ${getNextAuthority()?.role?.name || getNextAuthority()?.user?.name || "the next authority"}.`
              : "No next authority found."}
          </p>
          {forwardModal.error && <p className="text-red-600 text-sm mb-4">{forwardModal.error}</p>}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setForwardModal({ open: false, loading: false, error: "" })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={confirmForward}
              disabled={forwardModal.loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
            >
              {forwardModal.loading ? "Forwarding..." : "Confirm Forward"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Module Approval Modal */}
      <Modal isOpen={moduleApprovalModal.open} onClose={() => setModuleApprovalModal(prev => ({ ...prev, open: false }))} showCloseButton>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">
            {moduleApprovalModal.status === "approved" ? "Approve" : "Reject"} Module
          </h3>
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setModuleApprovalModal(prev => ({ ...prev, status: "approved" }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${moduleApprovalModal.status === "approved" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              Approve
            </button>
            <button
              onClick={() => setModuleApprovalModal(prev => ({ ...prev, status: "rejected" }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${moduleApprovalModal.status === "rejected" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              Reject
            </button>
          </div>
          {moduleApprovalModal.status === "rejected" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
              <textarea
                value={moduleApprovalModal.rejectedReason}
                onChange={(e) => setModuleApprovalModal(prev => ({ ...prev, rejectedReason: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder="Enter reason for rejection..."
              />
            </div>
          )}
          {moduleApprovalModal.error && <p className="text-red-600 text-sm mb-4">{moduleApprovalModal.error}</p>}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setModuleApprovalModal({ open: false, status: "approved", rejectedReason: "", loading: false, error: "" })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => setModuleApprovalModal(prev => ({ ...prev, open: false }))}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${moduleApprovalModal.status === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
