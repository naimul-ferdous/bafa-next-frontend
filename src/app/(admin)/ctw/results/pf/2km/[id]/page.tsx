/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctw2kmResultService } from "@/libs/services/ctw2kmResultService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import FullLogo from "@/components/ui/fulllogo";
import type { Ctw2kmResult } from "@/libs/types/ctw2km";

const TWO_KM_MODULE_CODE = "2_km";

export default function TwoKmResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [result, setResult] = useState<Ctw2kmResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [twoKmModuleId, setTwoKmModuleId] = useState<number | null>(null);
  const [twoKmModule, setTwoKmModule] = useState<any>(null);
  const [moduleLoading, setModuleLoading] = useState(true);
  const [estimatedMarks, setEstimatedMarks] = useState<any[]>([]);
  const [loadingEstimatedMarks, setLoadingEstimatedMarks] = useState(false);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        setModuleLoading(true);
        const modulesRes = await ctwResultsModuleService.getAllModules({ per_page: 100 });
        const ctwModule = modulesRes.data.find((m: any) => m.code === TWO_KM_MODULE_CODE);
        if (ctwModule) {
          setTwoKmModuleId(ctwModule.id);
          setTwoKmModule(ctwModule);
        } else {
          console.error(`Module with code ${TWO_KM_MODULE_CODE} not found.`);
          setError(`Module with code ${TWO_KM_MODULE_CODE} not found.`);
        }
      } catch (err) {
        console.error("Failed to fetch module:", err);
        setError("Failed to fetch module information.");
      } finally {
        setModuleLoading(false);
      }
    };
    fetchModule();
  }, []);

  useEffect(() => {
    const loadEstimatedMarks = async () => {
      if (!twoKmModuleId || !result?.course_id || !result?.semester_id) {
        return;
      }

      try {
        setLoadingEstimatedMarks(true);
        const response = await ctwResultsModuleService.getEstimatedMarks(twoKmModuleId, {
          course_id: result.course_id,
          semester_id: result.semester_id,
        });
        setEstimatedMarks(response);
      } catch (err) {
        console.error("Failed to load estimated marks:", err);
      } finally {
        setLoadingEstimatedMarks(false);
      }
    };

    if (result) {
      loadEstimatedMarks();
    }
  }, [twoKmModuleId, result?.course_id, result?.semester_id]);

  const getEstimatedMarkInfo = () => {
    if (!result?.exam_type_id) return null;
    return estimatedMarks.find((em: any) => em.exam_type_id === result.exam_type_id);
  };

  useEffect(() => {
    const loadResult = async () => {
      if (twoKmModuleId === null || resultId === undefined) {
        return;
      }

      try {
        setLoading(true);
        const data = await ctw2kmResultService.getResult(twoKmModuleId, parseInt(resultId));
        if (data) {
          setResult(data);
        } else {
          setError("Result not found");
        }
      } catch (err) {
        console.error("Failed to load result:", err);
        setError("Failed to load result data");
      } finally {
        setLoading(false);
      }
    };

    if (!moduleLoading && resultId) {
      loadResult();
    }
  }, [resultId, twoKmModuleId, moduleLoading]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || moduleLoading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "Result not found"}</p>
          <button
            onClick={() => router.push("/ctw/results/pf/2km")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ctw/results/pf/2km")}
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
          <button
            onClick={() => router.push(`/ctw/results/pf/2km/${result.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Result
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
            CTW 2KM Result Sheet
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Result Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Course</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.course?.name || "N/A"} ({result.course?.code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Semester</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.semester?.name || "N/A"} ({result.semester?.code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Program</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.program?.name || "N/A"} ({result.program?.code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Branch</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.branch?.name || "N/A"} ({result.branch?.code || "N/A"})</span>
            </div>
            {result.group && (
              <div className="flex">
                <span className="w-48 text-gray-900 font-medium">Group</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1">{result.group.name} ({result.group.code})</span>
              </div>
            )}
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Exam Type</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.exam_type?.name || "N/A"}</span>
            </div>
            {result.remarks && (
              <div className="flex col-span-2">
                <span className="w-48 text-gray-900 font-medium">Remarks</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1">{result.remarks}</span>
              </div>
            )}
          </div>
        </div>

        {result.achieved_marks && result.achieved_marks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
              Cadets Marks
            </h2>

            <div className="overflow-x-auto">
              {(() => {
                const convPracticeWeight = twoKmModule ? parseFloat(twoKmModule.convert_of_practice || 0) : 0;
                const convExamWeight = twoKmModule ? parseFloat(twoKmModule.convert_of_exam || 0) : 0;
                const estimatedMarkInfo = getEstimatedMarkInfo();
                const maxTestMark = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.estimated_mark_per_instructor || estimatedMarkInfo.mark || 0) : 0;
                const conversationMark = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.conversation_mark || 0) : 0;

                return (
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr>
                        <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>SL</th>
                        <th className="border border-black px-2 py-2 text-center align-middle whitespace-nowrap" rowSpan={2}>BD No.</th>
                        <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>Rank</th>
                        <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={2}>Name</th>
                        <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={2}>Branch</th>
                        {twoKmModule?.practice_count > 0 && (
                          <th className="border border-black px-2 py-2 text-center align-middle" colSpan={twoKmModule.practice_count}>Practices</th>
                        )}
                        <th className="border border-black px-2 py-2 text-center align-middle whitespace-nowrap" rowSpan={2}>Avg. <br /> Prac</th>
                        <th className="border border-black px-2 py-2 text-center align-middle whitespace-nowrap" rowSpan={2}>Exam <br /> {maxTestMark > 0 ? `(${maxTestMark})` : ""}</th>
                        <th className="border border-black px-2 py-2 text-center align-middle whitespace-nowrap" rowSpan={2}>Prac <br /> ({convPracticeWeight}%)</th>
                        <th className="border border-black px-2 py-2 text-center align-middle whitespace-nowrap" rowSpan={2}>Exam <br /> ({convExamWeight}%)</th>
                        <th className="border border-black px-2 py-2 text-center align-middle text-blue-700" rowSpan={2}>Total</th>
                        <th className="border border-black px-2 py-2 text-center align-middle text-blue-700" rowSpan={2}>Conv</th>
                      </tr>
                      {twoKmModule?.practice_count > 0 && (
                        <tr>
                          {Array.from({ length: twoKmModule.practice_count }, (_, i) => i + 1).map(p => (
                            <th key={p} className="border border-black px-2 py-2 text-center text-xs">P{p}</th>
                          ))}
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {result.achieved_marks.map((mark, index) => {
                        const practices: number[] = [];
                        let practicesTotal = 0;
                        let practicesCount = 0;

                        if (mark.details) {
                          mark.details.forEach(d => {
                            if (d.practices_marks !== null && d.practices_marks !== undefined) {
                              const practiceVal = parseFloat(String(d.practices_marks));
                              practices.push(practiceVal);
                              practicesTotal += practiceVal;
                              practicesCount++;
                            }
                          });
                        }

                        const avg_practice = practicesCount > 0 ? practicesTotal / practicesCount : 0;
                        const test_mark = parseFloat(String(mark.achieved_mark || 0));

                        const conv_practice = (avg_practice * convPracticeWeight) / 100;
                        const conv_exam = (test_mark * convExamWeight) / 100;
                        let finalMark = conv_practice + conv_exam;

                        if (conversationMark > 0 && finalMark > conversationMark) {
                          finalMark = conversationMark;
                        }

                        return (
                          <tr key={mark.id}>
                            <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                            <td className="border border-black px-2 py-2 text-center">{mark.cadet?.bd_no || mark.cadet?.cadet_number || "N/A"}</td>
                            <td className="border border-black px-2 py-2 text-center">
                              {mark.cadet?.assigned_ranks?.find(ar => ar.rank)?.rank?.short_name ||
                                mark.cadet?.assigned_ranks?.find(ar => ar.rank)?.rank?.name ||
                                "-"}
                            </td>
                            <td className="border border-black px-2 py-2 font-medium">{mark.cadet?.name || "N/A"}</td>
                            <td className="border border-black px-2 py-2">{mark.cadet?.assigned_branchs?.find(br => br.branch)?.branch?.name || "N/A"}</td>
                            {twoKmModule?.practice_count > 0 && (
                              Array.from({ length: twoKmModule.practice_count }, (_, i) => (
                                <td key={i} className="border border-black px-2 py-2 text-center">
                                  {practices[i] !== undefined ? practices[i].toFixed(2) : "-"}
                                </td>
                              ))
                            )}
                            <td className="border border-black px-2 py-2 text-center">{avg_practice.toFixed(2)}</td>
                            <td className="border border-black px-2 py-2 text-center">{test_mark.toFixed(2)}</td>
                            <td className="border border-black px-2 py-2 text-center font-semibold">{conv_practice.toFixed(2)}</td>
                            <td className="border border-black px-2 py-2 text-center font-semibold">{conv_exam.toFixed(2)}</td>
                            <td className="border border-black px-2 py-2 text-center text-blue-700 font-bold">
                              {finalMark.toFixed(2)}
                            </td>
                            <td className="border border-black px-2 py-2 text-center text-blue-700 font-bold">
                              {finalMark / conversationMark > 0 ? ((finalMark * conversationMark) / maxTestMark).toFixed(2) : "0.00"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            System Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className={`flex-1 ${result.is_active ? "text-green-600" : "text-red-600"}`}>
                {result.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created By</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{result.creator?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created At</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {result.created_at ? new Date(result.created_at).toLocaleString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Last Updated</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {result.updated_at ? new Date(result.updated_at).toLocaleString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}
