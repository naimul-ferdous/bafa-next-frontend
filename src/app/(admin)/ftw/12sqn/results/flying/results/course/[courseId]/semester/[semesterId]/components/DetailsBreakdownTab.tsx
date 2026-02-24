"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Ftw12sqnFlyingExaminationMark } from "@/libs/types/ftw12sqnExamination";

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

interface DetailsBreakdownTabProps {
  semesterData: SemesterData;
  onEdit?: (mark: Ftw12sqnFlyingExaminationMark) => void;
  onDelete?: (mark: Ftw12sqnFlyingExaminationMark) => void;
}

const DetailsBreakdownTab: React.FC<DetailsBreakdownTabProps> = ({
  semesterData,
  onEdit,
  onDelete,
}) => {
  // Calculate total hours treating decimal as minutes (7.55 = 7h 55m)
  const calculateTotalHours = (hoursArray: number[]): number => {
    let totalMinutes = 0;

    hoursArray.forEach((timeValue) => {
      const hours = Math.floor(timeValue);
      const minutes = Math.round((timeValue - hours) * 100);
      totalMinutes += hours * 60 + minutes;
    });

    const finalHours = Math.floor(totalMinutes / 60);
    const finalMinutes = totalMinutes % 60;
    return finalHours + finalMinutes / 100;
  };

  // Transform data to group by cadet and then by phase
  const transformedCadets = semesterData.cadets.map((cadet) => {
    const phases: {
      [key: number]: {
        phase: { id: number; phase_full_name: string; phase_shortname: string; phase_sort?: number };
        exercises: (Ftw12sqnFlyingExaminationMark & { cadet_details: typeof cadet.cadet_details })[];
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

    // Sort phases by phase_sort
    const sortedPhases = Object.values(phases).sort(
      (a, b) => (a.phase.phase_sort || 0) - (b.phase.phase_sort || 0)
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
                                      {mark.exercise?.exercise_name || "N/A"}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-black border border-black text-sm text-gray-900">
                                    {mark.participate_date
                                      ? new Date(mark.participate_date).toLocaleDateString()
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-center text-black border border-black text-sm text-gray-900">
                                    {mark.achieved_time
                                      ? mark.achieved_time.toString().replace(".", ":")
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-center text-black border border-black text-sm text-gray-900">
                                    -
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-black border border-black text-center">
                                    {mark.achieved_mark !== null ? (
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

                                    // Calculate time hours
                                    const timeHoursArray = Array.isArray(phase.exercises)
                                      ? phase.exercises
                                          .filter(
                                            (exercise) =>
                                              exercise.achieved_time && exercise.achieved_time !== "0"
                                          )
                                          .map((exercise) =>
                                            parseFloat(exercise.achieved_time || "0")
                                          )
                                      : [];

                                    const totalTimeHours = calculateTotalHours(timeHoursArray);

                                    return (
                                      <tr className="border border-black bg-gray-50">
                                        <td
                                          colSpan={2}
                                          className="px-4 py-2 text-center text-black border border-black text-sm font-medium"
                                        >
                                          PHASE TOTAL
                                        </td>
                                        <td className="px-4 py-2 text-center text-black border border-black text-sm font-bold">
                                          {totalTimeHours.toFixed(2).toString().replace(".", ":")}
                                        </td>
                                        <td className="px-4 py-2 text-center text-black border border-black text-sm font-bold">
                                          -
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

                    // Calculate grand total time hours
                    const grandTimeHoursArray = allMarks
                      .filter(
                        (exercise) => exercise.achieved_time && exercise.achieved_time !== "0"
                      )
                      .map((exercise) => parseFloat(exercise.achieved_time || "0"));

                    const grandTotalTimeHours = calculateTotalHours(grandTimeHoursArray);

                    return (
                      <tr className="border border-black bg-blue-50">
                        <td
                          colSpan={3}
                          className="px-4 py-2 text-center text-black border border-black text-sm font-bold uppercase"
                        >
                          GRAND TOTAL
                        </td>
                        <td className="px-4 py-2 text-center text-black border border-black text-sm font-bold">
                          {grandTotalTimeHours.toFixed(2).toString().replace(".", ":")}
                        </td>
                        <td className="px-4 py-2 text-center text-black border border-black text-sm font-bold">
                          -
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
      </div>
    </div>
  );
};

export default DetailsBreakdownTab;
