"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { Ftw12sqnFlyingExaminationMark } from "@/libs/types/ftw12sqnExamination";
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
  marks: Ftw12sqnFlyingExaminationMark[];
}

interface UserProfile {
  id: number;
  name?: string;
  role_id?: number;
  role?: { id: number; name: string };
}

interface FinalReportTabProps {
  semesterData: SemesterData;
  semesterId: number;
  courseId: number;
  selectedCadets?: number[];
  onSelectCadet?: (cadetId: number) => void;
  onSelectAll?: (selected: boolean) => void;
  cadetApprovalStatuses?: CadetApprovalStatus[];
  approvalProcesses?: ApprovalProcess[];
  profile?: UserProfile | null;
}

const FinalReportTab: React.FC<FinalReportTabProps> = ({
  semesterData,
  semesterId,
  courseId,
  selectedCadets = [],
  onSelectCadet,
  onSelectAll,
  cadetApprovalStatuses = [],
  approvalProcesses = [],
  profile,
}) => {
  const router = useRouter();

  // Check if a cadet is selected
  const isCadetSelected = (cadetId: number) => selectedCadets.includes(cadetId);

  // Check if all cadets are selected
  const areAllCadetsSelected = semesterData.cadets.length > 0 &&
    semesterData.cadets.every(c => selectedCadets.includes(c.cadet_details.id));

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

  // Get Solo Check mark from marks
  const getSoloCheckMark = (marks: Ftw12sqnFlyingExaminationMark[]) => {
    const soloCheckMark = marks.find(
      (mark) =>
        mark.syllabus?.phase_shortname?.includes("SOLO") ||
        mark.syllabus?.phase_full_name?.includes("SOLO Ck") ||
        mark.exercise?.exercise_name?.includes("SOLO")
    );
    return soloCheckMark ? parseFloat(soloCheckMark.achieved_mark || "0") : 0;
  };

  // Get MTT mark from marks
  const getMttMark = (marks: Ftw12sqnFlyingExaminationMark[]) => {
    const mttMark = marks.find(
      (mark) =>
        mark.syllabus?.phase_shortname === "MTT" ||
        mark.syllabus?.phase_full_name?.includes("Mid Term Test") ||
        mark.syllabus?.phase_full_name?.includes("MTT")
    );
    return mttMark ? parseFloat(mttMark.achieved_mark || "0") : 0;
  };

  // Calculate daily average from marks (excluding MTT and Solo Check)
  const getDailyAvg = (marks: Ftw12sqnFlyingExaminationMark[]) => {
    const dailyMarks = marks.filter(
      (mark) =>
        !mark.syllabus?.phase_shortname?.includes("SOLO") &&
        !mark.syllabus?.phase_full_name?.includes("SOLO Ck") &&
        mark.syllabus?.phase_shortname !== "MTT" &&
        !mark.syllabus?.phase_full_name?.includes("Mid Term Test") &&
        mark.achieved_mark &&
        parseFloat(mark.achieved_mark) > 0
    );

    if (dailyMarks.length === 0) return 0;

    // Group by phase and calculate phase averages
    const phaseGroups: { [key: string]: number[] } = {};
    dailyMarks.forEach((mark) => {
      const phaseKey = mark.syllabus?.phase_shortname || mark.syllabus?.id?.toString() || "unknown";
      if (!phaseGroups[phaseKey]) {
        phaseGroups[phaseKey] = [];
      }
      phaseGroups[phaseKey].push(parseFloat(mark.achieved_mark || "0"));
    });

    // Calculate average of phase averages
    const phaseAverages = Object.values(phaseGroups).map(
      (marks) => marks.reduce((sum, m) => sum + m, 0) / marks.length
    );

    if (phaseAverages.length === 0) return 0;

    const avgOfAvg = phaseAverages.reduce((sum, avg) => sum + avg, 0) / phaseAverages.length;
    return avgOfAvg * 4; // Daily avg multiplied by 4 for 400 marks
  };

  // Calculate totals for each cadet
  const cadetsWithTotals = semesterData.cadets.map((cadetData, index) => {
    const soloCkMark = getSoloCheckMark(cadetData.marks);
    const mttMark = getMttMark(cadetData.marks);
    const mttValue = mttMark * 1.5; // MTT is out of 150
    const dailyAvg = getDailyAvg(cadetData.marks);

    const totalValue = soloCkMark + mttValue + dailyAvg;
    const inPercentage = (totalValue / 650) * 100;

    return { cadetData, index, soloCkMark, mttMark, mttValue, dailyAvg, totalValue, inPercentage };
  });

  // Sort by total value for positions
  const sortedCadets = [...cadetsWithTotals].sort((a, b) => b.totalValue - a.totalValue);
  const positionMap: { [key: number]: number } = {};
  sortedCadets.forEach((item, pos) => {
    positionMap[item.index] = pos + 1;
  });

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
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Solo Ck
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                MTT
              </th>
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
                Grade
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
              <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                100
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                150
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                400
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                650
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {cadetsWithTotals.map(
              ({ cadetData, index, soloCkMark, mttValue, dailyAvg, totalValue, inPercentage }) => {
                const position = positionMap[index];
                const gradeInfo = getNineScaleGrade(inPercentage);

                return (
                  <tr
                    key={cadetData.cadet_details.id}
                    className="hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/ftw/12sqn/results/flying/results/course/${courseId}/semester/${semesterId}/cadet/${cadetData.cadet_details.id}`
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
                      {cadetData.cadet_details.bdno}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {cadetData.cadet_details.rank?.name || "Officer Cadet"}
                    </td>
                    <td className="px-4 py-3 text-left text-black border border-black text-sm">
                      {cadetData.cadet_details.name}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {soloCkMark.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {mttValue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center border border-black text-sm font-bold">
                      <span
                        className={`${
                          dailyAvg >= 320
                            ? "text-green-600"
                            : dailyAvg >= 240
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {dailyAvg.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center border border-black text-sm font-bold">
                      <span
                        className={`${
                          totalValue >= 520
                            ? "text-green-600"
                            : totalValue >= 390
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {totalValue.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {inPercentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm font-bold">
                      {position}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {gradeInfo.word}
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
              }
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinalReportTab;
