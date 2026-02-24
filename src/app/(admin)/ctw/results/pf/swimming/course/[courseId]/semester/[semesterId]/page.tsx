/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwSwimmingResultService } from "@/libs/services/ctwSwimmingResultService";
import FullLogo from "@/components/ui/fulllogo";
import type { CadetProfile } from "@/libs/types/user";
import type { CtwResultsModule, CtwResultsModuleEstimatedMark } from "@/libs/types/ctw";
import { getOrdinal } from "@/libs/utils/formatter";

const SWIMMING_MODULE_CODE = "Swimming";

export default function SwimmingCourseSemesterResultPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = parseInt(params?.courseId as string);
  const semesterId = parseInt(params?.semesterId as string);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [semesterDetails, setSemesterDetails] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [examType, setExamType] = useState<string>("");
  const [cadets, setCadets] = useState<CadetProfile[]>([]);

  const [moduleDetails, setModuleDetails] = useState<CtwResultsModule | null>(null);
  const [estimatedMark, setEstimatedMark] = useState<CtwResultsModuleEstimatedMark | null>(null);

  const loadData = useCallback(async () => {
    if (isNaN(courseId) || isNaN(semesterId)) return;
    try {
      setLoading(true);
      setError("");
      const data = await ctwSwimmingResultService.getInitialFetchData({
        module_code: SWIMMING_MODULE_CODE,
        course_id: courseId,
        semester_id: semesterId,
      });
      if (data) {
        setModuleDetails(data.module);
        setEstimatedMark(data.estimated_mark_config);
        setCourseDetails(data.course_details);
        setSemesterDetails(data.semester_details);
        setCadets(data.cadets || []);
        if (data.grouped_results && data.grouped_results.length > 0) {
          const resultGroup = data.grouped_results[0];
          setExamType(resultGroup.exam_type);
          setSubmissions(resultGroup.submissions || []);
        } else {
          setError("No results found for this course and semester");
        }
      } else {
        setError("Failed to retrieve initial data");
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("An unexpected error occurred while loading data");
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId]);

  useEffect(() => { loadData(); }, [loadData]);

  const aggregatedMarks = useMemo(() => {
    const cadetMap = new Map<number, any>();
    cadets.forEach(cadet => {
      cadetMap.set(cadet.id, { cadet, instructorMarks: {}, totalAchieved: 0, submissionCount: 0 });
    });
    submissions.forEach(sub => {
      const instructorId = sub.instructor_details?.id;
      const marks = sub.instructor_details?.marks || [];
      marks.forEach((markItem: any) => {
        const cadetId = markItem.cadet_id;
        if (cadetMap.has(cadetId)) {
          const cadetData = cadetMap.get(cadetId);
          cadetData.instructorMarks[instructorId] = markItem.mark;
          cadetData.totalAchieved += parseFloat(String(markItem.mark || 0));
          cadetData.submissionCount += 1;
        }
      });
    });
    return Array.from(cadetMap.values()).filter(item => item.submissionCount > 0);
  }, [submissions, cadets]);

  const rankedData = useMemo(() => {
    const estimatedMarkPerInst = estimatedMark?.estimated_mark_per_instructor || 0;
    const convMarkLimit = estimatedMark?.conversation_mark || 0;
    const expectedCount = moduleDetails?.instructor_count || 0;
    const isComplete = expectedCount > 0 && submissions.length >= expectedCount;
    const totalWeight = estimatedMarkPerInst * expectedCount;
    const passThreshold = convMarkLimit * 0.5;

    const withConv = aggregatedMarks.map(item => ({
      ...item,
      convertedMark: isComplete && totalWeight > 0 ? (item.totalAchieved / totalWeight) * convMarkLimit : 0,
      position: 0,
      remark: "-",
    }));

    if (isComplete) {
      withConv.sort((a, b) => b.convertedMark - a.convertedMark);
      withConv.forEach((item, idx) => {
        if (idx === 0) item.position = 1;
        else if (item.convertedMark === withConv[idx - 1].convertedMark) item.position = withConv[idx - 1].position;
        else item.position = idx + 1;
        item.remark = item.convertedMark < passThreshold ? "Failed" : "-";
      });
    }

    withConv.sort((a, b) => {
      const aNo = a.cadet?.cadet_number ?? "";
      const bNo = b.cadet?.cadet_number ?? "";
      return String(aNo).localeCompare(String(bNo), undefined, { numeric: true });
    });

    return withConv;
  }, [aggregatedMarks, estimatedMark, submissions, moduleDetails]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-center justify-center min-h-[400px]">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || aggregatedMarks.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-medium">{error || "Results not found"}</p>
          <button onClick={() => router.push("/ctw/results/pf/swimming")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold">
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const estimatedMarkPerInstructor = estimatedMark?.estimated_mark_per_instructor || 0;
  const conversationMarkLimit = estimatedMark?.conversation_mark || 0;
  const instructorCount = moduleDetails?.instructor_count || 0;
  const isComplete = instructorCount > 0 && submissions.length >= instructorCount;
  const totalWeightage = estimatedMarkPerInstructor * instructorCount;
  const instructorSlots = Array.from({ length: instructorCount }, (_, i) => i);

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      <div className="p-4 flex items-center justify-between no-print">
        <button onClick={() => router.push("/ctw/results/pf/swimming")} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />Back to List
        </button>
        <button onClick={() => window.print()} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all">
          <Icon icon="hugeicons:printer" className="w-4 h-4" />Print
        </button>
      </div>

      <div className="p-8 cv-content">
        <div className="mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
            CTW {moduleDetails?.full_name || "Swimming"} Course Result Sheet
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase text-base">Course Information</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex"><span className="w-48 text-gray-900 font-medium">Course</span><span className="mr-4">:</span><span className="text-gray-900 flex-1 font-bold">{courseDetails?.name || "N/A"}</span></div>
            <div className="flex"><span className="w-48 text-gray-900 font-medium">Semester</span><span className="mr-4">:</span><span className="text-gray-900 flex-1 font-bold">{semesterDetails?.name || "N/A"}</span></div>
            <div className="flex"><span className="w-48 text-gray-900 font-medium">Module</span><span className="mr-4">:</span><span className="text-gray-900 flex-1 font-bold">{moduleDetails?.full_name}</span></div>
            <div className="flex"><span className="w-48 text-gray-900 font-medium">Exam Type</span><span className="mr-4">:</span><span className="text-gray-900 flex-1 font-bold">{examType || "N/A"}</span></div>
            <div className="flex"><span className="w-48 text-gray-900 font-medium">Weightage (per inst)</span><span className="mr-4">:</span><span className="text-gray-900 flex-1 font-bold">{estimatedMarkPerInstructor}</span></div>
            <div className="flex"><span className="w-48 text-gray-900 font-medium">Conversion Limit</span><span className="mr-4">:</span><span className="text-gray-900 flex-1 font-bold">{conversationMarkLimit}</span></div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase text-base">Cadets Marks</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black">
              <thead>
                <tr>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle bg-gray-50">Ser</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle bg-gray-50">BD/No</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle bg-gray-50">Rank</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle bg-gray-50">Name</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle bg-gray-50">Branch</th>
                  <th colSpan={instructorCount || 1} className="border border-black px-2 py-1 text-center align-middle font-bold bg-gray-50">Instructors</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold bg-gray-50">Total<br />({totalWeightage})</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold bg-gray-50">Conv.<br />({conversationMarkLimit})</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold bg-gray-50">Position</th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold bg-gray-50">Remarks</th>
                </tr>
                <tr>
                  {instructorSlots.map(i => (
                    <th key={i} className="border border-black px-1 py-1 text-center align-middle font-bold bg-gray-50">{`Instr ${i + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rankedData.map((item, index) => (
                  <tr key={item.cadet.id} className="hover:bg-gray-50 transition-colors">
                    <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                    <td className="border border-black px-2 py-2 text-center">{item.cadet?.cadet_number || "N/A"}</td>
                    <td className="border border-black px-2 py-2 text-center">{item.cadet?.assigned_ranks?.[0]?.rank?.short_name || "-"}</td>
                    <td className="border border-black px-2 py-2 font-bold">{item.cadet?.name || "N/A"}</td>
                    <td className="border border-black px-2 py-2">{item.cadet?.assigned_branchs?.[0]?.branch?.name || "-"}</td>
                    {instructorSlots.map(i => {
                      const sub = submissions[i];
                      const instructorId = sub?.instructor_details?.id;
                      const mark = instructorId !== undefined ? item.instructorMarks[instructorId] : undefined;
                      return (
                        <td key={i} className="border border-black px-2 py-2 text-center">
                          {mark !== undefined ? parseFloat(String(mark)).toFixed(1) : "-"}
                        </td>
                      );
                    })}
                    <td className="border border-black px-2 py-2 text-center font-bold">{isComplete ? item.totalAchieved.toFixed(1) : "-"}</td>
                    <td className="border border-black px-2 py-2 text-center font-bold">{isComplete ? item.convertedMark.toFixed(2) : "-"}</td>
                    <td className="border border-black px-2 py-2 text-center">{isComplete ? getOrdinal(item.position) : "-"}</td>
                    <td className={`border border-black px-2 py-2 text-center ${item.remark === "Failed" ? "text-red-600 font-bold" : "text-gray-400"}`}>{item.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-8 text-center no-print">
          <div className="border-t border-gray-400 pt-2"><p className="font-bold text-sm uppercase">Instructor</p></div>
          <div className="border-t border-gray-400 pt-2"><p className="font-bold text-sm uppercase">Chief Instructor</p></div>
          <div className="border-t border-gray-400 pt-2"><p className="font-bold text-sm uppercase">Commandant</p></div>
        </div>

        <div className="mt-12 text-center text-[10px] text-gray-500 font-medium italic">
          <p>Generated on: {new Date().toLocaleString("en-GB")}</p>
        </div>
      </div>
    </div>
  );
}
