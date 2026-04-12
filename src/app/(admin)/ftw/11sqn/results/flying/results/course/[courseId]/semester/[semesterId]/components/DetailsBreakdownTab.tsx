"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Ftw11sqnFlyingExaminationMark } from "@/libs/types/ftw11sqnExamination";

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

interface DetailsBreakdownTabProps {
  semesterData: SemesterData;
  onEdit?: (mark: Ftw11sqnFlyingExaminationMark) => void;
  onDelete?: (mark: Ftw11sqnFlyingExaminationMark) => void;
}

const DetailsBreakdownTab: React.FC<DetailsBreakdownTabProps> = ({
  semesterData,
  onEdit,
  onDelete,
}) => {
  // Parse time string "H:MM" to decimal hours
  const parseTimeToHours = (timeStr: string | null | undefined): number => {
    if (!timeStr || timeStr === "0" || timeStr === "0:00") return 0;
    // Handle "H:MM" format
    const parts = timeStr.toString().split(':');
    if (parts.length === 2) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      return hours + minutes / 60;
    }
    // Handle decimal format
    return parseFloat(timeStr) || 0;
  };

  // Calculate total hours from array of time strings
  const calculateTotalHours = (timeArray: (string | null | undefined)[]): number => {
    let totalMinutes = 0;
    timeArray.forEach((timeStr) => {
      const hours = parseTimeToHours(timeStr);
      totalMinutes += hours * 60;
    });
    const finalHours = Math.floor(totalMinutes / 60);
    const finalMinutes = Math.round(totalMinutes % 60);
    return finalHours + finalMinutes / 100;
  };

  // Transform data to group by cadet and then by phase
  const transformedCadets = semesterData.cadets.map((cadet) => {
    const phases: {
      [key: number]: {
        phase: { id: number; phase_full_name: string; phase_shortname: string; phase_sort?: number };
        exercises: (Ftw11sqnFlyingExaminationMark & { cadet_details: typeof cadet.cadet_details })[];
      };
    } = {};

    cadet.marks.forEach((mark) => {
      const phaseKey = mark.syllabus?.id || 0;
      if (!phases[phaseKey]) {
        phases[phaseKey] = {
          phase: {
            id: mark.syllabus?.id || 0,
            phase_full_name: mark.syllabus?.phase_full_name || "",
            phase_shortname: mark.syllabus?.phase_shortname || "",
            phase_sort: 0,
          },
          exercises: [],
        };
      }
      phases[phaseKey].exercises.push({
        ...mark,
        cadet_details: cadet.cadet_details,
      });
    });

    // Sort exercises by exercise shortname (natural sort for numbers)
    Object.values(phases).forEach((phase) => {
      phase.exercises.sort((a, b) => {
        const aSort = a.exercise?.exercise_shortname || a.exercise?.exercise_name || "";
        const bSort = b.exercise?.exercise_shortname || b.exercise?.exercise_name || "";
        // Natural sort: extract number from string and compare numerically
        const aNum = aSort.match(/\d+/)?.[0];
        const bNum = bSort.match(/\d+/)?.[0];
        if (aNum && bNum) {
          return parseInt(aNum) - parseInt(bNum);
        }
        return aSort.localeCompare(bSort);
      });
    });

    // Sort phases by syllabus id (ascending)
    const sortedPhases = Object.values(phases).sort(
      (a, b) => a.phase.id - b.phase.id
    );

    return {
      cadet_details: cadet.cadet_details,
      phases: sortedPhases,
    };
  });

  return (
    <div className="bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <tbody>
            {transformedCadets.map((cadet, cadetIndex) => {
              return (
                <React.Fragment key={cadet.cadet_details.id}>
                  {/* Cadet Name Header Row */}
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-sm font-bold text-black border border-black uppercase tracking-wider"
                      colSpan={9}
                    >
                      {cadet.cadet_details?.name || "Unknown Cadet"} (BD No:{" "}
                      {cadet.cadet_details?.bdno || "N/A"}) -{" "}
                      {cadet.cadet_details?.rank?.name || "Officer Cadet"}
                    </td>
                  </tr>

                  {/* Table Header for each Cadet */}
                  <tr>
                    <th
                      className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider"
                      rowSpan={2}
                    >
                      Phase
                    </th>
                    <th
                      className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider"
                      rowSpan={2}
                    >
                      Exercise
                    </th>
                    <th
                      className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider"
                      rowSpan={2}
                    >
                      Date
                    </th>
                    <th
                      className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider"
                      colSpan={2}
                    >
                      Hrs Flown
                    </th>
                    <th
                      className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider"
                      rowSpan={2}
                    >
                      Mark
                    </th>
                    <th
                      className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider"
                      rowSpan={2}
                    >
                      Instructor
                    </th>
                    <th
                      className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider"
                      rowSpan={2}
                    >
                      Remark
                    </th>
                    {(onEdit || onDelete) && (
                      <th
                        className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider print:hidden"
                        rowSpan={2}
                      >
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

                  {/* Exercise Rows for this Cadet */}
                  {cadet.phases.map((phase) => {
                    return (
                      <React.Fragment key={`phase-${phase.phase.id}-${cadetIndex}`}>
                        {/* Phase Exercise Rows */}
                        {Array.isArray(phase.exercises) &&
                          phase.exercises.map((mark, exerciseIndex) => {
                            const isFirstInPhase = exerciseIndex === 0;
                            const isLastInPhase =
                              exerciseIndex ===
                              (Array.isArray(phase.exercises) ? phase.exercises.length : 0) - 1;

                            return (
                              <React.Fragment key={mark.id}>
                                <tr className="hover:bg-gray-50 transition-colors">
                                  {isFirstInPhase && (
                                    <td
                                      className="px-4 py-2 text-black border border-black align-middle text-center"
                                      rowSpan={
                                        (Array.isArray(phase.exercises)
                                          ? phase.exercises.length
                                          : 0) + 1
                                      }
                                    >
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {phase.phase?.phase_shortname}
                                        </div>
                                        <div className="text-xs text-black">
                                          {phase.phase?.phase_full_name}
                                        </div>
                                      </div>
                                    </td>
                                  )}
                                  <td className="px-4 py-2 text-black border border-black">
                                    <div className="text-sm text-gray-900">
                                      {mark.exercise?.exercise_shortname || mark.exercise?.exercise_name || "N/A"}
                                      {/* {mark.exercise?.exercise_shortname && mark.exercise?.exercise_name && mark.exercise.exercise_shortname !== mark.exercise.exercise_name && (
                                        <span className="text-gray-500"> / {mark.exercise.exercise_name}</span>
                                      )} */}
                                      {mark.phase_type?.id === 1 && <span className="text-blue-600 font-bold"> (S)</span>}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-black border border-black text-sm text-gray-900">
                                    {mark.participate_date
                                      ? new Date(mark.participate_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-center text-black border border-black text-sm text-gray-900">
                                    {mark.phase_type?.id === 1
                                      ? mark.achieved_time
                                        ? mark.achieved_time.toString().replace(".", ":")
                                        : "-"
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-center text-black border border-black text-sm text-gray-900">
                                    {mark.phase_type?.id === 2
                                      ? mark.achieved_time
                                        ? mark.achieved_time.toString().replace(".", ":")
                                        : "-"
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-black border border-black text-center">
                                    {mark.achieved_mark !== null && mark.achieved_mark !== undefined && mark.achieved_mark !== "" ? (
                                      isNaN(Number(mark.achieved_mark)) ? (
                                        <span className="text-sm font-semibold text-orange-600">
                                          {mark.achieved_mark}
                                        </span>
                                      ) : (
                                        <span
                                          className={`text-sm font-semibold ${
                                            parseFloat(mark.achieved_mark || "0") >= 80
                                              ? "text-green-600"
                                              : parseFloat(mark.achieved_mark || "0") >= 60
                                              ? "text-yellow-600"
                                              : "text-red-600"
                                          }`}
                                        >
                                          {parseFloat(mark.achieved_mark || "0").toFixed(2)}
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-black border border-black text-sm text-gray-900">
                                    {mark.instructor?.name || "N/A"}
                                  </td>
                                  {mark.remark ? (
                                    <td className="px-4 py-2 text-black border border-black text-sm">
                                      <span title={mark.remark}>
                                        {mark.remark.length > 30
                                          ? `${mark.remark.substring(0, 30)}...`
                                          : mark.remark}
                                      </span>
                                    </td>
                                  ) : (
                                    <td className="px-4 py-2 text-center text-black border border-black text-sm">
                                      <span>-</span>
                                    </td>
                                  )}
                                  {(onEdit || onDelete) && (
                                    <td className="px-4 py-2 text-center text-black border border-black text-sm print:hidden">
                                      <div className="flex justify-center space-x-1">
                                        {onEdit && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onEdit(mark);
                                            }}
                                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-colors text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100"
                                            title="Edit"
                                          >
                                            <Icon
                                              icon="hugeicons:pencil-edit-01"
                                              className="w-3 h-3"
                                            />
                                          </button>
                                        )}
                                        {onDelete && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDelete(mark);
                                            }}
                                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-colors text-red-600 bg-red-50 border border-red-200 hover:bg-red-100"
                                            title="Delete"
                                          >
                                            <Icon icon="hugeicons:delete-02" className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  )}
                                </tr>

                                {/* Phase Total Row - appears after last exercise of each phase */}
                                {isLastInPhase &&
                                  (() => {
                                    const validMarks = Array.isArray(phase.exercises)
                                      ? phase.exercises
                                          .map((exercise) =>
                                            parseFloat(exercise.achieved_mark?.toString() || "0")
                                          )
                                          .filter((m) => !isNaN(m) && m > 0)
                                      : [];

                                    const totalMarks = validMarks.reduce(
                                      (sum, m) => sum + m,
                                      0
                                    );
                                    const averageMark =
                                      validMarks.length > 0 ? totalMarks / validMarks.length : 0;

                                    // Calculate time hours - separate for Solo and Dual
                                    const soloTimeArray = Array.isArray(phase.exercises)
                                      ? phase.exercises
                                          .filter(
                                            (exercise) =>
                                              exercise.phase_type?.id === 1 &&
                                              exercise.achieved_time &&
                                              exercise.achieved_time !== "0"
                                          )
                                          .map((exercise) => exercise.achieved_time)
                                      : [];

                                    const dualTimeArray = Array.isArray(phase.exercises)
                                      ? phase.exercises
                                          .filter(
                                            (exercise) =>
                                              exercise.phase_type?.id === 2 &&
                                              exercise.achieved_time &&
                                              exercise.achieved_time !== "0"
                                          )
                                          .map((exercise) => exercise.achieved_time)
                                      : [];

                                    const totalSoloTimeHours = calculateTotalHours(soloTimeArray);
                                    const totalDualTimeHours = calculateTotalHours(dualTimeArray);

                                    return (
                                      <tr className="border border-black bg-gray-50">
                                        <td
                                          colSpan={2}
                                          className="px-4 py-2 text-center text-black border border-black text-sm font-medium"
                                        >
                                          PHASE TOTAL
                                        </td>
                                        <td className="px-4 py-2 text-center text-black border border-black text-sm font-bold">
                                          {totalSoloTimeHours >= 0 ? totalSoloTimeHours.toFixed(2).toString().replace(".", ":") : "-"}
                                        </td>
                                        <td className="px-4 py-2 text-center text-black border border-black text-sm font-bold">
                                          {totalDualTimeHours >= 0 ? totalDualTimeHours.toFixed(2).toString().replace(".", ":") : "-"}
                                        </td>
                                        <td className="px-4 py-2 text-center text-black border border-black text-sm font-bold">
                                          <span
                                            className={`${
                                              averageMark >= 80
                                                ? "text-green-600"
                                                : averageMark >= 60
                                                ? "text-yellow-600"
                                                : "text-red-600"
                                            }`}
                                          >
                                            {averageMark.toFixed(2)}
                                          </span>
                                        </td>
                                        <td
                                          colSpan={onEdit || onDelete ? 3 : 2}
                                          className="px-4 py-2 text-center text-black border border-black text-sm font-bold"
                                        >
                                          -
                                        </td>
                                      </tr>
                                    );
                                  })()}
                                </React.Fragment>
                              );
                            })}
                        </React.Fragment>
                      );
                    })}

                  {/* Grand Total Row for this Cadet */}
                  {(() => {
                    const allMarks = cadet.phases.flatMap((phase) => phase.exercises || []);
                    const validMarks = allMarks
                      .map((exercise) =>
                        parseFloat(exercise.achieved_mark?.toString() || "0")
                      )
                      .filter((m) => !isNaN(m) && m > 0);

                    const grandTotalMarks = validMarks.reduce((sum, m) => sum + m, 0);
                    const grandAverageMark =
                      validMarks.length > 0 ? grandTotalMarks / validMarks.length : 0;

                    // Calculate grand total time hours - separate for Solo and Dual
                    const grandSoloTimeArray = allMarks
                      .filter(
                        (exercise) => exercise.phase_type?.id === 1 && exercise.achieved_time && exercise.achieved_time !== "0"
                      )
                      .map((exercise) => exercise.achieved_time);

                    const grandDualTimeArray = allMarks
                      .filter(
                        (exercise) => exercise.phase_type?.id === 2 && exercise.achieved_time && exercise.achieved_time !== "0"
                      )
                      .map((exercise) => exercise.achieved_time);

                    const grandTotalSoloTimeHours = calculateTotalHours(grandSoloTimeArray);
                    const grandTotalDualTimeHours = calculateTotalHours(grandDualTimeArray);

                    return (
                      <tr className="border border-black bg-blue-50">
                        <td
                          colSpan={2}
                          className="px-4 py-2 text-center text-black border border-black text-sm font-bold uppercase"
                        >
                          GRAND TOTAL
                        </td>
                        <td className="px-4 py-2 text-center text-black border border-black text-sm font-bold">
                          {grandTotalSoloTimeHours >= 0 ? grandTotalSoloTimeHours.toFixed(2).toString().replace(".", ":") : "-"}
                        </td>
                        <td className="px-4 py-2 text-center text-black border border-black text-sm font-bold">
                          {grandTotalDualTimeHours >= 0 ? grandTotalDualTimeHours.toFixed(2).toString().replace(".", ":") : "-"}
                        </td>
                        <td className="px-4 py-2 text-center text-black border border-black text-sm font-bold">
                          <span
                            className={`${
                              grandAverageMark >= 80
                                ? "text-green-600"
                                : grandAverageMark >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {grandAverageMark.toFixed(2)}
                          </span>
                        </td>
                        <td
                          colSpan={onEdit || onDelete ? 3 : 2}
                          className="px-4 py-2 text-center text-black border border-black text-sm font-bold"
                        >
                          -
                        </td>
                      </tr>
                    );
                  })()}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* Daily Avg Calculation Display */}
        {semesterData.cadets.map((cadet, cadetIndex) => {
          const allMarks = cadet.marks || [];
          
          // Filter marks for daily avg (exclude SOLO CHECK, SOLO phases with N/G, MTT)
          const dailyMarks = allMarks.filter(
            (mark) => {
              // Exclude SOLO CHECK
              if (mark.syllabus?.phase_full_name?.toLowerCase().includes("solo check")) return false;
              
              // Exclude SOLO Phase marks that have N/G (but include valid marks)
              const isSoloPhase = mark.syllabus?.phase_shortname?.includes("SOLO") || 
                                  (mark.syllabus?.phase_full_name?.includes("SOLO") && 
                                   !mark.syllabus?.phase_full_name?.toLowerCase().includes("solo check"));
              if (isSoloPhase && (!mark.achieved_mark || parseFloat(mark.achieved_mark) <= 0)) return false;
              
              // Exclude MTT
              if (mark.syllabus?.phase_shortname === "MTT" || mark.syllabus?.phase_full_name?.includes("Mid Term Test")) return false;
              
              // Exclude N/G or null marks in regular missions
              if (!mark.achieved_mark || isNaN(parseFloat(mark.achieved_mark)) || parseFloat(mark.achieved_mark) <= 0) return false;
              
              return true;
            }
          );

          // Count excluded by category
          const soloCheckCount = allMarks.filter(m => 
            m.syllabus?.phase_full_name?.toLowerCase().includes("solo check")
          ).length;
          
          const soloPhaseNgCount = allMarks.filter(m => {
            const isSoloPhase = m.syllabus?.phase_shortname?.includes("SOLO") || 
                                (m.syllabus?.phase_full_name?.includes("SOLO") && 
                                 !m.syllabus?.phase_full_name?.toLowerCase().includes("solo check"));
            return isSoloPhase && (!m.achieved_mark || m.achieved_mark === "N/G" || isNaN(parseFloat(m.achieved_mark)) || parseFloat(m.achieved_mark) <= 0);
          }).length;
          
          const mttExcluded = allMarks.filter(m => 
            m.syllabus?.phase_shortname === "MTT" || 
            m.syllabus?.phase_full_name?.includes("Mid Term Test")
          ).length;
          
          const ngOrNullExcluded = allMarks.filter(m => {
            // Only regular missions (not SOLO CHECK, not SOLO Phase, not MTT)
            const isSoloCheck = m.syllabus?.phase_full_name?.toLowerCase().includes("solo check");
            const isSoloPhase = m.syllabus?.phase_shortname?.includes("SOLO") || 
                                (m.syllabus?.phase_full_name?.includes("SOLO") && !isSoloCheck);
            const isMtt = m.syllabus?.phase_shortname === "MTT" || m.syllabus?.phase_full_name?.includes("Mid Term Test");
            
            if (isSoloCheck || isSoloPhase || isMtt) return false;
            
            // Count only N/G or null marks
            return !m.achieved_mark || m.achieved_mark === "N/G";
          }).length;

          if (dailyMarks.length === 0) return null;

          const totalMarks = dailyMarks.reduce((sum, mark) => sum + parseFloat(mark.achieved_mark || "0"), 0);
          const avgOfMarks = dailyMarks.length > 0 ? totalMarks / dailyMarks.length : 0;
          const dailyAvg = avgOfMarks * 4;

          return (
            <div key={cadetIndex} className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-bold text-gray-800 mb-2">
                Daily Avg Calculation - {cadet.cadet_details?.name || "Cadet"} (BD No: {cadet.cadet_details?.bdno || "N/A"})
              </h4>
              <div className="text-xs text-gray-700 space-y-1">
                <p><span className="font-medium">Total Missions:</span> {allMarks.length}</p>
                <p><span className="font-medium">Excluded - SOLO CHECK:</span> {soloCheckCount}</p>
                <p><span className="font-medium">Excluded - SOLO Phase (N/G):</span> {soloPhaseNgCount}</p>
                <p><span className="font-medium">Excluded - MTT:</span> {mttExcluded}</p>
                <p><span className="font-medium">Excluded - N/G or Null:</span> {ngOrNullExcluded}</p>
                <p><span className="font-medium text-green-600">Valid Missions (for calculation):</span> {dailyMarks.length}</p>
                <p><span className="font-medium">Sum of Marks:</span> {totalMarks.toFixed(2)}</p>
                <p><span className="font-medium">Average (mission wise):</span> {totalMarks.toFixed(2)} / {dailyMarks.length} = {avgOfMarks.toFixed(2)}</p>
                
                {/* Phase-wise average calculation */}
                {(() => {
                  const phaseGroups: { [key: string]: number[] } = {};
                  dailyMarks.forEach((mark) => {
                    const phaseKey = mark.syllabus?.phase_shortname || mark.syllabus?.id?.toString() || "unknown";
                    if (!phaseGroups[phaseKey]) {
                      phaseGroups[phaseKey] = [];
                    }
                    phaseGroups[phaseKey].push(parseFloat(mark.achieved_mark || "0"));
                  });
                  const phaseAverages = Object.values(phaseGroups).map(marks => marks.reduce((sum, m) => sum + m, 0) / marks.length);
                  const phaseAvgOfAvg = phaseAverages.length > 0 ? phaseAverages.reduce((sum, avg) => sum + avg, 0) / phaseAverages.length : 0;
                  return (
                    <>
                      <p><span className="font-medium">Phases Count:</span> {phaseAverages.length}</p>
                      <p><span className="font-medium">Average (phase wise):</span> {phaseAvgOfAvg.toFixed(2)}</p>
                    </>
                  );
                })()}
                
                <p><span className="font-medium">Daily Avg (×4 for 400 marks):</span> {dailyAvg.toFixed(2)}</p>
                <p><span className="font-medium">Daily Avg (×1.3 for BUP 130):</span> {(avgOfMarks * 1.3).toFixed(2)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DetailsBreakdownTab;
