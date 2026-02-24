"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Ftw11sqnFlyingExaminationMark } from "@/libs/types/ftw11sqnExamination";

interface MissionWithPhase extends Ftw11sqnFlyingExaminationMark {
  phase_details?: {
    id: number;
    phase_shortname: string;
    phase_fullname: string;
    phase_sort?: number;
    phase_symbol?: string;
    exam_type?: string;
  };
}

interface SummaryTabProps {
  allMissions: MissionWithPhase[];
  shouldRenderPhase: { [key: number]: boolean };
  rowspans: { [key: number]: number };
  phaseAverages: { [key: number]: number };
  dailyAverage: number;
  onEdit?: (mark: Ftw11sqnFlyingExaminationMark) => void;
  onDelete?: (mark: Ftw11sqnFlyingExaminationMark) => void;
  sortedPhases: any[];
}

const SummaryTab: React.FC<SummaryTabProps> = ({
  allMissions,
  shouldRenderPhase,
  rowspans,
  phaseAverages,
  dailyAverage,
  onEdit,
  onDelete,
  sortedPhases,
}) => {
  const formatDate = (date: string | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider" rowSpan={2}>
                Phase
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider" rowSpan={2}>
                Mission
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider" rowSpan={2}>
                Date
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider" rowSpan={2}>
                Instructor
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider" colSpan={2}>
                Hrs Flown
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider" rowSpan={2}>
                Mark
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider" rowSpan={2}>
                Phase Avg
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider" rowSpan={2}>
                Total Avg
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider" rowSpan={2}>
                Remark
              </th>
              {(onEdit || onDelete) && (
                <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider print:hidden" rowSpan={2}>
                  Actions
                </th>
              )}
            </tr>
            <tr>
              <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">
                Solo
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">
                Dual
              </th>
            </tr>
          </thead>
          <tbody>
            {allMissions.map((mission, missionIndex) => {
              const isFirstMission = missionIndex === 0;
              return (
                <tr key={mission.id} className="hover:bg-gray-50 transition-colors">
                  {shouldRenderPhase[missionIndex] && (
                    <td
                      className="px-4 py-2 text-black border border-black align-middle text-center"
                      rowSpan={rowspans[missionIndex]}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {mission.phase_details?.phase_shortname || mission.syllabus?.phase_shortname}
                        </div>
                        <div className="text-xs text-black">
                          {mission.phase_details?.phase_fullname || mission.syllabus?.phase_full_name}
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-2 text-black border border-black">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {mission.exercise?.exercise_name || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-black border border-black text-sm text-gray-900">
                    {formatDate(mission.participate_date)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-black border border-black text-sm text-gray-900">
                    {mission.instructor?.name || "N/A"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center text-black border border-black text-sm text-gray-900">
                    {mission.achieved_time ? mission.achieved_time.toString().replace(".", ":") : "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center text-black border border-black text-sm text-gray-900">
                    -
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-black border border-black text-center">
                    {mission.achieved_mark !== null ? (
                      <span
                        className={`text-sm font-bold ${
                          parseFloat(mission.achieved_mark?.toString() || "0") >= 80
                            ? "text-green-600"
                            : parseFloat(mission.achieved_mark?.toString() || "0") >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {parseFloat(mission.achieved_mark?.toString() || "0").toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  {shouldRenderPhase[missionIndex] && (
                    <td
                      className="px-4 py-2 text-black border border-black text-center align-middle"
                      rowSpan={rowspans[missionIndex]}
                    >
                      {phaseAverages[missionIndex] > 0 ? (
                        <span
                          className={`text-sm font-bold ${
                            phaseAverages[missionIndex] >= 80
                              ? "text-green-600"
                              : phaseAverages[missionIndex] >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {phaseAverages[missionIndex].toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  {isFirstMission && (
                    <td
                      className="px-4 py-2 text-black border border-black text-center align-middle"
                      rowSpan={allMissions.length}
                    >
                      {dailyAverage > 0 ? (
                        <span
                          className={`text-sm font-bold ${
                            dailyAverage >= 80
                              ? "text-green-600"
                              : dailyAverage >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {dailyAverage.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  {mission.remark ? (
                    <td className="px-4 py-2 text-black border border-black text-sm" title={mission.remark}>
                      {mission.remark.length > 30 ? `${mission.remark.substring(0, 30)}...` : mission.remark}
                    </td>
                  ) : (
                    <td className="px-4 py-2 text-center text-black border border-black text-sm">-</td>
                  )}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-2 whitespace-nowrap text-black border border-black text-sm font-medium print:hidden">
                      <div className="flex justify-center items-center space-x-2">
                        {onEdit && (
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50 transition-colors"
                            onClick={() => onEdit(mission)}
                            title="Edit"
                          >
                            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                            onClick={() => onDelete(mission)}
                            title="Delete"
                          >
                            <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
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

      {/* Phase Averages Summary */}
      <div className="mt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase">Phase Averages Summary</h3>
        <div className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">
                    SL
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">
                    Phase
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">
                    Phase Name
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">
                    Total Solo
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">
                    Total Dual
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">
                    Total Exercises
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">
                    Phase Average
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const groupedPhases: {
                    [key: string]: {
                      phase_symbol: string;
                      phase_shortname: string;
                      phase_fullname: string;
                      allMarks: number[];
                      totalExercises: number;
                      soloCount: number;
                      dualCount: number;
                    };
                  } = {};

                  sortedPhases.forEach((phase: any) => {
                    const phaseSymbol = phase.phase_details?.phase_symbol || phase.phase_details?.phase_shortname;
                    const shortname = phase.phase_details?.phase_shortname;

                    if (!phaseSymbol) return;

                    if (!groupedPhases[phaseSymbol]) {
                      groupedPhases[phaseSymbol] = {
                        phase_symbol: phaseSymbol,
                        phase_shortname: shortname,
                        phase_fullname: phase.phase_details?.phase_fullname,
                        allMarks: [],
                        totalExercises: 0,
                        soloCount: 0,
                        dualCount: 0,
                      };
                    }

                    if (Array.isArray(phase.exercises)) {
                      phase.exercises.forEach((exercise: any) => {
                        const mark = parseFloat(exercise.achieved_mark?.toString() || "0");
                        if (!isNaN(mark) && mark > 0) {
                          groupedPhases[phaseSymbol].allMarks.push(mark);
                        }

                        if (exercise.achieved_time && parseFloat(exercise.achieved_time) > 0) {
                          groupedPhases[phaseSymbol].soloCount++;
                        }
                      });
                      groupedPhases[phaseSymbol].totalExercises += phase.exercises.length;
                    }
                  });

                  const groupedPhasesArray = Object.values(groupedPhases);
                  let totalSoloCount = 0;
                  let totalDualCount = 0;
                  let totalExercises = 0;
                  const allPhaseAverages: number[] = [];

                  const phaseRows = groupedPhasesArray.map((groupedPhase, index) => {
                    const phaseAverage =
                      groupedPhase.allMarks.length > 0
                        ? groupedPhase.allMarks.reduce((sum, mark) => sum + mark, 0) / groupedPhase.allMarks.length
                        : 0;

                    if (phaseAverage > 0) allPhaseAverages.push(phaseAverage);
                    totalSoloCount += groupedPhase.soloCount;
                    totalDualCount += groupedPhase.dualCount;
                    totalExercises += groupedPhase.totalExercises;

                    return (
                      <tr key={groupedPhase.phase_symbol} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 text-center text-black border border-black text-sm">{index + 1}</td>
                        <td className="px-4 py-2 text-center text-black border border-black text-sm font-medium">
                          {groupedPhase.phase_shortname}
                        </td>
                        <td className="px-4 py-2 text-black border border-black text-sm">
                          {groupedPhase.phase_fullname || "-"}
                        </td>
                        <td className="px-4 py-2 text-center text-black border border-black text-sm">
                          {groupedPhase.soloCount > 0 ? groupedPhase.soloCount : "-"}
                        </td>
                        <td className="px-4 py-2 text-center text-black border border-black text-sm">
                          {groupedPhase.dualCount > 0 ? groupedPhase.dualCount : "-"}
                        </td>
                        <td className="px-4 py-2 text-center text-black border border-black text-sm">
                          {groupedPhase.totalExercises}
                        </td>
                        <td className="px-4 py-2 text-center text-black border border-black text-sm">
                          {phaseAverage > 0 ? (
                            <span
                              className={`font-bold ${
                                phaseAverage >= 80
                                  ? "text-green-600"
                                  : phaseAverage >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {phaseAverage.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  });

                  const grandAverage =
                    allPhaseAverages.length > 0
                      ? allPhaseAverages.reduce((sum, avg) => sum + avg, 0) / allPhaseAverages.length
                      : 0;

                  return (
                    <>
                      {phaseRows}
                      <tr className="font-bold bg-gray-50">
                        <td colSpan={3} className="px-4 py-2 text-right text-black border border-black text-sm">
                          Grand Average (Phase Averages):
                        </td>
                        <td className="px-4 py-2 text-center text-black border border-black text-sm">
                          <span className="font-bold text-blue-600">{totalSoloCount > 0 ? totalSoloCount : "-"}</span>
                        </td>
                        <td className="px-4 py-2 text-center text-black border border-black text-sm">
                          <span className="font-bold text-blue-600">{totalDualCount > 0 ? totalDualCount : "-"}</span>
                        </td>
                        <td className="px-4 py-2 text-center text-black border border-black text-sm">{totalExercises}</td>
                        <td className="px-4 py-2 text-center text-black border border-black text-sm">
                          <span
                            className={`font-bold ${
                              grandAverage >= 80
                                ? "text-green-600"
                                : grandAverage >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {grandAverage > 0 ? grandAverage.toFixed(2) : "-"}
                          </span>
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryTab;
