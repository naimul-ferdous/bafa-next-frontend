"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ftw11sqnFlyingExaminationMarkService } from "@/libs/services/ftw11sqnFlyingExaminationMarkService";
import FullLogo from "@/components/ui/fulllogo";
import type { Ftw11sqnFlyingExaminationMark } from "@/libs/types/ftw11sqnExamination";
import { Icon } from "@iconify/react";

const formatDate = (date?: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

export default function ViewFtw11sqnFlyingExaminationMarkPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [loading, setLoading] = useState(true);
  const [mark, setMark] = useState<Ftw11sqnFlyingExaminationMark | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchMark = async () => {
      try {
        setLoading(true);
        const data = await ftw11sqnFlyingExaminationMarkService.getMark(id);
        if (data) {
          setMark(data);
        } else {
          setError("Examination mark not found");
        }
      } catch {
        setError("Failed to fetch examination mark");
      } finally {
        setLoading(false);
      }
    };
    fetchMark();
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || !mark) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "Result not found"}</p>
          <button
            onClick={() => router.push("/ftw/11sqn/results/flying/results")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const phaseTypeName = mark.phaseType?.type_name || (mark as unknown as { phase_type?: { type_name?: string } }).phase_type?.type_name || "—";
  const examTypeName = mark.examType?.name || (mark as unknown as { exam_type?: { name?: string } }).exam_type?.name || "—";

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Action Buttons */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => history.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* CV Content */}
      <div className="p-8 cv-content">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
            FTW 11SQN Flying Examination Result Sheet
          </p>
        </div>

        {/* Meta Info */}
        <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700 w-28">Course</span>
            <span className="text-gray-900">: {mark.course?.name || "—"} {mark.course?.code ? `(${mark.course.code})` : ""}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700 w-28">Semester</span>
            <span className="text-gray-900">: {mark.semester?.name || "—"} {mark.semester?.code ? `(${mark.semester.code})` : ""}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700 w-28">Mission</span>
            <span className="text-gray-900">: {mark.syllabus?.phase_full_name || mark.syllabus?.phase_shortname || "—"}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700 w-28">Exercise</span>
            <span className="text-gray-900">: {mark.exercise?.exercise_name || "—"}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700 w-28">Phase Type</span>
            <span className="text-gray-900">: {phaseTypeName}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700 w-28">Exam Type</span>
            <span className="text-gray-900">: {examTypeName}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700 w-28">Instructor</span>
            <span className="text-gray-900">: {mark.instructor?.name || "—"}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700 w-28">Date</span>
            <span className="text-gray-900">: {formatDate(mark.participate_date)}</span>
          </div>
        </div>

        {/* Mark Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr>
                <th className="border border-black px-3 py-2 text-center align-middle">Ser</th>
                <th className="border border-black px-3 py-2 text-center align-middle">BD/No</th>
                <th className="border border-black px-3 py-2 text-center align-middle">Rank</th>
                <th className="border border-black px-3 py-2 text-center align-middle">Name</th>
                <th className="border border-black px-3 py-2 text-center align-middle">Present</th>
                <th className="border border-black px-3 py-2 text-center align-middle">Achieved Mark</th>
                <th className="border border-black px-3 py-2 text-center align-middle">Achieved Time</th>
                <th className="border border-black px-3 py-2 text-center align-middle">Remark</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-3 py-2 text-center">1</td>
                <td className="border border-black px-3 py-2 text-center font-mono font-bold">
                  {mark.cadet?.bdno || mark.cadet?.bd_no || mark.cadet?.cadet_number || "—"}
                </td>
                <td className="border border-black px-3 py-2 text-center">
                  {(mark.cadet as unknown as { rank?: { name?: string } })?.rank?.name || "Officer Cadet"}
                </td>
                <td className="border border-black px-3 py-2 font-medium">{mark.cadet?.name || "—"}</td>
                <td className="border border-black px-3 py-2 text-center">
                  {mark.is_present ? (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">Present</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">Absent</span>
                  )}
                </td>
                <td className="border border-black px-3 py-2 text-center font-bold text-blue-700">
                  {mark.is_present ? (mark.achieved_mark || "—") : "—"}
                </td>
                <td className="border border-black px-3 py-2 text-center">
                  {mark.is_present ? (mark.achieved_time || "—") : "—"}
                </td>
                <td className="border border-black px-3 py-2">
                  {!mark.is_present && mark.absent_reason
                    ? <span className="text-red-600">{mark.absent_reason}</span>
                    : mark.remark || "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}
