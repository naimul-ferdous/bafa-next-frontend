/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwOneMileResultService } from "@/libs/services/ctwOneMileResultService";
import { ctwApprovalService } from "@/libs/services/ctwApprovalService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import { Modal } from "@/components/ui/modal/index";
import type { CadetProfile } from "@/libs/types/user";
import type { CtwResultsModule, CtwResultsModuleEstimatedMark } from "@/libs/types/ctw";
import { getOrdinal } from "@/libs/utils/formatter";

const TWO_KM_5_STATION_MODULE_CODE = "2km_5_station";

function SignatureBox({ auth, signer, approvedAt, position }: {
  auth: any;
  signer: { name: string; rank?: { name: string; short_name: string } | null; signature?: string | null; designation?: string | null } | null;
  approvedAt?: string | null;
  position?: 'first' | 'middle' | 'last';
}) {
  const [imgFailed, setImgFailed] = React.useState(false);

  const dateStr = approvedAt
    ? (() => {
        const d = new Date(approvedAt);
        const day   = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const year  = d.getFullYear();
        return `${day}-${month}-${year}`;
      })()
    : null;

  const label = position === 'first'
    ? 'Prepared & Checked By'
    : position === 'last'
      ? 'Approved By'
      : auth.role?.name ?? auth.user?.name ?? '—';

  const roleName = auth.role?.name ?? auth.user?.name ?? null;

  return (
    <div className="signature-box flex flex-col items-start min-w-[180px]">
      <p className="sig-label text-sm font-bold uppercase text-gray-900 mb-1 tracking-wide">{label}</p>
      <div className="sig-area w-full flex items-end justify-start pb-1 h-16">
        {signer?.signature && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signer.signature}
            alt=""
            className="max-h-14 max-w-[150px] object-contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="text-sm italic text-gray-400">—</span>
        )}
      </div>
      {signer ? (
        <>
          <p className="sig-name text-sm font-bold text-gray-900 uppercase mt-1">{signer.name}</p>
          {signer?.rank?.short_name && (
            <p className="sig-rank text-xs font-semibold text-orange-500">{signer.rank.short_name}</p>
          )}
          {signer?.designation && (
            <p className="sig-designation text-xs text-gray-700">{signer.designation}</p>
          )}
          {dateStr && (
            <p className="sig-date text-xs text-gray-500 pt-0.5 border-t border-gray-800 mt-1">{dateStr}</p>
          )}
        </>
      ) : (
        roleName && (
          <>
            <p className="text-sm text-gray-700 mt-1">{roleName}</p>
            <p className="text-xs text-gray-400 pt-0.5 border-t border-gray-800 mt-1 w-full">Date: ___________</p>
          </>
        )
      )}
    </div>
  );
}

export default function TwoKmFiveStationCourseSemesterResultPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const courseId = parseInt(params?.courseId as string);
  const semesterId = parseInt(params?.semesterId as string);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [semesterDetails, setSemesterDetails] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [examType, setExamType] = useState<string>("");
  const [cadets, setCadets] = useState<CadetProfile[]>([]);

  const [moduleDetails, setModuleDetails] = useState<CtwResultsModule | null>(null);
  const [estimatedMark, setEstimatedMark] = useState<CtwResultsModuleEstimatedMark | null>(null);

  // Approval data
  const [approvalAuthorities, setApprovalAuthorities] = useState<any[]>([]);
  const [cadetApprovals, setCadetApprovals] = useState<any[]>([]);
  const [moduleApprovals, setModuleApprovals] = useState<any[]>([]);

  // Approval UI state
  const [selectedCadetIds, setSelectedCadetIds] = useState<number[]>([]);
  const [approvalModal, setApprovalModal] = useState<{
    open: boolean; cadetIds: number[]; status: "approved" | "rejected";
    rejectedReason: string; loading: boolean; error: string;
  }>({ open: false, cadetIds: [], status: "approved", rejectedReason: "", loading: false, error: "" });

  const [forwardModal, setForwardModal] = useState<{
    open: boolean; loading: boolean; error: string;
  }>({ open: false, loading: false, error: "" });

  const [moduleApprovalModal, setModuleApprovalModal] = useState<{
    open: boolean; status: "approved" | "rejected";
    rejectedReason: string; loading: boolean; error: string;
  }>({ open: false, status: "approved", rejectedReason: "", loading: false, error: "" });

  const stationDetails = (estimatedMark as any)?.details || [];

  const loadData = useCallback(async () => {
    if (isNaN(courseId) || isNaN(semesterId)) return;
    try {
      setLoading(true);
      setError("");
      const data = await ctwOneMileResultService.getInitialFetchData({
        module_code: TWO_KM_5_STATION_MODULE_CODE,
        course_id: courseId,
        semester_id: semesterId,
      });
      if (data) {
        setModuleDetails(data.module);
        setEstimatedMark(data.estimated_mark_config);
        setCourseDetails(data.course_details);
        setSemesterDetails(data.semester_details);
        setCadets(data.cadets || []);
        setApprovalAuthorities(data.approval_authorities || []);
        setCadetApprovals(data.cadet_approvals || []);
        setModuleApprovals(data.module_approvals || []);
        if (data.grouped_results && data.grouped_results.length > 0) {
          const resultGroup = data.grouped_results[0];
          setExamType(resultGroup.exam_type);
          setSubmissions(resultGroup.submissions || []);
        } else {
          setError("No results found for this course and semester");
        }
      } else {
        setError("Failed to retrieve initial data");
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("An unexpected error occurred while loading data");
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- Authority / permission logic ---
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

  const allInstructorsSubmitted = (moduleDetails?.instructor_count ?? 0) > 0 && submissions.length >= (moduleDetails?.instructor_count ?? 0);
  const isForwarded = submissions.length > 0 && submissions.every((sub: any) =>
    moduleApprovals.some((ma: any) => Number(ma.ctw_result_id) === Number(sub?.id))
  );

  // Aggregated marks per cadet with station data
  const aggregatedMarks = useMemo(() => {
    const cadetMap = new Map<number, any>();
    const maxTotal = stationDetails.reduce((sum: number, sd: any) => sum + parseFloat(String(sd.male_marks || 0)), 0);
    const convLimit = parseFloat(String(estimatedMark?.conversation_mark || 0));

    cadets.forEach(cadet => {
      cadetMap.set(cadet.id, {
        cadet,
        instructorMarks: {},
        instructorStationData: {},
        totalFinal: 0,
        submissionCount: 0,
      });
    });

    submissions.forEach(sub => {
      const instructorId = sub.instructor_details?.id;
      const marks = sub.instructor_details?.marks || [];
      marks.forEach((markItem: any) => {
        const cadetId = markItem.cadet_id;
        if (!cadetMap.has(cadetId)) return;
        const stationData: any = {};
        let totalMks = 0;
        if (markItem.details) {
          markItem.details.forEach((d: any) => {
            const detailId = d.ctw_results_module_estimated_marks_details_id;
            if (detailId) {
              stationData[detailId] = { qty: d.qty, achieved_time: d.achieved_time, marks: parseFloat(String(d.marks || 0)) };
              totalMks += parseFloat(String(d.marks || 0));
            }
          });
        }
        const conv = maxTotal > 0 && convLimit > 0 ? (totalMks / maxTotal) * convLimit : totalMks;
        const cadetData = cadetMap.get(cadetId);
        cadetData.instructorMarks[instructorId] = conv;
        cadetData.instructorStationData[instructorId] = { stationData, totalMks, conv };
        cadetData.totalFinal += conv;
        cadetData.submissionCount += 1;
      });
    });

    return Array.from(cadetMap.values()).filter(item => item.submissionCount > 0);
  }, [submissions, cadets, estimatedMark, stationDetails]);

  // Rank cadets
  const rankedData = useMemo(() => {
    const convLimit = parseFloat(String(estimatedMark?.conversation_mark || 0));
    const expectedCount = moduleDetails?.instructor_count || 0;
    const isComplete = expectedCount > 0 && submissions.length >= expectedCount;
    const passThreshold = convLimit * 0.5;

    const withConv = aggregatedMarks.map(item => ({
      ...item,
      convertedMark: isComplete && item.submissionCount > 0 ? item.totalFinal / item.submissionCount : 0,
      position: 0, remark: "-",
    }));

    if (isComplete) {
      withConv.sort((a, b) => b.convertedMark - a.convertedMark);
      withConv.forEach((item, idx) => {
        if (idx === 0) item.position = 1;
        else if (item.convertedMark === withConv[idx - 1].convertedMark) item.position = withConv[idx - 1].position;
        else item.position = idx + 1;
        item.remark = item.convertedMark < passThreshold ? "Failed" : "-";
      });
    }

    withConv.sort((a, b) => {
      const aNo = a.cadet?.cadet_number ?? "";
      const bNo = b.cadet?.cadet_number ?? "";
      return String(aNo).localeCompare(String(bNo), undefined, { numeric: true });
    });

    return withConv;
  }, [aggregatedMarks, estimatedMark, submissions, moduleDetails]);

  // All results approved by previous level
  const allResultsApprovedByPreviousLevel = useMemo(() => {
    if (submissions.length === 0 || rankedData.length === 0) return false;
    if (canInitialForward) return true;
    if (!myAuthority) return false;
    const mySort = (myAuthority as any).sort ?? 0;
    const prevAuthorities = approvalAuthorities.filter((a: any) => a.is_active && (a.sort ?? 0) < mySort);
    if (prevAuthorities.length === 0) return true;
    return submissions.every((sub: any) => {
      const resultId = sub?.id;
      if (!resultId) return false;
      return prevAuthorities.every((prevAuth: any) =>
        rankedData.every((item: any) =>
          cadetApprovals.some((a: any) =>
            Number(a.cadet_id) === Number(item.cadet.id) &&
            Number(a.ctw_result_id) === Number(resultId) &&
            Number(a.authority_id) === Number(prevAuth.id) &&
            a.is_active && a.status === "approved"
          )
        )
      );
    });
  }, [submissions, rankedData, cadetApprovals, approvalAuthorities, myAuthority, canInitialForward]);

  const allCadetsApproved = useMemo(() => {
    if (rankedData.length === 0 || !myAuthority) return false;
    const authorityId = (myAuthority as any)?.id;
    return rankedData.every((item: any) => {
      const approval = cadetApprovals.find((a: any) => a.cadet_id === item.cadet.id && a.authority_id === authorityId);
      return approval?.status === "approved";
    });
  }, [rankedData, cadetApprovals, myAuthority]);

  const isMyTurn = canInitialForward ? !isForwarded : ((moduleApprovals?.find((sa: any) => sa.authority_id === (myAuthority as any)?.id))?.status === "pending");
  const canApproveAction = canApprove && isMyTurn && allResultsApprovedByPreviousLevel;

  const allCadetsApprovedByMe = useMemo(() => {
    if (!myAuthority) return false;
    if (rankedData.length === 0) return false;
    return rankedData.every((item: any) => {
      const a = cadetApprovals.find((ap: any) => ap.cadet_id === item.cadet.id && ap.authority_id === (myAuthority as any).id);
      return a?.status === "approved";
    });
  }, [rankedData, cadetApprovals, myAuthority]);

  const myModuleApproval = myAuthority
    ? moduleApprovals?.find((sa: any) => sa.authority_id === (myAuthority as any).id)
    : null;
  const isModuleApproved = myModuleApproval?.status === "approved";
  const canApproveModule = canApprove && isMyTurn && allCadetsApprovedByMe && !isModuleApproved && !canInitialForward && allInstructorsSubmitted;
  const showForwardButton = canInitialForward && !isForwarded && allCadetsApproved && allInstructorsSubmitted;

  const getNextAuthority = useCallback(() => {
    const sorted = [...approvalAuthorities].filter((a: any) => a.is_active).sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
    if (!myAuthority) return sorted.find((a: any) => !a.is_initial_cadet_approve) ?? null;
    return sorted.find((a: any) => (a.sort ?? 0) > ((myAuthority as any).sort ?? 0)) ?? null;
  }, [approvalAuthorities, myAuthority]);

  const getCadetApprovalStatus = useCallback((cadetId: number) => {
    const authorityId = (myAuthority as any)?.id;
    if (!authorityId) return "pending";
    const approval = cadetApprovals.find((a: any) =>
      Number(a.cadet_id) === Number(cadetId) && Number(a.authority_id) === Number(authorityId) && a.is_active
    );
    return approval?.status ?? "pending";
  }, [cadetApprovals, myAuthority]);

  const pendingCadetIds = useMemo(() => {
    return rankedData.filter((item: any) => {
      if (!myAuthority) return false;
      const approval = cadetApprovals.find((a: any) =>
        Number(a.cadet_id) === Number(item.cadet.id) && Number(a.authority_id) === Number((myAuthority as any).id) && a.is_active
      );
      return !approval || approval.status === "pending";
    }).map((item: any) => item.cadet.id);
  }, [rankedData, cadetApprovals, myAuthority]);

  const allPendingSelected = pendingCadetIds.length > 0 && pendingCadetIds.every((id: number) => selectedCadetIds.includes(id));

  const toggleCadet = (cadetId: number) => {
    setSelectedCadetIds(prev => prev.includes(cadetId) ? prev.filter(id => id !== cadetId) : [...prev, cadetId]);
  };

  const toggleSelectAll = () => {
    setSelectedCadetIds(allPendingSelected ? [] : pendingCadetIds);
  };

  // --- Actions ---
  const confirmApproval = async () => {
    if (!moduleDetails) return;
    if (approvalModal.status === "rejected" && !approvalModal.rejectedReason.trim()) {
      setApprovalModal(prev => ({ ...prev, error: "Rejection reason is required." }));
      return;
    }
    setApprovalModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      for (const sub of submissions) {
        await ctwApprovalService.approveCadets({
          course_id: courseId, semester_id: semesterId, module_id: moduleDetails.id,
          ctw_result_id: sub?.id, cadet_ids: approvalModal.cadetIds,
          authority_id: (myAuthority as any)?.id ?? null,
          status: approvalModal.status,
          rejected_reason: approvalModal.status === "rejected" ? approvalModal.rejectedReason : undefined,
        });
      }
      setApprovalModal({ open: false, cadetIds: [], status: "approved", rejectedReason: "", loading: false, error: "" });
      setSelectedCadetIds([]);
      await loadData();
    } catch (err: any) {
      const msg = err?.errors ? Object.values(err.errors).flat().join(" ") : err?.message || "Failed to update approval status.";
      setApprovalModal(prev => ({ ...prev, loading: false, error: msg }));
    }
  };

  const confirmForward = async () => {
    if (!moduleDetails) return;
    setForwardModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      const nextAuth = getNextAuthority();
      for (const sub of submissions) {
        await ctwApprovalService.forwardModule({
          course_id: courseId, semester_id: semesterId, module_id: moduleDetails.id,
          ctw_result_id: sub?.id, authority_ids: nextAuth ? [nextAuth.id] : [],
        });
      }
      setForwardModal({ open: false, loading: false, error: "" });
      await loadData();
    } catch (err: any) {
      setForwardModal(prev => ({ ...prev, loading: false, error: err?.message || "Failed to forward result." }));
    }
  };

  const confirmModuleApproval = async () => {
    if (!moduleDetails) return;
    setModuleApprovalModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      const nextAuthority = getNextAuthority();
      for (const sub of submissions) {
        await ctwApprovalService.approveModule({
          course_id: courseId, semester_id: semesterId, module_id: moduleDetails.id,
          ctw_result_id: sub?.id, status: moduleApprovalModal.status,
          rejected_reason: moduleApprovalModal.status === "rejected" ? moduleApprovalModal.rejectedReason : undefined,
          cadet_ids: rankedData.map((item: any) => item.cadet.id),
          authority_id: (myAuthority as any)?.id ?? null,
          authority_ids: nextAuthority ? [nextAuthority.id] : [],
        });
      }
      setModuleApprovalModal(prev => ({ ...prev, open: false, loading: false }));
      await loadData();
    } catch (err: any) {
      setModuleApprovalModal(prev => ({ ...prev, loading: false, error: err?.message || "Failed to update module approval." }));
    }
  };

  const handlePrint = () => window.print();

  // Get station data for a cadet from a specific instructor submission
  const getStationDataForCadet = (item: any, instructorId: number, stationId: number) => {
    const instData = item.instructorStationData?.[instructorId];
    return instData?.stationData?.[stationId] || null;
  };

  const hasStationData = stationDetails.length > 0;

  // Determine per-station whether it records time or qty, based on actual submission data
  const stationIsTimeBased = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const sub of submissions) {
      for (const markItem of (sub.instructor_details?.marks || [])) {
        for (const d of (markItem.details || [])) {
          const stationId = d.ctw_results_module_estimated_marks_details_id;
          if (stationId === undefined) continue;
          if (d.achieved_time !== null && d.achieved_time !== undefined) {
            map.set(stationId, true);
          } else if (!map.has(stationId)) {
            map.set(stationId, false);
          }
        }
      }
    }
    return map;
  }, [submissions]);

  const maxTotal = stationDetails.reduce((sum: number, sd: any) => sum + parseFloat(String(sd.male_marks || 0)), 0);
  const convLimit = parseFloat(String(estimatedMark?.conversation_mark || 0));
  const instructorCount = moduleDetails?.instructor_count || 0;
  const isComplete = instructorCount > 0 && submissions.length >= instructorCount;
  // const instructorSlots = Array.from({ length: instructorCount }, (_, i) => i);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || rankedData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-medium">{error || "Results not found"}</p>
          <button onClick={() => router.push("/ctw/results/pf/2km5station")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold">
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
          @page { size: A3 landscape; margin: 15mm 15mm 20mm 15mm; }
          .cv-content { width: 100% !important; max-width: none !important; }
          table { font-size: 12px !important; border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid black !important; padding: 4px !important; }
          .no-print { display: none !important; }
          .signature-section {
            margin-top: 40px !important; padding-top: 20px !important;
            display: flex !important; justify-content: space-between !important; gap: 40px !important;
            padding-left: 8px !important; padding-right: 8px !important;
            page-break-inside: avoid !important;
          }
          .signature-box {
            min-width: 180px !important; display: flex !important; flex-direction: column !important; align-items: flex-start !important;
          }
          .signature-box .sig-label {
            font-size: 10px !important; font-weight: 700 !important; color: #b91c1c !important;
            text-transform: uppercase !important; letter-spacing: 0.05em !important; margin-bottom: 4px !important;
          }
          .signature-box .sig-area {
            height: 60px !important; display: flex !important; align-items: flex-end !important; padding-bottom: 4px !important; margin-bottom: 4px !important;
          }
          .signature-box .sig-name {
            font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase !important; color: #111827 !important; margin-top: 2px !important;
          }
          .signature-box .sig-rank {
            font-size: 11px !important; font-weight: 600 !important; color: #f97316 !important;
          }
          .signature-box .sig-designation {
            font-size: 10px !important; color: #374151 !important;
          }
          .signature-box .sig-date {
            font-size: 10px !important; color: #6b7280 !important; padding-top: 3px !important;
            border-top: 1px solid #1f2937 !important; margin-top: 4px !important;
          }
        }
      `}</style>

      {/* Action Buttons */}
      <div className="p-4 flex items-center justify-between no-print">
        <button onClick={() => router.push("/ctw/results/pf/2km5station")} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />Back to List
        </button>
        <div className="flex items-center gap-3">
          {canApproveAction && selectedCadetIds.length > 0 && allInstructorsSubmitted && (
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
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />Already Forwarded
            </span>
          )}
          {isModuleApproved && !canInitialForward && canApprove && (
            <span className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-green-50 text-green-700 border border-green-200">
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />Module Approved
            </span>
          )}
          {canApproveModule && (
            <button onClick={() => setModuleApprovalModal({ open: true, status: "approved", rejectedReason: "", loading: false, error: "" })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium">
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />Approve Module
            </button>
          )}
          {!allInstructorsSubmitted && canApprove && (
            <span className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4" />
              Awaiting {instructorCount - submissions.length} instructor{instructorCount - submissions.length > 1 ? "s" : ""}
            </span>
          )}
          <button onClick={handlePrint} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all">
            <Icon icon="hugeicons:printer" className="w-4 h-4" />Print
          </button>
        </div>
      </div>

      <div className="p-8 cv-content">
        <div className="mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <div className="mb-2">
            <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">Cadet Training Wing</p>
            <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">
              {courseDetails?.name} ({moduleDetails?.full_name || "2KM 5 Station"})
            </p>
            <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">
              {semesterDetails?.name}{examType ? ` | ${examType}` : ""}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr>
                  {canApproveAction && pendingCadetIds.length > 0 && allInstructorsSubmitted && (
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle no-print">
                      <input type="checkbox" checked={allPendingSelected} onChange={toggleSelectAll} className="w-4 h-4" />
                    </th>
                  )}
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Ser</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">BD/No</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Rank</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle">Name</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle">Branch</th>
                  {hasStationData && stationDetails.map((sd: any) => (
                    <th key={sd.id} className="border border-black px-1 py-2 text-center align-middle font-bold" colSpan={2}>{sd.name}</th>
                  ))}
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold">Total {maxTotal}</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold">Conv {convLimit ? `(${convLimit})` : ""}</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold">Position</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold">Remarks</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle no-print">Status</th>
                  {canApproveAction && !isForwarded && (
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle no-print">Action</th>
                  )}
                </tr>
                <tr>
                  {hasStationData && stationDetails.map((sd: any) => (
                    <React.Fragment key={sd.id}>
                      <th className="border border-black px-1 py-1 text-center text-xs font-normal">
                        {stationIsTimeBased.get(sd.id) ? "Time" : "Qty"}
                      </th>
                      <th className="border border-black px-1 py-1 text-center text-xs font-normal">Mks</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rankedData.map((item: any, index: number) => {
                  const status = getCadetApprovalStatus(item.cadet.id);
                  const isPending = status === "pending";
                  return (
                    <tr key={item.cadet.id} className="hover:bg-gray-50 transition-colors">
                      {canApproveAction && pendingCadetIds.length > 0 && allInstructorsSubmitted && (
                        <td className="border border-black px-2 py-2 text-center no-print">
                          {isPending ? (
                            <input type="checkbox" checked={selectedCadetIds.includes(item.cadet.id)} onChange={() => toggleCadet(item.cadet.id)} className="w-4 h-4" />
                          ) : <span className="text-xs text-gray-400">-</span>}
                        </td>
                      )}
                      <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                      <td className="border border-black px-2 py-2 text-center">{item.cadet?.cadet_number || "N/A"}</td>
                      <td className="border border-black px-2 py-2 text-center">
                        {item.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank?.short_name || "-"}
                      </td>
                      <td className="border border-black px-2 py-2 font-medium">{item.cadet?.name || "N/A"}</td>
                      <td className="border border-black px-2 py-2">
                        {item.cadet?.assigned_branchs?.filter((b: any) => b.is_current)?.[0]?.branch?.name || item.cadet?.assigned_branchs?.[0]?.branch?.name || "-"}
                      </td>
                      {hasStationData && stationDetails.map((sd: any) => {
                        const sub = submissions[0];
                        const instructorId = sub?.instructor_details?.id;
                        const sdData = instructorId !== undefined ? getStationDataForCadet(item, instructorId, sd.id) : null;
                        return (
                          <React.Fragment key={sd.id}>
                            <td className="border border-black px-1 py-1 text-center">
                              {sdData?.achieved_time || (sdData?.qty !== null && sdData?.qty !== undefined ? sdData.qty : "-")}
                            </td>
                            <td className="border border-black px-1 py-1 text-center">{sdData?.marks?.toFixed(2) || "0.00"}</td>
                          </React.Fragment>
                        );
                      })}
                      <td className="border border-black px-2 py-2 text-center font-bold">
                        {isComplete ? item.instructorStationData?.[submissions[0]?.instructor_details?.id]?.totalMks?.toFixed(2) || "0.00" : "-"}
                      </td>
                      <td className="border border-black px-2 py-2 text-center font-bold">
                        {isComplete ? item.convertedMark.toFixed(2) : "-"}
                      </td>
                      <td className="border border-black px-2 py-2 text-center">
                        {isComplete ? getOrdinal(item.position) : "-"}
                      </td>
                      <td className={`border border-black px-2 py-2 text-center ${item.remark === "Failed" ? "text-red-600" : "text-gray-400"}`}>
                        {item.remark}
                      </td>
                      {/* Status */}
                      <td className="border border-black px-2 py-2 no-print">
                        <div className="flex flex-col gap-1.5 min-w-[100px]">
                          {(() => {
                            const sub = submissions[0];
                            const resultId = sub?.id;
                            if (!resultId) return <span className="text-[9px] text-gray-500">No Result</span>;
                            return approvalAuthorities.filter((a: any) => a.is_active).sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0)).map((auth: any) => {
                              const authStatus = (() => {
                                const approval = cadetApprovals.find((a: any) =>
                                  Number(a.cadet_id) === Number(item.cadet.id) &&
                                  Number(a.ctw_result_id) === Number(resultId) &&
                                  Number(a.authority_id) === Number(auth.id) && a.is_active
                                );
                                if (approval?.status === "approved") return "approved";
                                if (approval?.status === "rejected") return "rejected";
                                return "pending";
                              })();
                              const isMe = auth.id === myAuthority?.id;
                              return (
                                <div key={auth.id} className="flex items-center gap-1">
                                  <span className="text-[8px] text-gray-500 flex-1">
                                    {auth.role?.name || `Auth ${auth.sort}`}{isMe && <span className="text-blue-600">(me)</span>}
                                  </span>
                                  {authStatus === "approved" ? (
                                    <span className="inline-flex items-center gap-0.5 text-green-700 text-[8px] font-bold">
                                      <Icon icon="hugeicons:checkmark-circle-02" className="w-2.5 h-2.5" />Approved
                                    </span>
                                  ) : authStatus === "rejected" ? (
                                    <span className="inline-flex items-center gap-0.5 text-red-700 text-[8px] font-bold">
                                      <Icon icon="hugeicons:cancel-circle" className="w-2.5 h-2.5" />Rejected
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-yellow-700 text-[8px] font-bold">
                                      <Icon icon="hugeicons:clock-01" className="w-2.5 h-2.5" />Pending
                                    </span>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </td>
                      {/* Action */}
                      {canApproveAction && !isForwarded && (
                        <td className="border border-black px-2 py-2 text-center no-print">
                          {isPending ? (
                            <button onClick={() => setApprovalModal({ open: true, cadetIds: [item.cadet.id], status: "approved", rejectedReason: "", loading: false, error: "" })}
                              className="px-2 py-1 text-[10px] font-semibold bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                          ) : status === "approved" ? (
                            <button onClick={() => setApprovalModal({ open: true, cadetIds: [item.cadet.id], status: "approved", rejectedReason: "", loading: false, error: "" })}
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

        {/* Signature Section */}
        {(() => {
          const signatureAuthorities = [...approvalAuthorities]
            .filter((a: any) => a.is_signature)
            .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
          if (signatureAuthorities.length === 0) return null;
          const allAuthsSorted = [...approvalAuthorities].sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
          return (
            <div className="signature-section max-w-5xl mx-auto mt-10 flex justify-between gap-10 pr-2">
              {signatureAuthorities.map((auth: any, sigIdx: number) => {
                const sigPosition: 'first' | 'middle' | 'last' =
                  sigIdx === 0 ? 'first'
                  : sigIdx === signatureAuthorities.length - 1 ? 'last'
                  : 'middle';

                const authIdx = allAuthsSorted.findIndex((a: any) => a.id === auth.id);
                const nextAuth = authIdx >= 0 && authIdx < allAuthsSorted.length - 1
                  ? allAuthsSorted[authIdx + 1]
                  : null;

                // Signer = forwarder from next authority's module approval, fallback to own approver
                let rawSigner: any = null;
                if (nextAuth) {
                  const nextApproval = moduleApprovals.find(
                    (ma: any) => ma.authority_id === nextAuth.id && ma.forwarded_by != null
                  );
                  rawSigner = nextApproval?.forwarder ?? null;
                }
                if (!rawSigner) {
                  const ownApproval = moduleApprovals.find(
                    (ma: any) => ma.authority_id === auth.id && ma.approved_by != null
                  );
                  rawSigner = ownApproval?.approver ?? null;
                }

                const ownRecord = moduleApprovals.find((ma: any) => ma.authority_id === auth.id);
                const nextRecord = nextAuth ? moduleApprovals.find((ma: any) => ma.authority_id === nextAuth.id) : null;
                const approvedAt: string | null =
                  ownRecord?.approved_at ?? ownRecord?.updated_at ?? ownRecord?.created_at
                  ?? nextRecord?.created_at ?? null;

                let designation: string | null = null;
                if (rawSigner?.roles) {
                  const primary = rawSigner.roles.find((r: any) => r.pivot?.is_primary);
                  designation = primary?.name ?? rawSigner.roles[0]?.name ?? null;
                }

                const signer = rawSigner ? { ...rawSigner, designation } : null;
                return (
                  <SignatureBox key={auth.id} auth={auth} signer={signer} approvedAt={approvedAt} position={sigPosition} />
                );
              })}
            </div>
          );
        })()}

        <div className="mt-12 text-center text-[10px] text-gray-500 font-medium italic">
          <p>Generated on: {new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      {/* Approval Modal */}
      <Modal isOpen={approvalModal.open} onClose={() => setApprovalModal(prev => ({ ...prev, open: false }))} showCloseButton className="max-w-lg">
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="flex justify-center mb-2"><FullLogo /></div>
            <h1 className="text-lg font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
            <p className="text-sm font-medium text-gray-700 uppercase">CTW 2KM 5 Station</p>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {approvalModal.cadetIds.length === 1 ? "Cadet Approval" : `Cadets Approval (${approvalModal.cadetIds.length} cadets)`}
          </h2>
          {!canInitialForward && (
            <div className="flex gap-3 mb-4 mt-4">
              {(["approved", "rejected"] as const).map(s => (
                <button key={s} onClick={() => setApprovalModal(prev => ({ ...prev, status: s, rejectedReason: "", error: "" }))}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold capitalize transition-colors ${approvalModal.status === s
                      ? s === "approved" ? "bg-green-600 text-white border-green-600" : "bg-red-600 text-white border-red-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}>{s === "approved" ? "Approve" : "Reject"}</button>
              ))}
            </div>
          )}
          {approvalModal.status === "rejected" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection <span className="text-red-500">*</span></label>
              <textarea rows={3} value={approvalModal.rejectedReason}
                onChange={e => setApprovalModal(prev => ({ ...prev, rejectedReason: e.target.value }))}
                placeholder="Enter rejection reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            </div>
          )}
          {approvalModal.error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />{approvalModal.error}
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 mt-2">
            <button onClick={() => setApprovalModal(prev => ({ ...prev, open: false }))} disabled={approvalModal.loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={confirmApproval} disabled={approvalModal.loading}
              className={`px-6 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 ${approvalModal.status === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}>
              {approvalModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              {approvalModal.status === "approved" ? "Confirm Approve" : "Confirm Reject"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Forward Modal */}
      <Modal isOpen={forwardModal.open} onClose={() => setForwardModal(prev => ({ ...prev, open: false }))} showCloseButton className="max-w-lg">
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
          {courseDetails && (
            <div className="mb-5 rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
              {([["Course", courseDetails?.name], ["Semester", semesterDetails?.name], ["Module", moduleDetails?.full_name], ["Exam Type", examType]] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex px-4 py-2.5">
                  <span className="w-28 text-gray-500 shrink-0">{label}</span>
                  <span className="font-medium text-gray-900">{value || "\u2014"}</span>
                </div>
              ))}
            </div>
          )}
          {myAuthority && (
            <div className="flex justify-between items-center gap-2 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Your Level</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium text-xs">{(myAuthority as any).role?.name}</span>
              </div>
              <Icon icon="hugeicons:arrow-right-02" className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Next Level</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium text-xs">{getNextAuthority()?.role?.name || "\u2014"}</span>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-600 mb-5">This will mark the module result as forwarded to the higher authority for further review.</p>
          {forwardModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />{forwardModal.error}
            </div>
          )}
          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
            <button onClick={() => setForwardModal(prev => ({ ...prev, open: false }))} disabled={forwardModal.loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={confirmForward} disabled={forwardModal.loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50">
              {forwardModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              <Icon icon="hugeicons:share-04" className="w-4 h-4" />Confirm Forward
            </button>
          </div>
        </div>
      </Modal>

      {/* Module Approval Modal */}
      <Modal isOpen={moduleApprovalModal.open} onClose={() => setModuleApprovalModal(prev => ({ ...prev, open: false }))} showCloseButton className="max-w-lg">
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
          {courseDetails && (
            <div className="mb-5 rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
              {([["Course", courseDetails?.name], ["Semester", semesterDetails?.name], ["Module", moduleDetails?.full_name], ["Exam Type", examType]] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex px-4 py-2.5">
                  <span className="w-28 text-gray-500 shrink-0">{label}</span>
                  <span className="font-medium text-gray-900">{value || "\u2014"}</span>
                </div>
              ))}
            </div>
          )}
          {myAuthority && (
            <div className="flex justify-between items-center gap-2 mb-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Your Level</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium text-xs">{(myAuthority as any).role?.name}</span>
              </div>
              <Icon icon="hugeicons:arrow-right-02" className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Next Level</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium text-xs">{getNextAuthority()?.role?.name || "\u2014"}</span>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-600 mb-5">This will approve the module result at your authority level and forward it to the next authority.</p>
          {moduleApprovalModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />{moduleApprovalModal.error}
            </div>
          )}
          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
            <button onClick={() => setModuleApprovalModal(prev => ({ ...prev, open: false }))} disabled={moduleApprovalModal.loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={confirmModuleApproval} disabled={moduleApprovalModal.loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50">
              {moduleApprovalModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />Confirm Approval
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
