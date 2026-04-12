/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwOneMileResultService } from "@/libs/services/ctwOneMileResultService";
import FullLogo from "@/components/ui/fulllogo";
import type { CadetProfile } from "@/libs/types/user";
import type { CtwResultsModule, CtwResultsModuleEstimatedMark } from "@/libs/types/ctw";
import { getOrdinal } from "@/libs/utils/formatter";

const ONE_MILE_MODULE_CODE = "one_mile";

export default function OneMileCourseSemesterResultPage() {
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

      const data = await ctwOneMileResultService.getInitialFetchData({
        module_code: ONE_MILE_MODULE_CODE,
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const practiceCount = (estimatedMark as any)?.practice_count || 0;

  // Aggregate marks per cadet per instructor, including practice details
  const aggregatedMarks = useMemo(() => {
    const cadetMap = new Map<number, any>();
    const convPracticeWeight = parseFloat(String(estimatedMark?.convert_of_practice || 0));
    const convExamWeight = parseFloat(String(estimatedMark?.convert_of_exam || 0));
    const convMarkLimit = parseFloat(String(estimatedMark?.conversation_mark || 0));

    cadets.forEach(cadet => {
      cadetMap.set(cadet.id, {
        cadet,
        instructorData: {} as Record<number, {
          practices: number[];
          avg_practice: number;
          exam_mark: number;
          conv_practice: number;
          conv_exam: number;
          finalMark: number;
        }>,
        totalFinal: 0,
        submissionCount: 0,
      });
    });

    submissions.forEach(sub => {
      const instructorId = sub.instructor_details?.id;
      const marks = sub.instructor_details?.marks || [];

      marks.forEach((markItem: any) => {
        const cadetId = markItem.cadet_id;
        if (cadetMap.has(cadetId)) {
          const practices: number[] = [];
          if (markItem.details && markItem.details.length > 0) {
            markItem.details.forEach((d: any) => {
              if (d.practices_marks !== null && d.practices_marks !== undefined) {
                practices.push(parseFloat(String(d.practices_marks)));
              }
            });
          }
          const avg_practice = practices.length > 0
            ? practices.reduce((a: number, b: number) => a + b, 0) / practices.length
            : 0;
          const exam_mark = parseFloat(String(markItem.achieved_mark || markItem.mark || 0));
          const conv_practice = (avg_practice * convPracticeWeight) / 100;
          const conv_exam = (exam_mark * convExamWeight) / 100;
          let finalMark = conv_practice + conv_exam;
          if (convMarkLimit > 0 && finalMark > convMarkLimit) {
            finalMark = convMarkLimit;
          }

          const cadetData = cadetMap.get(cadetId);
          cadetData.instructorData[instructorId] = {
            practices,
            avg_practice,
            exam_mark,
            conv_practice,
            conv_exam,
            finalMark,
          };
          cadetData.totalFinal += finalMark;
          cadetData.submissionCount += 1;
        }
      });
    });

    return Array.from(cadetMap.values()).filter(item => item.submissionCount > 0);
  }, [submissions, cadets, estimatedMark]);

  // Rank cadets by average converted mark
  const rankedData = useMemo(() => {
    const convMarkLimit = parseFloat(String(estimatedMark?.conversation_mark || 0));
    const expectedCount = moduleDetails?.instructor_count || 0;
    const isComplete = expectedCount > 0 && submissions.length >= expectedCount;
    const passThreshold = convMarkLimit * 0.5;

    const withConv = aggregatedMarks.map(item => ({
      ...item,
      convertedMark: isComplete && item.submissionCount > 0
        ? item.totalFinal / item.submissionCount
        : 0,
      position: 0,
      remark: "-",
    }));

    if (isComplete) {
      withConv.sort((a, b) => b.convertedMark - a.convertedMark);
      withConv.forEach((item, idx) => {
        if (idx === 0) {
          item.position = 1;
        } else if (item.convertedMark === withConv[idx - 1].convertedMark) {
          item.position = withConv[idx - 1].position;
        } else {
          item.position = idx + 1;
        }
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

  if (error || aggregatedMarks.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-medium">{error || "Results not found"}</p>
          <button
            onClick={() => router.push("/ctw/results/pf/onemile")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const conversationMarkLimit = parseFloat(String(estimatedMark?.conversation_mark || 0));
  const estimatedMarkPerInstructor = parseFloat(String((estimatedMark as any)?.estimated_mark_per_instructor || conversationMarkLimit || 100));
  const instructorCount = moduleDetails?.instructor_count || 0;
  const isComplete = instructorCount > 0 && submissions.length >= instructorCount;
  const instructorSlots = Array.from({ length: instructorCount }, (_, i) => i);

  const hasPractices = practiceCount > 0;
  const instrColSpan = hasPractices ? practiceCount + 4 : 4;

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ctw/results/pf/onemile")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      <div className="p-8 cv-content">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
            CTW {moduleDetails?.full_name || "One Mile"} Course Result Sheet
          </p>
        </div>

        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                {/* Row 1: instructor group headers (only when multiple instructors) */}
                {instructorCount > 1 && (
                  <tr>
                    <th rowSpan={hasPractices ? 3 : 2} className="border border-black px-2 py-2 text-center align-middle">SL</th>
                    <th rowSpan={hasPractices ? 3 : 2} className="border border-black px-2 py-2 text-center align-middle whitespace-nowrap">BD No.</th>
                    <th rowSpan={hasPractices ? 3 : 2} className="border border-black px-2 py-2 text-center align-middle">Rank</th>
                    <th rowSpan={hasPractices ? 3 : 2} className="border border-black px-2 py-2 text-left align-middle">Name</th>
                    <th rowSpan={hasPractices ? 3 : 2} className="border border-black px-2 py-2 text-left align-middle">Branch</th>
                    {instructorSlots.map(i => (
                      <th key={i} colSpan={hasPractices ? practiceCount + 5 : 5} className="border border-black px-2 py-1 text-center align-middle font-bold">
                        {`Instr ${i + 1}`}
                      </th>
                    ))}
                    <th rowSpan={hasPractices ? 3 : 2} className="border border-black px-2 py-2 text-center align-middle font-bold whitespace-nowrap">
                      Conv<br />Mark
                    </th>
                    <th rowSpan={hasPractices ? 3 : 2} className="border border-black px-2 py-2 text-center align-middle font-bold">Position</th>
                    <th rowSpan={hasPractices ? 3 : 2} className="border border-black px-2 py-2 text-center align-middle font-bold">Remarks</th>
                  </tr>
                )}

                {/* Row 1 (single instr) / Row 2 (multi instr): detail column headers */}
                <tr>
                  {instructorCount === 1 && (
                    <>
                      <th rowSpan={hasPractices ? 2 : 1} className="border border-black px-2 py-2 text-center align-middle">SL</th>
                      <th rowSpan={hasPractices ? 2 : 1} className="border border-black px-2 py-2 text-center align-middle whitespace-nowrap">BD No.</th>
                      <th rowSpan={hasPractices ? 2 : 1} className="border border-black px-2 py-2 text-center align-middle">Rank</th>
                      <th rowSpan={hasPractices ? 2 : 1} className="border border-black px-2 py-2 text-left align-middle">Name</th>
                      <th rowSpan={hasPractices ? 2 : 1} className="border border-black px-2 py-2 text-left align-middle">Branch</th>
                    </>
                  )}
                  {instructorSlots.map(i => (
                    <React.Fragment key={i}>
                      {hasPractices ? (
                        <th colSpan={practiceCount} className="border border-black px-2 py-1 text-center align-middle font-semibold text-xs">
                          Practices
                        </th>
                      ) : null}
                      <th rowSpan={hasPractices ? 2 : 1} className="border border-black px-2 py-1 text-center align-middle whitespace-nowrap text-xs font-semibold">
                        Avg.<br />Prac
                      </th>
                      <th rowSpan={hasPractices ? 2 : 1} className="border border-black px-2 py-1 text-center align-middle whitespace-nowrap text-xs font-semibold">
                        Exam
                      </th>
                      <th rowSpan={hasPractices ? 2 : 1} className="border border-black px-2 py-1 text-center align-middle whitespace-nowrap text-xs font-semibold">
                        Prac<br />({estimatedMark?.convert_of_practice || 0}%)
                      </th>
                      <th rowSpan={hasPractices ? 2 : 1} className="border border-black px-2 py-1 text-center align-middle whitespace-nowrap text-xs font-semibold">
                        Exam<br />({estimatedMark?.convert_of_exam || 0}%)
                      </th>
                      <th rowSpan={hasPractices ? 2 : 1} className="border border-black px-2 py-1 text-center align-middle text-xs font-semibold">
                        Total
                      </th>
                      <th rowSpan={hasPractices ? 2 : 1} className="border border-black px-2 py-1 text-center align-middle text-xs font-semibold whitespace-nowrap">
                        Conv<br />({conversationMarkLimit})
                      </th>
                    </React.Fragment>
                  ))}
                  {instructorCount === 1 && (
                    <>
                      <th rowSpan={hasPractices ? 2 : 1} className="border border-black px-2 py-2 text-center align-middle font-bold">Position</th>
                      <th rowSpan={hasPractices ? 2 : 1} className="border border-black px-2 py-2 text-center align-middle font-bold">Remarks</th>
                    </>
                  )}
                </tr>

                {/* Last row: individual P1, P2, P3... columns (only if hasPractices) */}
                {hasPractices && (
                  <tr>
                    {instructorSlots.map(i => (
                      <React.Fragment key={i}>
                        {Array.from({ length: practiceCount }, (_, p) => (
                          <th key={p} className="border border-black px-1 py-1 text-center align-middle text-xs font-normal">
                            P{p + 1}
                          </th>
                        ))}
                        {/* Avg.Prac, Exam, Prac%, Exam%, Total already have rowSpan=2 */}
                      </React.Fragment>
                    ))}
                    {instructorCount > 1 && (
                      /* Avg, Position, Remarks already have rowSpan=3 */
                      null
                    )}
                  </tr>
                )}
              </thead>
              <tbody>
                {rankedData.map((item, index) => (
                  <tr key={item.cadet.id} className="hover:bg-gray-50 transition-colors">
                    <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                    <td className="border border-black px-2 py-2 text-center">{item.cadet?.cadet_number || "N/A"}</td>
                    <td className="border border-black px-2 py-2 text-center">
                      {item.cadet?.assigned_ranks?.[0]?.rank?.short_name || "-"}
                    </td>
                    <td className="border border-black px-2 py-2">{item.cadet?.name || "N/A"}</td>
                    <td className="border border-black px-2 py-2">
                      {item.cadet?.assigned_branchs?.[0]?.branch?.name || "-"}
                    </td>
                    {instructorSlots.map(i => {
                      const sub = submissions[i];
                      const instructorId = sub?.instructor_details?.id;
                      const instrData = instructorId !== undefined ? item.instructorData[instructorId] : undefined;
                      return (
                        <React.Fragment key={i}>
                          {hasPractices && Array.from({ length: practiceCount }, (_, p) => (
                            <td key={p} className="border border-black px-2 py-2 text-center">
                              {instrData?.practices[p] !== undefined
                                ? instrData.practices[p].toFixed(2)
                                : "-"}
                            </td>
                          ))}
                          <td className="border border-black px-2 py-2 text-center">
                            {instrData !== undefined ? instrData.avg_practice.toFixed(2) : "-"}
                          </td>
                          <td className="border border-black px-2 py-2 text-center">
                            {instrData !== undefined ? instrData.exam_mark.toFixed(2) : "-"}
                          </td>
                          <td className="border border-black px-2 py-2 text-center font-semibold">
                            {instrData !== undefined ? instrData.conv_practice.toFixed(2) : "-"}
                          </td>
                          <td className="border border-black px-2 py-2 text-center font-semibold">
                            {instrData !== undefined ? instrData.conv_exam.toFixed(2) : "-"}
                          </td>
                          <td className="border border-black px-2 py-2 text-center font-bold">
                            {instrData !== undefined ? instrData.finalMark.toFixed(2) : "-"}
                          </td>
                          <td className="border border-black px-2 py-2 text-center font-bold text-blue-700">
                            {instrData !== undefined && estimatedMarkPerInstructor > 0
                              ? ((instrData.finalMark * conversationMarkLimit) / estimatedMarkPerInstructor).toFixed(2)
                              : "-"}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    {instructorCount > 1 && (
                      <td className="border border-black px-2 py-2 text-center font-bold text-blue-700">
                        {isComplete ? item.convertedMark.toFixed(2) : "-"}
                      </td>
                    )}
                    <td className="border border-black px-2 py-2 text-center">
                      {isComplete ? getOrdinal(item.position) : "-"}
                    </td>
                    <td className={`border border-black px-2 py-2 text-center ${item.remark === "Failed" ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                      {item.remark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-8 text-center no-print">
          <div className="border-t-2 border-black pt-2">
            <p className="font-bold text-sm uppercase tracking-widest">Instructor</p>
          </div>
          <div className="border-t-2 border-black pt-2">
            <p className="font-bold text-sm uppercase tracking-widest">Chief Instructor</p>
          </div>
          <div className="border-t-2 border-black pt-2">
            <p className="font-bold text-sm uppercase tracking-widest">Commandant</p>
          </div>
        </div>

        <div className="mt-12 text-center text-[10px] text-gray-500 font-medium italic">
          <p>Generated on: {new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>
    </div>
  );
}
