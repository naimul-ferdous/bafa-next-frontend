"use client";

import React, { useState } from "react";
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

interface BupReportTabProps {
  semesterData: SemesterData;
  semesterId: number;
  courseId: number;
  groundData?: any; // Ground examination data
  selectedCadets?: number[];
  onSelectCadet?: (cadetId: number) => void;
  onSelectAll?: (selected: boolean) => void;
  cadetApprovalStatuses?: CadetApprovalStatus[];
  approvalProcesses?: ApprovalProcess[];
  profile?: UserProfile | null;
}

const BupReportTab: React.FC<BupReportTabProps> = ({
  semesterData,
  semesterId,
  courseId,
  groundData,
  selectedCadets = [],
  onSelectCadet,
  onSelectAll,
  cadetApprovalStatuses = [],
  approvalProcesses = [],
  profile,
}) => {
  const router = useRouter();
  const [activeSubTab, setActiveSubTab] = useState<'bup5th' | 'bup600'>('bup5th');

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

  // Render approval status cell using approvalHelpers
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
          <Icon icon="hugeicons:clock-01" className="w-4 h-4" />
          <span className="text-xs">No submission</span>
        </div>
      );
    }

    const latestStatus = statusList[statusList.length - 1];

    if (latestStatus.isPending) {
      return (
        <div className="text-left space-y-0.5">
          <div className="flex items-center gap-1 text-yellow-600">
            <Icon icon={latestStatus.icon} className="w-4 h-4" />
            <span className="text-xs font-medium">{latestStatus.roleName}: Pending</span>
          </div>
          {latestStatus.isCurrentStage && (
            <div className="text-xs text-gray-500">Awaiting your approval</div>
          )}
        </div>
      );
    }

    return (
      <div className="text-left space-y-0.5">
        <div className={`flex items-center gap-1 ${latestStatus.color}`}>
          <Icon icon={latestStatus.icon} className="w-4 h-4" />
          <span className="text-xs font-medium">{latestStatus.roleName}</span>
        </div>
        <div className="text-xs text-gray-500">{latestStatus.text}</div>
        {latestStatus.timestamp && (
          <div className="text-xs text-gray-400">{latestStatus.timestamp}</div>
        )}
      </div>
    );
  };

  // Get grade based on percentage
  const getGrade = (percentage: number) => {
    if (percentage >= 80) return { grade: "A", color: "text-green-600" };
    if (percentage >= 70) return { grade: "B", color: "text-blue-600" };
    if (percentage >= 60) return { grade: "C", color: "text-yellow-600" };
    if (percentage >= 40) return { grade: "D", color: "text-orange-600" };
    return { grade: "F", color: "text-red-600" };
  };

  // Get MTD mark (from ground data)
  const getMtdMark = (cadetId: number) => {
    if (!groundData?.cadets) return 0;
    const cadetGround = groundData.cadets.find((c: any) => c.cadet_details?.id === cadetId);
    if (!cadetGround) return 0;

    const mtdMark = cadetGround.marks?.find((m: any) =>
      m.phase?.ground_shortname?.includes("MTD") ||
      m.phase?.ground_fullname?.includes("MTD")
    );
    return mtdMark ? parseFloat(mtdMark.exam_mark || "0") * 0.7 : 0; // Scale to 70
  };

  // Get Quiz Test mark (from ground data)
  const getQuizTestMark = (cadetId: number) => {
    if (!groundData?.cadets) return 0;
    const cadetGround = groundData.cadets.find((c: any) => c.cadet_details?.id === cadetId);
    if (!cadetGround) return 0;

    const quizMark = cadetGround.marks?.find((m: any) =>
      m.test?.ground_test_name?.includes("Quiz") ||
      m.phase?.ground_fullname?.includes("Quiz")
    );
    return quizMark ? parseFloat(quizMark.exam_mark || "0") * 0.7 : 0; // Scale to 70
  };

  // Get Sessional mark (from ground data)
  const getSessionalMark = (cadetId: number) => {
    if (!groundData?.cadets) return 0;
    const cadetGround = groundData.cadets.find((c: any) => c.cadet_details?.id === cadetId);
    if (!cadetGround) return 0;

    const sessionalMark = cadetGround.marks?.find((m: any) =>
      m.test?.ground_test_name?.includes("Sessional") ||
      m.phase?.ground_fullname?.includes("Sessional")
    );
    return sessionalMark ? parseFloat(sessionalMark.exam_mark || "0") : 0; // Already out of 100
  };

  // Get Daily Average from flying marks
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

    const phaseGroups: { [key: string]: number[] } = {};
    dailyMarks.forEach((mark) => {
      const phaseKey = mark.syllabus?.phase_shortname || mark.syllabus?.id?.toString() || "unknown";
      if (!phaseGroups[phaseKey]) {
        phaseGroups[phaseKey] = [];
      }
      phaseGroups[phaseKey].push(parseFloat(mark.achieved_mark || "0"));
    });

    const phaseAverages = Object.values(phaseGroups).map(
      (marks) => marks.reduce((sum, m) => sum + m, 0) / marks.length
    );

    if (phaseAverages.length === 0) return 0;
    const avgOfAvg = phaseAverages.reduce((sum, avg) => sum + avg, 0) / phaseAverages.length;
    return avgOfAvg * 1.3; // Scale to 130
  };

  // Get Solo Check mark
  const getSoloCheckMark = (marks: Ftw12sqnFlyingExaminationMark[]) => {
    const soloCheckMark = marks.find(
      (mark) =>
        mark.syllabus?.phase_shortname?.includes("SOLO") ||
        mark.syllabus?.phase_full_name?.includes("SOLO Ck")
    );
    return soloCheckMark ? parseFloat(soloCheckMark.achieved_mark || "0") : 0;
  };

  // Get MTT mark
  const getMttMark = (marks: Ftw12sqnFlyingExaminationMark[]) => {
    const mttMark = marks.find(
      (mark) =>
        mark.syllabus?.phase_shortname === "MTT" ||
        mark.syllabus?.phase_full_name?.includes("Mid Term Test")
    );
    return mttMark ? parseFloat(mttMark.achieved_mark || "0") * 1.3 : 0; // Scale to 130
  };

  // Calculate totals for each cadet (BUP 600)
  const cadetsWithTotals = semesterData.cadets.map((cadetData, index) => {
    const cadetId = cadetData.cadet_details.id;

    // Ground marks
    const mtdMark = getMtdMark(cadetId);
    const quizTestMark = getQuizTestMark(cadetId);
    const sessionalMark = getSessionalMark(cadetId);

    // Flying marks
    const dailyAvg = getDailyAvg(cadetData.marks);
    const soloCheckMark = getSoloCheckMark(cadetData.marks);
    const mttMark = getMttMark(cadetData.marks);

    // Total out of 600
    const totalValue = mtdMark + quizTestMark + sessionalMark + dailyAvg + soloCheckMark + mttMark;
    const inPercentage = (totalValue / 600) * 100;

    return {
      cadetData,
      index,
      mtdMark,
      quizTestMark,
      sessionalMark,
      dailyAvg,
      soloCheckMark,
      mttMark,
      totalValue,
      inPercentage
    };
  });

  // Sort by total value for positions
  const sortedCadets = [...cadetsWithTotals].sort((a, b) => b.totalValue - a.totalValue);
  const positionMap: { [key: number]: number } = {};
  sortedCadets.forEach((item, pos) => {
    positionMap[item.index] = pos + 1;
  });

  // BUP 5th - Detailed View
  const renderBup5thTable = () => (
    <div className="bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th rowSpan={2} className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black print:hidden">
                <input
                  type="checkbox"
                  checked={areAllCadetsSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
              <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                SL.
              </th>
              <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                BD/NO
              </th>
              <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Rank
              </th>
              <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Name
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                MTD
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Quiz Test
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Sessional
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Daily Avg.
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Solo CK
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                MTT
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Total
              </th>
              <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                In %
              </th>
              <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Grade
              </th>
              <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Position
              </th>
              <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black print:hidden">
                Approval Status
              </th>
            </tr>
            <tr>
              <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                70
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                70
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                100
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                130
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                100
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                130
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                600
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {cadetsWithTotals.map(
              ({ cadetData, index, mtdMark, quizTestMark, sessionalMark, dailyAvg, soloCheckMark, mttMark, totalValue, inPercentage }) => {
                const position = positionMap[index];
                const gradeInfo = getGrade(inPercentage);

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
                      {mtdMark.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {quizTestMark.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {sessionalMark.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center border border-black text-sm">
                      <span className={`${dailyAvg >= 104 ? "text-green-600" : dailyAvg >= 78 ? "text-yellow-600" : "text-red-600"}`}>
                        {dailyAvg.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {soloCheckMark.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {mttMark.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center border border-black text-sm font-bold">
                      <span className={`${totalValue >= 480 ? "text-green-600" : totalValue >= 360 ? "text-yellow-600" : "text-red-600"}`}>
                        {totalValue.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {inPercentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center border border-black text-sm">
                      <span className={`font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm font-bold">
                      {position}
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

  // BUP 600 - Summary View
  const renderBup600Table = () => (
    <div className="bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                SL.
              </th>
              <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                BD/NO
              </th>
              <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Rank
              </th>
              <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Name
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Total
              </th>
              <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                %
              </th>
              <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Grade
              </th>
              <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Position
              </th>
            </tr>
            <tr>
              <th className="px-6 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                600
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {cadetsWithTotals.map(
              ({ cadetData, index, totalValue, inPercentage }) => {
                const position = positionMap[index];
                const gradeInfo = getGrade(inPercentage);

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
                    <td className="px-6 py-3 text-center text-black border border-black text-sm">
                      {index + 1}
                    </td>
                    <td className="px-6 py-3 text-center text-black border border-black text-sm">
                      {cadetData.cadet_details.bdno}
                    </td>
                    <td className="px-6 py-3 text-center text-black border border-black text-sm">
                      {cadetData.cadet_details.rank?.name || "Officer Cadet"}
                    </td>
                    <td className="px-6 py-3 text-left text-black border border-black text-sm">
                      {cadetData.cadet_details.name}
                    </td>
                    <td className="px-6 py-3 text-center border border-black text-sm font-bold">
                      <span className={`${totalValue >= 480 ? "text-green-600" : totalValue >= 360 ? "text-yellow-600" : "text-red-600"}`}>
                        {totalValue.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center text-black border border-black text-sm">
                      {inPercentage.toFixed(1)}%
                    </td>
                    <td className="px-6 py-3 text-center border border-black text-sm">
                      <span className={`font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</span>
                    </td>
                    <td className="px-6 py-3 text-center text-black border border-black text-sm font-bold">
                      {position}
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

  return (
    <div>
      {/* Sub-Tab Navigation */}
      <div className="flex justify-end mb-4 print:hidden">
        <nav className="flex space-x-1 border border-gray-200 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setActiveSubTab('bup5th')}
            className={`py-1 px-4 font-medium text-sm rounded-full transition-colors ${
              activeSubTab === 'bup5th'
                ? 'bg-blue-500 text-white'
                : 'bg-transparent text-black hover:bg-gray-200'
            }`}
          >
            BUP 5th
          </button>
          <button
            onClick={() => setActiveSubTab('bup600')}
            className={`py-1 px-4 font-medium text-sm rounded-full transition-colors ${
              activeSubTab === 'bup600'
                ? 'bg-blue-500 text-white'
                : 'bg-transparent text-black hover:bg-gray-200'
            }`}
          >
            BUP 600
          </button>
        </nav>
      </div>

      {/* Sub-Tab Content */}
      {activeSubTab === 'bup5th' && renderBup5thTable()}
      {activeSubTab === 'bup600' && renderBup600Table()}
    </div>
  );
};

export default BupReportTab;
