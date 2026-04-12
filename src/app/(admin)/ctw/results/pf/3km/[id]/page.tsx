/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
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

const THREE_KM_MODULE_CODE = "3_km";

type ReportType = "direct_marks" | "practices" | "details_score";

export default function ThreeKmResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;
  const { user } = useAuth();

  const [result, setResult] = useState<CtwOneMileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [threeKmModuleId, setThreeKmModuleId] = useState<number | null>(null);
  const [threeKmModule, setThreeKmModule] = useState<any>(null);
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
        const options = await ctwCommonService.getThreeKmFormOptions(user?.id || 0);
        if (options?.module) {
          setThreeKmModuleId(options.module.id);
          setThreeKmModule(options.module);
        } else {
          setThreeKmModuleId(null);
          setLoading(false);
          setError("Module not found.");
        }
      } catch (err) {
        setThreeKmModuleId(null);
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
      if (!threeKmModuleId || !result?.semester_id) return;
      try {
        setLoadingEstimatedMarks(true);
        const response = await ctwResultsModuleService.getEstimatedMarks(threeKmModuleId, {
          semester_id: result.semester_id,
        });
        setEstimatedMarks(response);
      } catch (err) {
        console.error("Failed to load estimated marks:", err);
      } finally {
        setLoadingEstimatedMarks(false);
      }
    };
    if (result) loadEstimatedMarks();
  }, [threeKmModuleId, result?.course_id, result?.semester_id]);

  const getEstimatedMarkInfo = () => {
    if (!result?.exam_type_id) return null;
    return estimatedMarks.find((em: any) => em.exam_type_id === result.exam_type_id);
  };

  useEffect(() => {
    const loadResult = async () => {
      if (threeKmModuleId === null || resultId === undefined) return;
      try {
        setLoading(true);
        const data = await ctwOneMileResultService.getResult(threeKmModuleId, parseInt(resultId));
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
  }, [resultId, threeKmModuleId, moduleLoading]);

  // Detect report type from data
  const reportType: ReportType = useMemo(() => {
    if (!result?.achieved_marks || result.achieved_marks.length === 0) return "direct_marks";
    const estimatedMarkInfo = getEstimatedMarkInfo();
    const stationDetails = estimatedMarkInfo?.details || [];
    if (stationDetails.length > 0) return "details_score";
    for (const mark of result.achieved_marks) {
      if (mark.details && mark.details.length > 0) {
        const hasPractices = mark.details.some((d: any) =>
          d.practices_marks !== null && d.practices_marks !== undefined
        );
        if (hasPractices) return "practices";
      }
    }
    return "direct_marks";
  }, [result, estimatedMarks]);

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
    if (!result || !threeKmModuleId) return;
    if (approvalModal.status === "rejected" && !approvalModal.rejectedReason.trim()) {
      setApprovalModal(prev => ({ ...prev, error: "Rejection reason is required." }));
      return;
    }
    setApprovalModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      await ctwApprovalService.approveCadets({
        course_id: result.course_id,
        semester_id: result.semester_id,
        module_id: threeKmModuleId,
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
    if (!result || !threeKmModuleId) return;
    setForwardModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      const nextAuth = getNextAuthority();
      await ctwApprovalService.forwardModule({
        course_id: result.course_id,
        semester_id: result.semester_id,
        module_id: threeKmModuleId,
        authority_ids: nextAuth ? [nextAuth.id] : [],
      });
      setForwardModal({ open: false, loading: false, error: "" });
      window.location.reload();
    } catch (err: any) {
      setForwardModal(prev => ({ ...prev, loading: false, error: err?.message || "Failed to forward." }));
    }
  };

  const handlePrint = () => window.print();

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
          <button onClick={() => router.push("/ctw/results/pf/3km")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const estimatedMarkInfo = getEstimatedMarkInfo();
  const stationDetails = estimatedMarkInfo?.details || [];
  const hasStationData = reportType === "details_score" && stationDetails.length > 0;
  const maxTotal = stationDetails.reduce((sum: number, sd: any) => sum + parseFloat(String(sd.male_marks || 0)), 0);

  const practiceCount: number = reportType === "practices"
    ? (estimatedMarkInfo?.practice_count || (threeKmModule as any)?.practice_count || 0)
    : 0;
  const convPracticeWeight = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.convert_of_practice || 0) : (threeKmModule ? parseFloat(threeKmModule.convert_of_practice || 0) : 0);
  const convExamWeight = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.convert_of_exam || 0) : (threeKmModule ? parseFloat(threeKmModule.convert_of_exam || 0) : 0);
  const maxTestMark = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.estimated_mark_per_instructor || estimatedMarkInfo.mark || 0) : 0;
  const conversationMark = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.conversation_mark || 0) : 0;
  const convLimit = conversationMark;
  const hasPrac = practiceCount > 0;
  const reportTypeLabel = reportType === "direct_marks" ? "Direct Marks" : reportType === "practices" ? "Practices" : "Details Score Wise";

  // Compute cadet rows for all report types
  const cadetRows = (result.achieved_marks ?? []).map((mark: any, index: number) => {
    if (reportType === "practices") {
      const practices: number[] = [];
      if (mark.details) {
        mark.details.forEach((d: any) => {
          if (d.practices_marks !== null && d.practices_marks !== undefined) {
            practices.push(parseFloat(String(d.practices_marks)));
          }
        });
      }
      const avg_practice = practices.length > 0 ? practices.reduce((a: number, b: number) => a + b, 0) / practices.length : 0;
      const test_mark = parseFloat(String(mark.achieved_mark || 0));
      const conv_practice = (avg_practice * convPracticeWeight) / 100;
      const conv_exam = (test_mark * convExamWeight) / 100;
      let finalMark = conv_practice + conv_exam;
      if (conversationMark > 0 && finalMark > conversationMark) finalMark = conversationMark;
      const convMark = maxTestMark > 0 ? (finalMark * conversationMark) / maxTestMark : 0;
      return { mark, index, practices, avg_practice, test_mark, conv_practice, conv_exam, finalMark, convMark, stationData: null, totalMks: 0 };
    } else if (reportType === "details_score") {
      const stationData: any = {};
      let totalMks = 0;
      if (mark.details) {
        mark.details.forEach((d: any) => {
          const detailId = d.ctw_results_module_estimated_marks_details_id;
          if (detailId) {
            stationData[detailId] = { qty: d.qty, achieved_time: d.achieved_time, marks: parseFloat(String(d.marks || 0)) };
            totalMks += parseFloat(String(d.marks || 0));
          }
        });
      }
      const conv = maxTotal > 0 && convLimit > 0 ? (totalMks / maxTotal) * convLimit : totalMks;
      return { mark, index, practices: [], avg_practice: 0, test_mark: parseFloat(String(mark.achieved_mark || 0)), conv_practice: 0, conv_exam: 0, finalMark: conv, convMark: conv, stationData, totalMks };
    } else {
      const markVal = parseFloat(String(mark.achieved_mark ?? mark.mark ?? 0));
      const conv = maxTestMark > 0 && conversationMark > 0 ? (markVal / maxTestMark) * conversationMark : markVal;
      return { mark, index, practices: [], avg_practice: 0, test_mark: markVal, conv_practice: 0, conv_exam: 0, finalMark: markVal, convMark: conv, stationData: null, totalMks: markVal };
    }
  });

  // Rank
  const sorted = [...cadetRows].sort((a, b) => b.convMark - a.convMark);
  sorted.forEach((item, idx) => {
    if (idx === 0) (item as any).position = 1;
    else if (item.convMark === sorted[idx - 1].convMark) (item as any).position = (sorted[idx - 1] as any).position;
    else (item as any).position = idx + 1;
    (item as any).remark = item.convMark < conversationMark * 0.5 ? "Failed" : "-";
  });

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      <style jsx global>{`
        @media print {
          @page { size: A3 landscape; margin: 15mm 15mm 20mm 15mm; }
          .cv-content { width: 100% !important; max-width: none !important; }
          table { font-size: 12px !important; border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid black !important; padding: 4px !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-4 flex items-center justify-between no-print">
        <button onClick={() => router.push("/ctw/results/pf/3km")} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />Back to List
        </button>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
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
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
            CTW 3KM Result Sheet ({reportTypeLabel})
          </p>
        </div>

        {/* === DIRECT MARKS TABLE === */}
        {reportType === "direct_marks" && result.achieved_marks && result.achieved_marks.length > 0 && (
          <div className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    {canApproveAction && <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={2}><input type="checkbox" checked={pendingCadetIds.length > 0 && pendingCadetIds.every((id: number) => selectedCadetIds.includes(id))} onChange={toggleSelectAll} className="w-4 h-4" /></th>}
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>SL</th>
                    <th className="border border-black px-2 py-2 text-center align-middle whitespace-nowrap" rowSpan={2}>BD No.</th>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>Rank</th>
                    <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={2}>Name</th>
                    <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={2}>Branch</th>
                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>Mark {maxTestMark > 0 ? `(${maxTestMark})` : ""}</th>
                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>Conv {conversationMark > 0 ? `(${conversationMark})` : ""}</th>
                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>Position</th>
                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>Remarks</th>
                    {canApprove && <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={2}>Approval</th>}
                    {canApproveAction && !isForwarded && <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={2}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {cadetRows.map(({ mark, index, convMark, test_mark }) => {
                    const pos = (cadetRows as any).find((r: any) => r.mark.id === mark.id);
                    return (
                      <tr key={mark.id}>
                        {canApproveAction && <td className="border border-black px-2 py-2 text-center no-print">{getCadetApprovalStatus(mark.cadet_id) === "pending" ? <input type="checkbox" checked={selectedCadetIds.includes(mark.cadet_id)} onChange={() => toggleCadet(mark.cadet_id)} className="w-4 h-4" /> : <span className="text-xs text-gray-400">-</span>}</td>}
                        <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                        <td className="border border-black px-2 py-2 text-center">{mark.cadet?.bd_no || mark.cadet?.cadet_number || "N/A"}</td>
                        <td className="border border-black px-2 py-2 text-center">{mark.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank?.short_name || mark.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank?.name || "-"}</td>
                        <td className="border border-black px-2 py-2 font-medium">{mark.cadet?.name || "N/A"}</td>
                        <td className="border border-black px-2 py-2">{mark.cadet?.assigned_branchs?.find((br: any) => br.branch)?.branch?.name || "N/A"}</td>
                        <td className="border border-black px-2 py-2 text-center font-bold">{test_mark.toFixed(2)}</td>
                        <td className="border border-black px-2 py-2 text-center font-bold text-blue-700">{convMark.toFixed(2)}</td>
                        <td className="border border-black px-2 py-2 text-center">{getOrdinal((pos as any)?.position || 0)}</td>
                        <td className={`border border-black px-2 py-2 text-center ${(pos as any)?.remark === "Failed" ? "text-red-600" : "text-gray-400"}`}>{(pos as any)?.remark || "-"}</td>
                        {canApprove && <td className="border border-black px-2 py-2 text-center no-print">
                          {getCadetApprovalStatus(mark.cadet_id) === "approved" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"><Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3" />Approved</span>}
                          {getCadetApprovalStatus(mark.cadet_id) === "rejected" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"><Icon icon="hugeicons:cancel-circle-02" className="w-3 h-3" />Rejected</span>}
                          {getCadetApprovalStatus(mark.cadet_id) === "pending" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700"><Icon icon="hugeicons:clock-01" className="w-3 h-3" />Pending</span>}
                        </td>}
                        {canApproveAction && !isForwarded && (
                          <td className="border border-black px-2 py-2 text-center no-print">
                            {getCadetApprovalStatus(mark.cadet_id) === "pending" ? (
                              <button onClick={() => setApprovalModal({ open: true, cadetIds: [mark.cadet_id], status: "approved", rejectedReason: "", loading: false, error: "" })}
                                className="px-2 py-1 text-[10px] font-semibold bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                            ) : getCadetApprovalStatus(mark.cadet_id) === "approved" ? (
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

        {/* === PRACTICES TABLE === */}
        {reportType === "practices" && result.achieved_marks && result.achieved_marks.length > 0 && (
          <div className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    {canApproveAction && <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={hasPrac ? 2 : 1}><input type="checkbox" checked={pendingCadetIds.length > 0 && pendingCadetIds.every((id: number) => selectedCadetIds.includes(id))} onChange={toggleSelectAll} className="w-4 h-4" /></th>}
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={hasPrac ? 2 : 1}>SL</th>
                    <th className="border border-black px-2 py-2 text-center align-middle whitespace-nowrap" rowSpan={hasPrac ? 2 : 1}>BD No.</th>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={hasPrac ? 2 : 1}>Rank</th>
                    <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={hasPrac ? 2 : 1}>Name</th>
                    <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={hasPrac ? 2 : 1}>Branch</th>
                    {hasPrac && <th className="border border-black px-2 py-1 text-center align-middle font-semibold" colSpan={practiceCount}>Practices</th>}
                    <th className="border border-black px-2 py-1 text-center align-middle whitespace-nowrap text-xs font-semibold" rowSpan={hasPrac ? 2 : 1}>Avg.<br />Prac</th>
                    <th className="border border-black px-2 py-1 text-center align-middle whitespace-nowrap text-xs font-semibold" rowSpan={hasPrac ? 2 : 1}>Exam</th>
                    <th className="border border-black px-2 py-1 text-center align-middle whitespace-nowrap text-xs font-semibold" rowSpan={hasPrac ? 2 : 1}>Prac<br />({convPracticeWeight}%)</th>
                    <th className="border border-black px-2 py-1 text-center align-middle whitespace-nowrap text-xs font-semibold" rowSpan={hasPrac ? 2 : 1}>Exam<br />({convExamWeight}%)</th>
                    <th className="border border-black px-2 py-1 text-center align-middle text-xs font-semibold" rowSpan={hasPrac ? 2 : 1}>Total</th>
                    <th className="border border-black px-2 py-1 text-center align-middle whitespace-nowrap text-xs font-semibold" rowSpan={hasPrac ? 2 : 1}>Conv<br />({conversationMark})</th>
                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={hasPrac ? 2 : 1}>Position</th>
                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={hasPrac ? 2 : 1}>Remarks</th>
                    {canApprove && <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={hasPrac ? 2 : 1}>Approval</th>}
                    {canApproveAction && !isForwarded && <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={hasPrac ? 2 : 1}>Action</th>}
                  </tr>
                  {hasPrac && <tr>{Array.from({ length: practiceCount }, (_, i) => (<th key={i} className="border border-black px-1 py-1 text-center align-middle text-xs font-normal">P{i + 1}</th>))}</tr>}
                </thead>
                <tbody>
                  {cadetRows.map(({ mark, index, practices, avg_practice, test_mark, conv_practice, conv_exam, finalMark, convMark }) => {
                    const pos = (cadetRows as any).find((r: any) => r.mark.id === mark.id);
                    return (
                      <tr key={mark.id}>
                        {canApproveAction && <td className="border border-black px-2 py-2 text-center no-print">{getCadetApprovalStatus(mark.cadet_id) === "pending" ? <input type="checkbox" checked={selectedCadetIds.includes(mark.cadet_id)} onChange={() => toggleCadet(mark.cadet_id)} className="w-4 h-4" /> : <span className="text-xs text-gray-400">-</span>}</td>}
                        <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                        <td className="border border-black px-2 py-2 text-center">{mark.cadet?.bd_no || mark.cadet?.cadet_number || "N/A"}</td>
                        <td className="border border-black px-2 py-2 text-center">{mark.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank?.short_name || mark.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank?.name || "-"}</td>
                        <td className="border border-black px-2 py-2 font-medium">{mark.cadet?.name || "N/A"}</td>
                        <td className="border border-black px-2 py-2">{mark.cadet?.assigned_branchs?.find((br: any) => br.branch)?.branch?.name || "N/A"}</td>
                        {hasPrac && Array.from({ length: practiceCount }, (_, i) => (<td key={i} className="border border-black px-2 py-2 text-center">{practices[i] !== undefined ? practices[i].toFixed(2) : "-"}</td>))}
                        <td className="border border-black px-2 py-2 text-center">{avg_practice.toFixed(2)}</td>
                        <td className="border border-black px-2 py-2 text-center">{test_mark.toFixed(2)}</td>
                        <td className="border border-black px-2 py-2 text-center font-semibold">{conv_practice.toFixed(2)}</td>
                        <td className="border border-black px-2 py-2 text-center font-semibold">{conv_exam.toFixed(2)}</td>
                        <td className="border border-black px-2 py-2 text-center font-bold">{finalMark.toFixed(2)}</td>
                        <td className="border border-black px-2 py-2 text-center font-bold text-blue-700">{convMark.toFixed(2)}</td>
                        <td className="border border-black px-2 py-2 text-center">{getOrdinal((pos as any)?.position || 0)}</td>
                        <td className={`border border-black px-2 py-2 text-center ${(pos as any)?.remark === "Failed" ? "text-red-600 font-semibold" : "text-gray-400"}`}>{(pos as any)?.remark || "-"}</td>
                        {canApprove && <td className="border border-black px-2 py-2 text-center no-print">
                          {getCadetApprovalStatus(mark.cadet_id) === "approved" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"><Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3" />Approved</span>}
                          {getCadetApprovalStatus(mark.cadet_id) === "rejected" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"><Icon icon="hugeicons:cancel-circle-02" className="w-3 h-3" />Rejected</span>}
                          {getCadetApprovalStatus(mark.cadet_id) === "pending" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700"><Icon icon="hugeicons:clock-01" className="w-3 h-3" />Pending</span>}
                        </td>}
                        {canApproveAction && !isForwarded && (
                          <td className="border border-black px-2 py-2 text-center no-print">
                            {getCadetApprovalStatus(mark.cadet_id) === "pending" ? (
                              <button onClick={() => setApprovalModal({ open: true, cadetIds: [mark.cadet_id], status: "approved", rejectedReason: "", loading: false, error: "" })}
                                className="px-2 py-1 text-[10px] font-semibold bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                            ) : getCadetApprovalStatus(mark.cadet_id) === "approved" ? (
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

        {/* === DETAILS SCORE WISE TABLE === */}
        {reportType === "details_score" && result.achieved_marks && result.achieved_marks.length > 0 && (
          <div className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    {canApproveAction && <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={2}><input type="checkbox" checked={pendingCadetIds.length > 0 && pendingCadetIds.every((id: number) => selectedCadetIds.includes(id))} onChange={toggleSelectAll} className="w-4 h-4" /></th>}
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>SL</th>
                    <th className="border border-black px-2 py-2 text-center align-middle whitespace-nowrap" rowSpan={2}>BD No.</th>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>Rank</th>
                    <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={2}>Name</th>
                    <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={2}>Branch</th>
                    {hasStationData && stationDetails.map((sd: any) => (
                      <th key={sd.id} className="border border-black px-1 py-2 text-center align-middle font-bold" colSpan={2}>{sd.name}</th>
                    ))}
                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>Total {maxTotal}</th>
                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>Conv {convLimit ? `(${convLimit})` : ""}</th>
                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>Position</th>
                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>Remarks</th>
                    {canApprove && <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={2}>Approval</th>}
                    {canApproveAction && !isForwarded && <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={2}>Action</th>}
                  </tr>
                  <tr>
                    {hasStationData && stationDetails.map((sd: any) => (
                      <React.Fragment key={sd.id}>
                        <th className="border border-black px-1 py-1 text-center text-xs font-normal">Qty</th>
                        <th className="border border-black px-1 py-1 text-center text-xs font-normal">Mks</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cadetRows.map(({ mark, index, stationData, totalMks, convMark }) => {
                    const pos = (cadetRows as any).find((r: any) => r.mark.id === mark.id);
                    return (
                      <tr key={mark.id}>
                        {canApproveAction && <td className="border border-black px-2 py-2 text-center no-print">{getCadetApprovalStatus(mark.cadet_id) === "pending" ? <input type="checkbox" checked={selectedCadetIds.includes(mark.cadet_id)} onChange={() => toggleCadet(mark.cadet_id)} className="w-4 h-4" /> : <span className="text-xs text-gray-400">-</span>}</td>}
                        <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                        <td className="border border-black px-2 py-2 text-center">{mark.cadet?.bd_no || mark.cadet?.cadet_number || "N/A"}</td>
                        <td className="border border-black px-2 py-2 text-center">{mark.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank?.short_name || mark.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank?.name || "-"}</td>
                        <td className="border border-black px-2 py-2 font-medium">{mark.cadet?.name || "N/A"}</td>
                        <td className="border border-black px-2 py-2">{mark.cadet?.assigned_branchs?.find((br: any) => br.branch)?.branch?.name || "N/A"}</td>
                        {hasStationData && stationDetails.map((sd: any) => {
                          const sdData = stationData?.[sd.id] || null;
                          return (
                            <React.Fragment key={sd.id}>
                              <td className="border border-black px-1 py-1 text-center">{sdData?.achieved_time || (sdData?.qty !== null && sdData?.qty !== undefined ? sdData.qty : "-")}</td>
                              <td className="border border-black px-1 py-1 text-center">{sdData?.marks?.toFixed(2) || "0.00"}</td>
                            </React.Fragment>
                          );
                        })}
                        <td className="border border-black px-2 py-2 text-center font-bold">{totalMks.toFixed(2)}</td>
                        <td className="border border-black px-2 py-2 text-center font-bold text-blue-700">{convMark.toFixed(2)}</td>
                        <td className="border border-black px-2 py-2 text-center">{getOrdinal((pos as any)?.position || 0)}</td>
                        <td className={`border border-black px-2 py-2 text-center ${(pos as any)?.remark === "Failed" ? "text-red-600" : "text-gray-400"}`}>{(pos as any)?.remark || "-"}</td>
                        {canApprove && <td className="border border-black px-2 py-2 text-center no-print">
                          {getCadetApprovalStatus(mark.cadet_id) === "approved" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"><Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3" />Approved</span>}
                          {getCadetApprovalStatus(mark.cadet_id) === "rejected" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"><Icon icon="hugeicons:cancel-circle-02" className="w-3 h-3" />Rejected</span>}
                          {getCadetApprovalStatus(mark.cadet_id) === "pending" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700"><Icon icon="hugeicons:clock-01" className="w-3 h-3" />Pending</span>}
                        </td>}
                        {canApproveAction && !isForwarded && (
                          <td className="border border-black px-2 py-2 text-center no-print">
                            {getCadetApprovalStatus(mark.cadet_id) === "pending" ? (
                              <button onClick={() => setApprovalModal({ open: true, cadetIds: [mark.cadet_id], status: "approved", rejectedReason: "", loading: false, error: "" })}
                                className="px-2 py-1 text-[10px] font-semibold bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                            ) : getCadetApprovalStatus(mark.cadet_id) === "approved" ? (
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
            <p className="text-sm font-medium text-gray-700 uppercase">CTW 3KM</p>
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
              {([["Course", result.course?.name], ["Semester", result.semester?.name], ["Module", threeKmModule?.full_name], ["Exam Type", result.exam_type?.name]] as [string, string | undefined][]).map(([label, value]) => (
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
          <div className="flex items-center gap-1 mb-4">
            <div className="flex items-center justify-center w-12 h-12"><img src="/images/logo/logo.png" alt="BAFA Logo" width={50} height={50} className="dark:hidden" /></div>
            <div><h2 className="text-lg font-bold text-gray-900">Module Approval</h2><p className="text-xs text-gray-500">Approve module result at your authority level</p></div>
          </div>
          {result && (
            <div className="mb-5 rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
              {([["Course", result.course?.name], ["Semester", result.semester?.name], ["Module", threeKmModule?.full_name], ["Exam Type", result.exam_type?.name]] as [string, string | undefined][]).map(([label, value]) => (
                <div key={label} className="flex px-4 py-2.5"><span className="w-28 text-gray-500 shrink-0">{label}</span><span className="font-medium text-gray-900">{value || "\u2014"}</span></div>
              ))}
            </div>
          )}
          {myAuthority && (
            <div className="flex justify-between items-center gap-2 mb-5">
              <div><h3 className="text-sm font-semibold text-gray-900">Your Level</h3><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium text-xs">{(myAuthority as any).role?.name}</span></div>
              <Icon icon="hugeicons:arrow-right-02" className="w-5 h-5 text-blue-600 shrink-0" />
              <div><h3 className="text-sm font-semibold text-gray-900">Next Level</h3><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium text-xs">{getNextAuthority()?.role?.name || "\u2014"}</span></div>
            </div>
          )}
          <p className="text-sm text-gray-600 mb-5">This will approve the module result at your authority level and forward it to the next authority.</p>
          {moduleApprovalModal.error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2"><Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />{moduleApprovalModal.error}</div>}
          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
            <button onClick={() => setModuleApprovalModal({ open: false, status: "approved", rejectedReason: "", loading: false, error: "" })} disabled={moduleApprovalModal.loading} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={() => setModuleApprovalModal(prev => ({ ...prev, open: false }))} className={`px-6 py-2 rounded-lg text-white text-sm font-medium ${moduleApprovalModal.status === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>Confirm</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
