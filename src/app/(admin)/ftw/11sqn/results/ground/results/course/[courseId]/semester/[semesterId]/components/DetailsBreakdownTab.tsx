"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Ftw11sqnGroundExaminationMark } from "@/libs/types/ftw11sqnExamination";

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
  marks: Ftw11sqnGroundExaminationMark[];
}

interface DetailsBreakdownTabProps {
  semesterData: SemesterData;
  onEdit?: (mark: Ftw11sqnGroundExaminationMark) => void;
  onDelete?: (mark: Ftw11sqnGroundExaminationMark) => void;
}

const DetailsBreakdownTab: React.FC<DetailsBreakdownTabProps> = ({
  semesterData,
  onEdit,
  onDelete,
}) => {
  // Transform data to group by cadet and then by phase (syllabus)
  const transformedCadets = semesterData.cadets.map((cadet) => {
    const phases: {
      [key: number]: {
        phase: { id: number; ground_full_name: string; ground_shortname: string };
        exercises: (Ftw11sqnGroundExaminationMark & { cadet_details: typeof cadet.cadet_details })[];
      };
    } = {};

    cadet.marks.forEach((mark) => {
      const phaseKey = mark.syllabus?.id || 0;
      if (!phases[phaseKey]) {
        phases[phaseKey] = {
          phase: {
            id: mark.syllabus?.id || 0,
            ground_full_name: mark.syllabus?.ground_full_name || "",
            ground_shortname: mark.syllabus?.ground_shortname || "",
          },
          exercises: [],
        };
      }
      phases[phaseKey].exercises.push({
        ...mark,
        cadet_details: cadet.cadet_details,
      });
    });

    const sortedPhases = Object.values(phases).sort((a, b) => a.phase.id - b.phase.id);

    return {
      cadet_details: cadet.cadet_details,
      phases: sortedPhases,
    };
  });

  return (
    <div className="bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-black">
          <tbody>
            {transformedCadets.map((cadet, cadetIndex) => (
              <React.Fragment key={cadet.cadet_details.id}>
                {/* Cadet Name Header Row */}
                <tr className="bg-gray-100 font-bold">
                  <td
                    className="px-4 py-4 text-center text-sm text-black border border-black uppercase tracking-wider"
                    colSpan={7}
                  >
                    {cadet.cadet_details?.name || "Unknown Cadet"} (BD No:{" "}
                    {cadet.cadet_details?.bdno || "N/A"}) -{" "}
                    {cadet.cadet_details?.rank?.name || "Officer Cadet"}
                  </td>
                </tr>

                {/* Table Header for each Cadet */}
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-center text-xs font-bold text-black border border-black uppercase tracking-wider w-1/4">
                    Phase (Syllabus)
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-black border border-black uppercase tracking-wider w-1/4">
                    Exercise
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-black border border-black uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-black border border-black uppercase tracking-wider">
                    Mark
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-black border border-black uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-black border border-black uppercase tracking-wider">
                    Remark
                  </th>
                  {(onEdit || onDelete) && (
                    <th className="px-4 py-2 text-center text-xs font-bold text-black border border-black uppercase tracking-wider print:hidden">
                      Actions
                    </th>
                  )}
                </tr>

                {/* Exercise Rows for this Cadet */}
                {cadet.phases.map((phase) => (
                  <React.Fragment key={`phase-${phase.phase.id}-${cadetIndex}`}>
                    {phase.exercises.map((mark, exerciseIndex) => {
                      const isFirstInPhase = exerciseIndex === 0;
                      const isLastInPhase = exerciseIndex === phase.exercises.length - 1;

                      return (
                        <React.Fragment key={mark.id}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            {isFirstInPhase && (
                              <td
                                className="px-4 py-2 text-black border border-black align-middle text-center"
                                rowSpan={phase.exercises.length + 1}
                              >
                                <div>
                                  <div className="text-sm font-bold text-gray-900">
                                    {phase.phase?.ground_shortname}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {phase.phase?.ground_full_name}
                                  </div>
                                </div>
                              </td>
                            )}
                            <td className="px-4 py-2 text-black border border-black">
                              <div className="text-sm text-gray-900">
                                {mark.exercise?.exercise_name || mark.exercise?.exercise_shortname || "N/A"}
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-center text-black border border-black text-sm">
                              {mark.participate_date || "-"}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-center text-black border border-black">
                              {mark.achieved_mark !== null ? (
                                <span className="text-sm font-bold text-blue-700">
                                  {mark.achieved_mark}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-black border border-black text-sm">
                              {mark.instructor?.name || "N/A"}
                            </td>
                            <td className="px-4 py-2 text-black border border-black text-sm">
                              {mark.remark || "-"}
                            </td>
                            {(onEdit || onDelete) && (
                              <td className="px-4 py-2 text-center text-black border border-black text-sm print:hidden">
                                <div className="flex justify-center space-x-1">
                                  {onEdit && (
                                    <button
                                      onClick={() => onEdit(mark)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      title="Edit"
                                    >
                                      <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                                    </button>
                                  )}
                                  {onDelete && (
                                    <button
                                      onClick={() => onDelete(mark)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Delete"
                                    >
                                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>

                          {/* Phase Summary Row */}
                          {isLastInPhase && (
                            <tr className="bg-blue-50/30">
                              <td className="px-4 py-2 text-right text-xs font-bold text-black border border-black uppercase" colSpan={2}>
                                Phase Avg:
                              </td>
                              <td className="px-4 py-2 text-center text-sm font-bold text-blue-800 border border-black" colSpan={1}>
                                {(phase.exercises.reduce((sum, m) => sum + parseFloat(m.achieved_mark || "0"), 0) / phase.exercises.length).toFixed(2)}
                              </td>
                              <td className="px-4 py-2 border border-black" colSpan={onEdit || onDelete ? 3 : 2}></td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                ))}

                {/* Cadet Grand Total Row */}
                <tr className="bg-blue-100 font-bold">
                  <td className="px-4 py-2 text-center text-sm text-black border border-black uppercase" colSpan={3}>
                    Grand Average
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-blue-900 border border-black">
                    {cadet.cadet_details.average_mark.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 border border-black" colSpan={onEdit || onDelete ? 3 : 2}></td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DetailsBreakdownTab;
