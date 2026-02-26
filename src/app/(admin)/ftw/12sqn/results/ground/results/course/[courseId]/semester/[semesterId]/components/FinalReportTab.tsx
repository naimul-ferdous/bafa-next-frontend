"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { Ftw12sqnGroundExaminationMark } from "@/libs/types/ftw12sqnExamination";

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
  marks: Ftw12sqnGroundExaminationMark[];
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

  const getGradeInfo = (percentage: number) => {
    if (percentage >= 80) return { word: "Distinction", color: "text-green-700" };
    if (percentage >= 60) return { word: "First Class", color: "text-blue-600" };
    if (percentage >= 40) return { word: "Pass", color: "text-yellow-600" };
    return { word: "Fail", color: "text-red-600" };
  };

  // Sort cadets by average mark for positions
  const sortedCadets = [...semesterData.cadets].sort((a, b) => b.cadet_details.average_mark - a.cadet_details.average_mark);
  const positionMap = new Map<number, number>();
  sortedCadets.forEach((cadet, index) => {
    positionMap.set(cadet.cadet_details.id, index + 1);
  });

  return (
    <div className="bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-center font-bold text-black border border-black uppercase w-16">SL.</th>
              <th className="px-4 py-3 text-center font-bold text-black border border-black uppercase w-32">BD NO</th>
              <th className="px-4 py-3 text-center font-bold text-black border border-black uppercase w-32">Rank</th>
              <th className="px-4 py-3 text-left font-bold text-black border border-black uppercase">Name</th>
              <th className="px-4 py-3 text-center font-bold text-black border border-black uppercase w-32">Total Exams</th>
              <th className="px-4 py-3 text-center font-bold text-black border border-black uppercase w-32">Avg Mark</th>
              <th className="px-4 py-3 text-center font-bold text-black border border-black uppercase w-32">Position</th>
              <th className="px-4 py-3 text-center font-bold text-black border border-black uppercase w-32">Grade</th>
              <th className="px-4 py-3 text-center font-bold text-black border border-black uppercase w-32">Remark</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {semesterData.cadets.map((cadet, index) => {
              const grade = getGradeInfo(cadet.cadet_details.average_mark);
              const position = positionMap.get(cadet.cadet_details.id);

              return (
                <tr 
                  key={cadet.cadet_details.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/ftw/12sqn/results/ground/results/course/${courseId}/semester/${semesterId}/cadet/${cadet.cadet_details.id}`)}
                >
                  <td className="px-4 py-3 text-center border border-black">{index + 1}</td>
                  <td className="px-4 py-3 text-center border border-black">{cadet.cadet_details.bdno}</td>
                  <td className="px-4 py-3 text-center border border-black">
                    {cadet.cadet_details.rank?.name || "Officer Cadet"}
                  </td>
                  <td className="px-4 py-3 text-left border border-black font-medium">{cadet.cadet_details.name}</td>
                  <td className="px-4 py-3 text-center border border-black">{cadet.cadet_details.total_examinations}</td>
                  <td className="px-4 py-3 text-center border border-black font-bold text-blue-700">
                    {cadet.cadet_details.average_mark.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center border border-black font-bold">{position}</td>
                  <td className={`px-4 py-3 text-center border border-black font-medium ${grade.color}`}>
                    {grade.word}
                  </td>
                  <td className="px-4 py-3 text-center border border-black">-</td>
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
