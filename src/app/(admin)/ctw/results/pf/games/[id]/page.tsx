/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwGamesResultService } from "@/libs/services/ctwGamesResultService";
import { ctwCommonService } from "@/libs/services/ctwCommonService";
import { ctwApprovalService } from "@/libs/services/ctwApprovalService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import { Modal } from "@/components/ui/modal/index";
import type { CtwGamesResult } from "@/libs/types/ctwGames";
import { getOrdinal } from "@/libs/utils/formatter";

const GAMES_MODULE_CODE = "games";

export default function GamesResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;
  const { user } = useAuth();

  const [result, setResult] = useState<CtwGamesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gamesModuleId, setGamesModuleId] = useState<number | null>(null);
  const [moduleLoading, setModuleLoading] = useState(true);

  const [selectedCadetIds, setSelectedCadetIds] = useState<number[]>([]);
  const [approvalModal, setApprovalModal] = useState({ open: false, cadetIds: [] as number[], status: "approved" as "approved" | "rejected", rejectedReason: "", loading: false, error: "" });
  const [forwardModal, setForwardModal] = useState({ open: false, loading: false, error: "" });
  const [moduleApprovalModal, setModuleApprovalModal] = useState({ open: false, status: "approved" as "approved" | "rejected", rejectedReason: "", loading: false, error: "" });

  useEffect(() => {
    if (!user?.id) return;
    const fetchModuleId = async () => {
      try {
        setModuleLoading(true);
        const options = await ctwCommonService.getGamesFormOptions(user?.id || 0);
        if (options?.module) {
          setGamesModuleId(options.module.id);
        } else {
          setGamesModuleId(null);
          setLoading(false);
          setError("Module not found.");
        }
      } catch (err) {
        setGamesModuleId(null);
        setLoading(false);
        setError("Failed to fetch module ID.");
      } finally {
        setModuleLoading(false);
      }
    };
    fetchModuleId();
  }, [user?.id]);

  useEffect(() => {
    const loadResult = async () => {
      if (gamesModuleId === null || !resultId) { setLoading(false); return; }
      try {
        setLoading(true);
        const data = await ctwGamesResultService.getResult(gamesModuleId, parseInt(resultId));
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
    if (!moduleLoading && resultId) loadResult();
  }, [resultId, gamesModuleId, moduleLoading]);

  // --- Authority / permission logic ---
  const approvalAuthorities = (result as any)?.approval_authorities ?? [];
  const primaryRoleIds = (user as any)?.roles?.filter((r: any) => r.pivot?.is_primary).map((r: any) => r.id) ?? [];
  const allRoleIds = (user as any)?.roles?.map((r: any) => r.id) ?? [];
  const userRoleIds = primaryRoleIds.length > 0 ? primaryRoleIds : allRoleIds;
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
    if (!result || !gamesModuleId) return;
    if (approvalModal.status === "rejected" && !approvalModal.rejectedReason.trim()) {
      setApprovalModal(prev => ({ ...prev, error: "Rejection reason is required." }));
      return;
    }
    setApprovalModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      await ctwApprovalService.approveCadets({
        course_id: result.course_id,
        semester_id: result.semester_id,
        module_id: gamesModuleId,
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
    if (!result || !gamesModuleId) return;
    setForwardModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      const nextAuth = getNextAuthority();
      await ctwApprovalService.forwardModule({
        course_id: result.course_id,
        semester_id: result.semester_id,
        module_id: gamesModuleId,
        authority_ids: nextAuth ? [nextAuth.id] : [],
      });
      setForwardModal({ open: false, loading: false, error: "" });
      window.location.reload();
    } catch (err: any) {
      setForwardModal(prev => ({ ...prev, loading: false, error: err?.message || "Failed to forward." }));
    }
  };

  // Collect all unique detail columns
  const allDetails = useMemo(() => {
    if (!result?.achieved_marks) return [];
    const detailMap = new Map<number, any>();
    result.achieved_marks.forEach((mark: any) => {
      if (mark.details) {
        mark.details.forEach((det: any) => {
          const did = det.ctw_results_module_estimated_marks_details_id;
          if (!detailMap.has(did)) {
            detailMap.set(did, det);
          }
        });
      }
    });
    return Array.from(detailMap.values());
  }, [result]);

  const hasDetails = allDetails.length > 0;

  // Ranked cadets with position and remarks
  const rankedData = useMemo(() => {
    const marks = result?.achieved_marks ?? [];
    if (marks.length === 0) return [];
    const sorted = [...marks].sort((a: any, b: any) => parseFloat(String(b.achieved_mark || 0)) - parseFloat(String(a.achieved_mark || 0)));
    const ranked = sorted.map((mark: any, idx: number) => {
      let position = 1;
      if (idx > 0 && parseFloat(String(mark.achieved_mark || 0)) === parseFloat(String(sorted[idx - 1].achieved_mark || 0))) {
        position = (ranked as any)[idx - 1]?.position || 1;
      } else {
        position = idx + 1;
      }
      return { ...mark, position, remark: "-" };
    });
    return ranked.sort((a: any, b: any) => {
      const aNo = a.cadet?.cadet_number ?? a.cadet?.bd_no ?? "";
      const bNo = b.cadet?.cadet_number ?? b.cadet?.bd_no ?? "";
      return String(aNo).localeCompare(String(bNo), undefined, { numeric: true });
    });
  }, [result]);

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
          <button onClick={() => router.push("/ctw/results/pf/games")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      <div className="p-4 flex items-center justify-between no-print">
        <button onClick={() => router.push("/ctw/results/pf/games")} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />Back to List
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Icon icon="hugeicons:printer" className="w-4 h-4" />Print
          </button>
          {canApproveAction && selectedCadetIds.length > 0 && (
            <button onClick={() => setApprovalModal({ open: true, cadetIds: selectedCadetIds, status: "approved", rejectedReason: "", loading: false, error: "" })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium">
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />Approve Selected ({selectedCadetIds.length})
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
        </div>
      </div>

      <div className="p-8 cv-content">
        <div className="mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">CTW Games Result Sheet</p>
        </div>

        {result.achieved_marks && result.achieved_marks.length > 0 && (
          <div className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    {canApproveAction && pendingCadetIds.length > 0 && (
                      <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={2}>
                        <input type="checkbox" checked={pendingCadetIds.every((id: number) => selectedCadetIds.includes(id))} onChange={toggleSelectAll} className="w-4 h-4" />
                      </th>
                    )}
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>Ser</th>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>BD/No</th>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>Rank</th>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>Name</th>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>Branch</th>
                    {hasDetails && allDetails.map((det: any) => (
                      <th key={det.ctw_results_module_estimated_marks_details_id} className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>
                        {det.detail_name || `Detail ${det.ctw_results_module_estimated_marks_details_id}`}
                      </th>
                    ))}
                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>Total</th>
                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>Position</th>
                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>Remarks</th>
                    {canApprove && <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={2}>Status</th>}
                    {canApproveAction && !isForwarded && <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={2}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {rankedData.map((mark: any, index: number) => {
                    const status = getCadetApprovalStatus(mark.cadet_id);
                    const isPending = status === "pending";
                    return (
                      <tr key={mark.id}>
                        {canApproveAction && pendingCadetIds.length > 0 && (
                          <td className="border border-black px-2 py-2 text-center no-print">
                            {isPending ? <input type="checkbox" checked={selectedCadetIds.includes(mark.cadet_id)} onChange={() => toggleCadet(mark.cadet_id)} className="w-4 h-4" /> : <span className="text-xs text-gray-400">-</span>}
                          </td>
                        )}
                        <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                        <td className="border border-black px-2 py-2 text-center">{(mark.cadet as any)?.bd_no || mark.cadet?.cadet_number || "N/A"}</td>
                        <td className="border border-black px-2 py-2 text-center">
                          {(mark.cadet as any)?.assigned_ranks?.find((ar: any) => ar.rank)?.rank?.short_name || (mark.cadet as any)?.assigned_ranks?.find((ar: any) => ar.rank)?.rank?.name || "-"}
                        </td>
                        <td className="border border-black px-2 py-2 font-medium">{mark.cadet?.name || "N/A"}</td>
                        <td className="border border-black px-2 py-2">{(mark.cadet as any)?.assigned_branchs?.find((br: any) => br.branch)?.branch?.name || result.branch?.name || "N/A"}</td>
                        {hasDetails && allDetails.map((det: any) => {
                          const did = det.ctw_results_module_estimated_marks_details_id;
                          const detEntry = (mark as any).details?.find((d: any) => d.ctw_results_module_estimated_marks_details_id === did);
                          return (
                            <td key={did} className="border border-black px-2 py-2 text-center font-semibold">
                              {detEntry ? parseFloat(String(detEntry.marks || 0)).toFixed(2) : "\u2014"}
                            </td>
                          );
                        })}
                        <td className="border border-black px-2 py-2 text-center font-bold">{parseFloat(String(mark.achieved_mark || 0)).toFixed(2)}</td>
                        <td className="border border-black px-2 py-2 text-center">{getOrdinal(mark.position)}</td>
                        <td className="border border-black px-2 py-2 text-center text-gray-400">{mark.remark}</td>
                        {canApprove && (
                          <td className="border border-black px-2 py-2 text-center no-print">
                            {status === "approved" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"><Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3" />Approved</span>}
                            {status === "rejected" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"><Icon icon="hugeicons:cancel-circle-02" className="w-3 h-3" />Rejected</span>}
                            {status === "pending" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700"><Icon icon="hugeicons:clock-01" className="w-3 h-3" />Pending</span>}
                          </td>
                        )}
                        {canApproveAction && !isForwarded && (
                          <td className="border border-black px-2 py-2 text-center no-print">
                            {isPending ? (
                              <button onClick={() => setApprovalModal({ open: true, cadetIds: [mark.cadet_id], status: "approved", rejectedReason: "", loading: false, error: "" })}
                                className="px-2 py-1 text-[10px] font-semibold bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                            ) : status === "approved" ? (
                              <button onClick={() => setApprovalModal({ open: true, cadetIds: [mark.cadet_id], status: "approved", rejectedReason: "", loading: false, error: "" })}
                                className="px-2 py-1 text-[10px] font-semibold bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Change</button>
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

      {/* Approval Modal */}
      <Modal isOpen={approvalModal.open} onClose={() => setApprovalModal(prev => ({ ...prev, open: false }))} showCloseButton>
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="flex justify-center mb-2"><FullLogo /></div>
            <h1 className="text-lg font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
            <p className="text-sm font-medium text-gray-700 uppercase">CTW Games</p>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {approvalModal.cadetIds.length === 1 ? "Cadet Approval" : `Cadets Approval (${approvalModal.cadetIds.length} cadets)`}
          </h2>
          {!canInitialForward && (
            <div className="flex gap-3 mb-4 mt-4">
              {(["approved", "rejected"] as const).map(s => (
                <button key={s} onClick={() => setApprovalModal(prev => ({ ...prev, status: s, rejectedReason: "", error: "" }))}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold capitalize transition-colors ${approvalModal.status === s ? s === "approved" ? "bg-green-600 text-white border-green-600" : "bg-red-600 text-white border-red-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>{s === "approved" ? "Approve" : "Reject"}</button>
              ))}
            </div>
          )}
          {approvalModal.status === "rejected" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection <span className="text-red-500">*</span></label>
              <textarea rows={3} value={approvalModal.rejectedReason} onChange={(e) => setApprovalModal(prev => ({ ...prev, rejectedReason: e.target.value }))} placeholder="Enter rejection reason..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            </div>
          )}
          {approvalModal.error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2"><Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />{approvalModal.error}</div>}
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 mt-2">
            <button onClick={() => setApprovalModal({ open: false, cadetIds: [], status: "approved", rejectedReason: "", loading: false, error: "" })} disabled={approvalModal.loading} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={confirmApproval} disabled={approvalModal.loading} className={`px-6 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 ${approvalModal.status === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
              {approvalModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              {approvalModal.status === "approved" ? "Confirm Approve" : "Confirm Reject"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Forward Modal */}
      <Modal isOpen={forwardModal.open} onClose={() => setForwardModal(prev => ({ ...prev, open: false }))} showCloseButton>
        <div className="p-6">
          <div className="flex items-center gap-1 mb-4">
            <div className="flex items-center justify-center w-12 h-12"><img src="/images/logo/logo.png" alt="BAFA Logo" width={50} height={50} className="dark:hidden" /></div>
            <div><h2 className="text-lg font-bold text-gray-900">Forward to Higher Authority</h2><p className="text-xs text-gray-500">Initial module result forwarding</p></div>
          </div>
          {result && (
            <div className="mb-5 rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
              {([["Course", result.course?.name], ["Semester", result.semester?.name], ["Exam Type", result.exam_type?.name]] as [string, string | undefined][]).map(([label, value]) => (
                <div key={label} className="flex px-4 py-2.5"><span className="w-28 text-gray-500 shrink-0">{label}</span><span className="font-medium text-gray-900">{value || "\u2014"}</span></div>
              ))}
            </div>
          )}
          {myAuthority && (
            <div className="flex justify-between items-center gap-2 mb-4">
              <div><h3 className="text-sm font-semibold text-gray-900">Your Level</h3><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium text-xs">{(myAuthority as any).role?.name}</span></div>
              <Icon icon="hugeicons:arrow-right-02" className="w-5 h-5 text-blue-600 shrink-0" />
              <div><h3 className="text-sm font-semibold text-gray-900">Next Level</h3><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium text-xs">{getNextAuthority()?.role?.name || "\u2014"}</span></div>
            </div>
          )}
          <p className="text-sm text-gray-600 mb-5">This will mark the module result as forwarded to the higher authority for further review.</p>
          {forwardModal.error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2"><Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />{forwardModal.error}</div>}
          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
            <button onClick={() => setForwardModal({ open: false, loading: false, error: "" })} disabled={forwardModal.loading} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={confirmForward} disabled={forwardModal.loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50">
              {forwardModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}<Icon icon="hugeicons:share-04" className="w-4 h-4" />Confirm Forward
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
          {moduleApprovalModal.status === "rejected" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
              <textarea rows={3} value={moduleApprovalModal.rejectedReason} onChange={(e) => setModuleApprovalModal(prev => ({ ...prev, rejectedReason: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Enter reason for rejection..." />
            </div>
          )}
          {moduleApprovalModal.error && <p className="text-red-600 text-sm mb-4">{moduleApprovalModal.error}</p>}
          <div className="flex justify-end gap-3">
            <button onClick={() => setModuleApprovalModal({ open: false, status: "approved", rejectedReason: "", loading: false, error: "" })} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Cancel</button>
            <button onClick={() => setModuleApprovalModal(prev => ({ ...prev, open: false }))} className={`px-6 py-2 rounded-lg text-white text-sm font-medium ${moduleApprovalModal.status === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>Confirm</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
