"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
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

interface FinalReportTabProps {
  semesterData: SemesterData;
  semesterId: number;
  courseId: number;
}

const FinalReportTab: React.FC<FinalReportTabProps> = ({
  semesterData,
  semesterId,
  courseId,
}) => {
  const router = useRouter();

  const getNineScaleGrade = (percentage: number) => {
    if (percentage >= 90)
      return { grade: "9", word: "Exceptional", color: "bg-green-700 text-white" };
    if (percentage >= 80)
      return { grade: "8", word: "Well above average", color: "bg-green-600 text-white" };
    if (percentage >= 70)
      return { grade: "7", word: "Above average", color: "bg-green-500 text-white" };
    if (percentage >= 60)
      return { grade: "6", word: "High Average", color: "bg-blue-600 text-white" };
    if (percentage >= 50)
      return { grade: "5", word: "Average", color: "bg-blue-500 text-white" };
    if (percentage >= 40)
      return { grade: "4", word: "Low average", color: "bg-yellow-600 text-white" };
    if (percentage >= 30)
      return { grade: "3", word: "Below average", color: "bg-orange-600 text-white" };
    if (percentage >= 20)
      return { grade: "2", word: "Well below average", color: "bg-red-600 text-white" };
    return { grade: "1", word: "Inferior", color: "bg-red-800 text-white" };
  };

  // Calculate daily average from marks
  const getDailyAvg = (marks: Ftw11sqnFlyingExaminationMark[]) => {
    const validMarks = marks
      .filter((mark) => mark.achieved_mark && parseFloat(mark.achieved_mark) > 0)
      .map((mark) => parseFloat(mark.achieved_mark || "0"));

    if (validMarks.length === 0) return 0;
    return validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length;
  };

  // Calculate totals for each cadet
  const cadetsWithTotals = semesterData.cadets.map((cadetData, index) => {
    const dailyAvg = getDailyAvg(cadetData.marks);
    const totalValue = dailyAvg;
    const inPercentage = dailyAvg; // Assuming marks are already in percentage

    return { cadetData, index, totalValue, inPercentage, dailyAvg };
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
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                SL.
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                BD/No
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Rank
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Name
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Total Marks
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Average
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                In %
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Position
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Grade
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Sign of Ins
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black">
                Remark
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider border border-black print:hidden">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {cadetsWithTotals.map(({ cadetData, index, totalValue, inPercentage, dailyAvg }) => {
              const position = positionMap[index];
              const gradeInfo = getNineScaleGrade(inPercentage);

              return (
                <tr
                  key={cadetData.cadet_details.id}
                  className="hover:bg-gray-100 transition-colors"
                >
                  <td className="px-4 py-2 text-center text-black border border-black text-sm">
                    {index + 1}
                  </td>
                  <td className="px-4 py-2 text-center text-black border border-black text-sm">
                    {cadetData.cadet_details.bdno}
                  </td>
                  <td className="px-4 py-2 text-center text-black border border-black text-sm">
                    {cadetData.cadet_details.rank?.name || "-"}
                  </td>
                  <td className="px-4 py-2 text-left text-black border border-black text-sm">
                    {cadetData.cadet_details.name}
                  </td>
                  <td className="px-4 py-2 text-center text-black border border-black text-sm font-bold">
                    {cadetData.marks.length}
                  </td>
                  <td className="px-4 py-2 text-center text-black border border-black text-sm font-bold">
                    <span
                      className={`${
                        dailyAvg >= 80
                          ? "text-green-600"
                          : dailyAvg >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {dailyAvg.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-black border border-black text-sm">
                    {inPercentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 text-center text-black border border-black text-sm font-bold">
                    {position}
                  </td>
                  <td className="px-4 py-2 text-center text-black border border-black text-sm">
                    {gradeInfo.word}
                  </td>
                  <td className="px-4 py-2 text-center text-black border border-black text-sm">
                    -
                  </td>
                  <td className="px-4 py-2 text-center text-black border border-black text-sm">
                    -
                  </td>
                  <td className="px-4 py-2 text-center text-black border border-black text-sm print:hidden">
                    <button
                      className="inline-flex justify-center items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                      title="View Details"
                      onClick={() =>
                        router.push(
                          `/ftw/11sqn/results/flying/results/cadet/${cadetData.cadet_details.id}`
                        )
                      }
                    >
                      <Icon icon="hugeicons:view" className="w-4 h-4" />
                    </button>
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
