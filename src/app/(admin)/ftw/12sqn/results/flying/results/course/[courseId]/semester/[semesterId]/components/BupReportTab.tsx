"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { Ftw12sqnFlyingExaminationMark } from "@/libs/types/ftw12sqnExamination";
import type { ApprovalProcess, CadetApprovalStatus } from "@/libs/types/approval";
import {
  canApproveThisCadet,
  isAlreadyApprovedByMe,
  getCadetApprovalStatusList,
} from "@/libs/utils/approvalHelpers";
import {
  ftw12sqnResultsBupAdjustMarkGradingService,
  Ftw12sqnResultsBupAdjustMarkGrading,
} from "@/libs/services/ftw12sqnResultsBupAdjustMarkGradingService";

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
  reportData?: {
    is_6th_semester: boolean;
    ground_phases: any[];
    flying_exam_phases: any[];
    bup: any[];
  } | null;
  semesterData: SemesterData;
  semesterId: number;
  courseId: number;
  groundData?: any;
  selectedCadets?: number[];
  onSelectCadet?: (cadetId: number) => void;
  onSelectAll?: (selected: boolean) => void;
  cadetApprovalStatuses?: CadetApprovalStatus[];
  approvalProcesses?: ApprovalProcess[];
  profile?: UserProfile | null;
}

const BupReportTab: React.FC<BupReportTabProps> = ({
  reportData,
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

  // Extract BUP data from reportData
  const bupData = reportData?.bup || [];
  const groundPhases = reportData?.ground_phases || [];
  const flyingExamPhases = reportData?.flying_exam_phases || [];
  const is6thSemester = reportData?.is_6th_semester || false;

  // BUP denominator: 700 for 6th semester, 600 otherwise
  const bupDenominator = is6thSemester ? 700 : 600;

  // Helper function to calculate percentage from total marks: (total / 600 or 700) * 100
  const calculatePercentage = (totalMarks: number) => {
    if (!totalMarks) return 0;
    return (totalMarks / bupDenominator) * 100;
  };

  // Fetch adjusted mark grading lookup table
  const [adjustGradings, setAdjustGradings] = useState<Ftw12sqnResultsBupAdjustMarkGrading[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await ftw12sqnResultsBupAdjustMarkGradingService.getAll({ per_page: 1000 });
        if (mounted) setAdjustGradings(response.data || []);
      } catch (error) {
        console.error("Failed to load adjust mark grading:", error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Look up adjusted mark row for a given percentage.
  // Finds the row with the highest obtain_mark that is <= percentage.
  const getAdjustedRow = (
    percentage: number
  ): { obtain: number; adjusted: number; grade: string | null } | null => {
    if (!percentage || adjustGradings.length === 0) return null;
    const sorted = [...adjustGradings]
      .map((r) => ({
        obtain: Number(r.obtain_mark ?? 0),
        adjusted: Number(r.adjusted_mark ?? 0),
        grade: r.grade ?? null,
      }))
      .filter((r) => !isNaN(r.obtain) && !isNaN(r.adjusted))
      .sort((a, b) => b.obtain - a.obtain);
    return sorted.find((r) => r.obtain <= percentage) || null;
  };

  const getAdjustedPercentage = (percentage: number): number | null => {
    const row = getAdjustedRow(percentage);
    return row ? row.adjusted : null;
  };

  const getAdjustedGrade = (percentage: number): string | null => {
    const row = getAdjustedRow(percentage);
    return row ? row.grade : null;
  };

  // Check if a cadet is selected
  const isCadetSelected = (cadetId: number) => selectedCadets.includes(cadetId);

  // Check if all cadets are selected
  const areAllCadetsSelected = bupData.length > 0 &&
    bupData.every(c => selectedCadets.includes(c.cadet_id));

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

  // Initial state based on semester
  const initialTab = is6thSemester ? 'bup600' : 'bup5th';
  const [activeSubTab, setActiveSubTab] = useState<'bup5th' | 'bup600'>(initialTab);

  // Helper: compute adjusted mark for a cadet
  const getAdjustedMark = (cadet: any): number => {
    const pct = calculatePercentage(cadet.total || 0);
    const adj = getAdjustedPercentage(pct);
    return adj !== null ? (adj * bupDenominator) / 100 : 0;
  };

  // Build position map sorted by adjusted mark desc, tie-break by BD number asc
  const buildPositionMap = (data: any[]): { [key: number]: number } => {
    const sorted = [...data].sort((a, b) => {
      const markDiff = getAdjustedMark(b) - getAdjustedMark(a);
      if (markDiff !== 0) return markDiff;
      return parseInt(a.bd_no || '0') - parseInt(b.bd_no || '0');
    });
    const map: { [key: number]: number } = {};
    sorted.forEach((item, pos) => { map[item.cadet_id] = pos + 1; });
    return map;
  };

  // BUP 5th/6th - Detailed View with all exam columns
  const renderBup5thTable = () => {
    if (bupData.length === 0) {
      return (
        <div className="bg-white p-8 text-center text-gray-500">
          No BUP data available
        </div>
      );
    }

    // Create position map based on adjusted marks
    const positionMap = buildPositionMap(bupData);

    return (
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
                {/* Dynamic Ground Phase Headers */}
                {groundPhases.map((phase: any) => (
                  <th key={`ground-${phase.key}`} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                    {phase.key}
                  </th>
                ))}
                {/* Dynamic Flying Exam Phase Headers */}
                {flyingExamPhases.map((phase: any) => (
                  <th key={`flying-${phase.key}`} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                    {phase.phase_shortname || phase.key}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  Daily Avg
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  Total
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  %
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  Adjusted % As Per Trg Guide
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  Adjusted Mks out of {bupDenominator}
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  Grade
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  Position
                </th>
              </tr>
              <tr>
                {/* Dynamic Ground Phase Weights */}
                {groundPhases.map((phase: any) => (
                  <th key={`ground-weight-${phase.key}`} className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                    {(Number(phase.weight) * 100).toFixed(0) || 0}
                  </th>
                ))}
                {/* Dynamic Flying Exam Phase Weights */}
                {flyingExamPhases.map((phase: any) => (
                  <th key={`flying-weight-${phase.key}`} className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                    {(Number(phase.weight) * 100).toFixed(0) || 0}
                  </th>
                ))}
                <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  130
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  {(reportData?.is_6th_semester || is6thSemester) ? 700 : 600}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {bupData.map((cadet: any, index: number) => {
                const position = positionMap[cadet.cadet_id] || index + 1;
                const gradeInfo = getGrade(calculatePercentage(cadet.total || 0));

                return (
                  <tr
                    key={cadet.cadet_id}
                    className="hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/ftw/12sqn/results/flying/results/course/${courseId}/semester/${semesterId}/cadet/${cadet.cadet_id}`
                      )
                    }
                  >
                    <td className="px-2 py-3 text-center text-black border border-black text-sm print:hidden">
                      <input
                        type="checkbox"
                        checked={selectedCadets.includes(cadet.cadet_id)}
                        onChange={() => onSelectCadet?.(cadet.cadet_id)}
                        className="w-4 h-4 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {cadet.bd_no || ''}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {cadet.rank || "Officer Cadet"}
                    </td>
                    <td className="px-4 py-3 text-left text-black border border-black text-sm">
                      {cadet.name}
                    </td>
                    {/* Dynamic Ground Phase Values */}
                    {groundPhases.map((phase: any) => (
                      <td key={`ground-${phase.key}`} className="px-4 py-3 text-center text-black border border-black text-sm">
                        {(cadet[phase.key] || 0).toFixed(2)}
                      </td>
                    ))}
                    {/* Dynamic Flying Exam Phase Values */}
                    {flyingExamPhases.map((phase: any) => (
                      <td key={`flying-${phase.key}`} className="px-4 py-3 text-center text-black border border-black text-sm">
                        {(cadet[phase.key] || 0).toFixed(2)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {(cadet.daily_avg || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center border border-black text-sm font-bold">
                      <span className={`${cadet.total >= 560 ? "text-green-600" : cadet.total >= 420 ? "text-yellow-600" : "text-red-600"}`}>
                        {(cadet.total || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {calculatePercentage(cadet.total || 0).toFixed(4)}%
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {(() => {
                        const pct = calculatePercentage(cadet.total || 0);
                        const adj = getAdjustedPercentage(pct);
                        return adj !== null ? `${adj.toFixed(2)}%` : "—";
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm font-bold">
                      {(() => {
                        const pct = calculatePercentage(cadet.total || 0);
                        const adj = getAdjustedPercentage(pct);
                        return adj !== null ? ((adj * bupDenominator) / 100).toFixed(2) : "—";
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center border border-black text-sm">
                      {(() => {
                        const pct = calculatePercentage(cadet.total || 0);
                        const adjGrade = getAdjustedGrade(pct);
                        return (
                          <span className={`font-bold ${gradeInfo.color}`}>
                            {adjGrade !== null ? adjGrade : "—"}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm font-bold">
                      {position}
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

  // BUP 600/700 - Summary View (only cadet details + total + position)
  const renderBup600Table = () => {
    if (bupData.length === 0) {
      return (
        <div className="bg-white p-8 text-center text-gray-500">
          No BUP data available
        </div>
      );
    }

    // Create position map based on adjusted marks
    const positionMap = buildPositionMap(bupData);

    return (
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
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  Total
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  %
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  Adjusted % As Per Trg Guide
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  Adjusted Total
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  Grade
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                  Position
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {bupData.map((cadet: any, index: number) => {
                const position = positionMap[cadet.cadet_id] || index + 1;
                const gradeInfo = getGrade(calculatePercentage(cadet.total || 0));

                return (
                  <tr
                    key={cadet.cadet_id}
                    className="hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/ftw/12sqn/results/flying/results/course/${courseId}/semester/${semesterId}/cadet/${cadet.cadet_id}`
                      )
                    }
                  >
                    <td className="px-2 py-3 text-center text-black border border-black text-sm print:hidden">
                      <input
                        type="checkbox"
                        checked={selectedCadets.includes(cadet.cadet_id)}
                        onChange={() => onSelectCadet?.(cadet.cadet_id)}
                        className="w-4 h-4 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {cadet.bd_no || ''}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {cadet.rank || "Officer Cadet"}
                    </td>
                    <td className="px-4 py-3 text-left text-black border border-black text-sm">
                      {cadet.name}
                    </td>
                    <td className="px-4 py-3 text-center border border-black text-sm font-bold">
                      <span className={`${cadet.total >= 560 ? "text-green-600" : cadet.total >= 420 ? "text-yellow-600" : "text-red-600"}`}>
                        {(cadet.total || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {calculatePercentage(cadet.total || 0).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm">
                      {(() => {
                        const pct = calculatePercentage(cadet.total || 0);
                        const adj = getAdjustedPercentage(pct);
                        return adj !== null ? `${adj.toFixed(1)}%` : "—";
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm font-bold">
                      {(() => {
                        const pct = calculatePercentage(cadet.total || 0);
                        const adj = getAdjustedPercentage(pct);
                        return adj !== null ? ((adj * bupDenominator) / 100).toFixed(2) : "—";
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center border border-black text-sm">
                      {(() => {
                        const pct = calculatePercentage(cadet.total || 0);
                        const adjGrade = getAdjustedGrade(pct);
                        return (
                          <span className={`font-bold ${gradeInfo.color}`}>
                            {adjGrade !== null ? adjGrade : "—"}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center text-black border border-black text-sm font-bold">
                      {position}
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
            {is6thSemester ? "BUP 6th" : "BUP 5th"}
          </button>
          <button
            onClick={() => setActiveSubTab('bup600')}
            className={`py-1 px-4 font-medium text-sm rounded-full transition-colors ${
              activeSubTab === 'bup600'
                ? 'bg-blue-500 text-white'
                : 'bg-transparent text-black hover:bg-gray-200'
            }`}
          >
            {is6thSemester ? "BUP 700" : "BUP 600"}
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