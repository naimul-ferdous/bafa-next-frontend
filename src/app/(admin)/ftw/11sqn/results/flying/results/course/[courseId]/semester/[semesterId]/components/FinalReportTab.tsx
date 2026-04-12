"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { Ftw11sqnFlyingExaminationMark } from "@/libs/types/ftw11sqnExamination";
import type { ApprovalProcess, CadetApprovalStatus } from "@/libs/types/approval";
import {
  canApproveThisCadet,
  isAlreadyApprovedByMe,
  getCadetApprovalStatusList,
} from "@/libs/utils/approvalHelpers";

interface SemesterData {
  semester_details: {
    id: number;
    name: string;
    code: string | null;
    total_examinations: number;
    total_cadets: number;
  };
  course_details: {
    id: number;
    name: string;
    code: string | null;
  };
  cadets: CadetData[];
}

interface CadetData {
  cadet_details: {
    id: number;
    name: string;
    bdno: string;
    rank?: { id: number; name: string };
    course_id: number;
    semester_id: number;
    total_examinations: number;
    average_mark: number;
  };
  marks: Ftw11sqnFlyingExaminationMark[];
}

interface UserProfile {
  id: number;
  name?: string;
  role_id?: number;
  role?: { id: number; name: string };
}

interface FinalReportTabProps {
  reportData?: {
    is_6th_semester: boolean;
    exam_phases: any[];
    final: any[];
  } | null;
  semesterId: number;
  courseId: number;
  selectedCadets?: number[];
  onSelectCadet?: (cadetId: number) => void;
  onSelectAll?: (selected: boolean) => void;
  cadetApprovalStatuses?: CadetApprovalStatus[];
  approvalProcesses?: ApprovalProcess[];
  profile?: UserProfile | null;
  is6thSemester?: boolean;
}

const FinalReportTab: React.FC<FinalReportTabProps> = ({
  reportData,
  semesterId,
  courseId,
  selectedCadets = [],
  onSelectCadet,
  onSelectAll,
  cadetApprovalStatuses = [],
  approvalProcesses = [],
  profile,
  is6thSemester = false,
}) => {
  const router = useRouter();

  // Extract data from reportData
  const finalData = reportData?.final || [];
  const examPhasesFromBackend = reportData?.exam_phases || [];
  const isBackendData = finalData.length > 0;

  // Get all unique exam phases for header - use backend data
  const allExamPhases = isBackendData ? examPhasesFromBackend : [];

  // Calculate totals for each cadet using backend data
  const cadetsWithTotals = finalData.map((cadet: any, index: number) => ({
    cadet: cadet,
    cadetData: { cadet_details: { id: cadet.cadet_id, name: cadet.name, bdno: cadet.bd_no || '', rank: { name: cadet.rank } } },
    index,
    dailyAvg: cadet.daily_avg || 0,
    totalValue: cadet.total || 0,
    inPercentage: cadet.in_percentage || 0,
    position: cadet.position || index + 1
  }));

  // Create position map from backend
  const positionMap: { [key: number]: number } = {};
  cadetsWithTotals.forEach((item) => {
    positionMap[item.index] = item.position;
  });

  // Check if all cadets are selected
  const areAllCadetsSelected = cadetsWithTotals.length > 0 &&
    cadetsWithTotals.every(c => selectedCadets.includes(c.cadetData.cadet_details.id));

  // Check if a cadet is selected
  const isCadetSelected = (cadetId: number) => selectedCadets.includes(cadetId);

  // Check if cadet can be approved
  const canApprove = (cadetId: number) => {
    return canApproveThisCadet(
      cadetId,
      cadetApprovalStatuses,
      approvalProcesses,
      courseId,
      semesterId,
      profile?.role_id
    );
  };

  // Check if cadet is already approved by current user
  const isApprovedByMe = (cadetId: number) => {
    return isAlreadyApprovedByMe(
      cadetId,
      cadetApprovalStatuses,
      approvalProcesses,
      courseId,
      semesterId,
      profile?.id,
      profile?.role_id
    );
  };

  // Render approval status cell using approvalHelpers - Full detail view matching Vue.js
  const renderApprovalStatus = (cadetId: number) => {
    const statusList = getCadetApprovalStatusList(
      cadetId,
      cadetApprovalStatuses,
      approvalProcesses,
      courseId,
      semesterId,
      profile?.id
    );

    if (statusList.length === 0) {
      return (
        <div className="flex gap-2 items-center text-gray-400">
          <Icon icon="solar:clock-circle-linear" className="w-4 h-4" />
          <span className="text-xs">No approvals yet</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {statusList.map((status, idx) => (
          <div key={idx} className="pb-2 border-b border-gray-200 last:border-0">
            <div className="flex gap-2 items-start">
              <Icon icon={status.icon} className={`w-4 h-4 min-w-4 min-h-4 ${status.color} mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold ${status.color}`}>
                    {status.roleName}:
                  </span>
                  <span className={`text-xs ${status.color}`}>
                    {status.text}
                  </span>
                  {status.isResubmission && (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                      Re-sub
                    </span>
                  )}
                  {status.isCurrentStage && (
                    <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded font-semibold">
                      Current Stage
                    </span>
                  )}
                </div>
                {!status.isPending && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {status.timestamp}
                    {status.nextProgressId && (
                      <span className="ml-2">
                        → {approvalProcesses.find((p) => p.id === status.nextProgressId)?.role?.name || `Level ${status.nextProgressId}`}
                      </span>
                    )}
                  </div>
                )}
                {status.isPending && (
                  <div className="text-xs text-gray-400 mt-0.5 italic">
                    Awaiting approval
                  </div>
                )}
                {status.remark && (
                  <div className="text-xs text-gray-600 mt-1 italic">
                    &quot;{status.remark.replace('REJECTED: ', '').replace('APPROVED: ', '')}&quot;
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getNineScaleGrade = (percentage: number) => {
    if (percentage >= 90)
      return { grade: "9", word: "Exceptional", color: "text-green-700" };
    if (percentage >= 80)
      return { grade: "8", word: "Well above average", color: "text-green-600" };
    if (percentage >= 70)
      return { grade: "7", word: "Above average", color: "text-green-500" };
    if (percentage >= 60)
      return { grade: "6", word: "High Average", color: "text-blue-600" };
    if (percentage >= 50)
      return { grade: "5", word: "Average", color: "text-blue-500" };
    if (percentage >= 40)
      return { grade: "4", word: "Low average", color: "text-yellow-600" };
    if (percentage >= 30)
      return { grade: "3", word: "Below average", color: "text-orange-600" };
    if (percentage >= 20)
      return { grade: "2", word: "Well below average", color: "text-red-600" };
    return { grade: "1", word: "Inferior", color: "text-red-800" };
  };

  return (
    <div className="bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black print:hidden"
              >
                <input
                  type="checkbox"
                  checked={areAllCadetsSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black"
              >
                SL.
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black"
              >
                BD/NO
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black"
              >
                Rank
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black"
              >
                Name
              </th>
              {isBackendData && allExamPhases.map((exam) => (
                <th key={exam.key} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  {exam.phase_fullname || exam.key}
                </th>
              ))}
              {!isBackendData && is6thSemester && (
                <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  MTT
                </th>
              )}
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Daily Avg.
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Total
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black"
              >
                In %
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black"
              >
                Position
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black"
              >
                Sign of Ins
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black"
              >
                Remark
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black print:hidden"
              >
                Approval Status
              </th>
            </tr>
            <tr>
              {isBackendData && allExamPhases.map((exam) => (
                <th key={`weight-${exam.key}`} className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  {Math.round(exam.weight * 100)}
                </th>
              ))}
              {!isBackendData && is6thSemester && (
                <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  150
                </th>
              )}
              <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                400
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                {isBackendData ? 650 : (is6thSemester ? 1200 : 650)}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {cadetsWithTotals.map((cadetItem) => {
              const { index, dailyAvg, totalValue, inPercentage, } = cadetItem;
              const cadet = cadetItem.cadet || cadetItem.cadetData?.cadet_details;
              const cadetData = cadetItem.cadetData || { cadet_details: { id: cadet?.cadet_id || 0, name: cadet?.name || '', bdno: cadet?.bd_no || '', rank: { name: cadet?.rank || 'Officer Cadet' } } };
              const position = positionMap[index];
              const gradeInfo = getNineScaleGrade(inPercentage);

              return (
                <tr
                  key={cadetData.cadet_details.id}
                  className="hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/ftw/11sqn/results/flying/results/course/${courseId}/semester/${semesterId}/cadet/${cadetData.cadet_details.id}`
                    )
                  }
                >
                  <td className="px-2 py-3 text-center text-black border border-black text-sm print:hidden">
                    <input
                      type="checkbox"
                      checked={isCadetSelected(cadetData.cadet_details.id)}
                      onChange={() => onSelectCadet?.(cadetData.cadet_details.id)}
                      disabled={isApprovedByMe(cadetData.cadet_details.id) || !canApprove(cadetData.cadet_details.id)}
                      className="w-4 h-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-3 text-center text-black border border-black text-sm">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-center text-black border border-black text-sm">
                    {cadetData.cadet_details.bdno || cadet.bd_no || ''}
                  </td>
                  <td className="px-4 py-3 text-center text-black border border-black text-sm">
                    {cadetData.cadet_details.rank?.name || cadet.rank || "Officer Cadet"}
                  </td>
                  <td className="px-4 py-3 text-left text-black border border-black text-sm">
                    {cadetData.cadet_details.name || cadet.name || ''}
                  </td>
                  {isBackendData && allExamPhases.map((exam) => (
                    <td key={`mark-${exam.key}`} className="px-4 py-3 text-center text-black border border-black text-sm">
                      {(() => {
                        const backendCadet = finalData.find((f: any) => f.cadet_id === cadetData.cadet_details.id);
                        const mark = backendCadet ? backendCadet[exam.key] : 0;
                        return (mark || 0).toFixed(2);
                      })()}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center border border-black text-sm font-bold">
                    <span
                      className={`${
                          isBackendData 
                            ? (cadet.daily_avg || 0) >= 320
                              ? "text-green-600"
                              : (cadet.daily_avg || 0) >= 240
                                ? "text-yellow-600"
                                : "text-red-600"
                            : dailyAvg >= 320
                                ? "text-green-600"
                                : dailyAvg >= 240
                                  ? "text-yellow-600"
                                  : "text-red-600"
                        }`}
                    >
                      {isBackendData ? (cadet.daily_avg || 0).toFixed(2) : dailyAvg.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center border border-black text-sm font-bold">
                    <span
                      className={`${
                          isBackendData
                            ? (cadet.total || 0) >= 960
                              ? "text-green-600"
                              : (cadet.total || 0) >= 720
                                ? "text-yellow-600"
                                : "text-red-600"
                            : totalValue >= 960
                              ? "text-green-600"
                              : totalValue >= 720
                                ? "text-yellow-600"
                                : "text-red-600"
                        }`}
                    >
                      {isBackendData ? (cadet.total || 0).toFixed(2) : totalValue.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-black border border-black text-sm">
                    {isBackendData ? `${(cadet.in_percentage || 0).toFixed(4)}%` : `${inPercentage.toFixed(4)}%`}
                  </td>
                  <td className="px-4 py-3 text-center text-black border border-black text-sm font-bold">
                    {isBackendData ? cadet.position : position}
                  </td>
                  <td className="px-4 py-3 text-center text-black border border-black text-sm">
                    -
                  </td>
                  <td className="px-4 py-3 text-center text-black border border-black text-sm">
                    -
                  </td>
                  <td className="px-4 py-3 text-left text-black border border-black text-sm print:hidden">
                    {renderApprovalStatus(cadetData.cadet_details.id)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinalReportTab;
