/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwGstoAssessmentResultService } from "@/libs/services/ctwGstoAssessmentResultService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import { ctwDtAssessmentResultService } from "@/libs/services/ctwDtAssessmentResultService";
import FullLogo from "@/components/ui/fulllogo";
import { getOrdinal } from "@/libs/utils/formatter";

const GSTO_ASSESSMENT_MODULE_CODE = "gsto_assessment";

export default function GstoAssessmentResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [estimatedMarks, setEstimatedMarks] = useState<any[]>([]);
  const [generatedCadetMarks, setGeneratedCadetMarks] = useState<Map<number, {
    dt_achieved: number; pf_achieved: number; total_achieved: number;
    avg_achieved: number; dt_converted: number; pf_converted: number; combined_converted: number;
  }>>(new Map());
  const [generatedConfig, setGeneratedConfig] = useState({ dt_conversation_mark: 0, pf_conversation_mark: 0 });

  useEffect(() => {
    if (!resultId) return;
    let cancelled = false;

    const loadAll = async () => {
      try {
        setLoading(true);

        // Step 1: Get module ID
        const modulesRes = await ctwResultsModuleService.getAllModules({ per_page: 100 });
        if (cancelled) return;
        const foundModule = modulesRes.data.find((m: any) => m.code === GSTO_ASSESSMENT_MODULE_CODE);
        if (!foundModule) { setError(`Module '${GSTO_ASSESSMENT_MODULE_CODE}' not found.`); return; }
        const moduleId = foundModule.id;

        // Step 2: Get result (needs moduleId)
        const data = await ctwGstoAssessmentResultService.getResult(moduleId, parseInt(resultId));
        if (cancelled) return;
        if (!data) { setError("Result not found"); return; }

        // Step 3: Fetch estimated marks + DT/PF marks in parallel (need course_id, semester_id)
        const [estimatedRes, dtPfRes] = await Promise.all([
          ctwResultsModuleService.getEstimatedMarks(moduleId, {
            course_id: data.course_id,
            semester_id: data.semester_id,
          }),
          ctwDtAssessmentResultService.getAssessmentObservationDtPf({
            course_id: data.course_id,
            semester_id: data.semester_id,
          }),
        ]);
        if (cancelled) return;

        const marksMap = new Map<number, any>();
        dtPfRes.data.forEach((row: any) => marksMap.set(row.cadet_id, row));

        setResult(data);
        setEstimatedMarks(estimatedRes);
        setGeneratedCadetMarks(marksMap);
        setGeneratedConfig({
          dt_conversation_mark: dtPfRes.dt_conversation_mark || 0,
          pf_conversation_mark: dtPfRes.pf_conversation_mark || 0,
        });
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load data:", err);
          setError("Failed to load result data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAll();
    return () => { cancelled = true; };
  }, [resultId]);

  const handlePrint = () => window.print();

  const selectedEM = estimatedMarks.find((em: any) => em.exam_type_id === result?.exam_type_id);
  const detailsTotal = selectedEM?.details?.reduce((sum: number, d: any) => sum + parseFloat(d.male_marks || 0), 0) ?? 0;
  const ncoTotal = generatedConfig.dt_conversation_mark + generatedConfig.pf_conversation_mark;
  const maxTotal = detailsTotal + ncoTotal;
  const passThreshold = maxTotal * 0.5;

  // Pre-compute position for each cadet based on Total OA (descending), ties share same rank
  const positionMap = useMemo(() => {
    if (!result?.achieved_marks?.length) return new Map<number, number>();
    const totals = result.achieved_marks.map((mark: any) => ({
      cadet_id: mark.cadet_id,
      totalOA: parseFloat(String(mark.achieved_mark || 0)) + (generatedCadetMarks.get(mark.cadet_id)?.combined_converted || 0),
    }));
    const sorted = [...totals].sort((a, b) => b.totalOA - a.totalOA);
    const map = new Map<number, number>();
    sorted.forEach((item, idx) => {
      if (idx === 0) {
        map.set(item.cadet_id, 1);
      } else if (item.totalOA === sorted[idx - 1].totalOA) {
        map.set(item.cadet_id, map.get(sorted[idx - 1].cadet_id)!);
      } else {
        map.set(item.cadet_id, idx + 1);
      }
    });
    return map;
  }, [result?.achieved_marks, generatedCadetMarks]);

  if (loading) {
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
            onClick={() => router.push("/ctw/results/assessment_observation/gsto")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-bold"
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
          onClick={() => router.push("/ctw/results/assessment_observation/gsto")}
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
          <button
            onClick={() => router.push(`/ctw/results/assessment_observation/gsto/${result.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold transition-all"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Result
          </button>
        </div>
      </div>

      <div className="p-8 cv-content">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <p className="font-medium text-gray-900 uppercase tracking-wider pb-2">CTW GSTO Assessment Observation Result Sheet</p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase text-base">Result Information</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Course</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold">{result.course?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Semester</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold">{result.semester?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Exam Type</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold">{result.exam_type?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Instructor</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold">{result.instructor?.name || "N/A"}</span>
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
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase text-base">Cadets Marks</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr>
                    <th className="border border-black px-3 py-2 text-center" >Sl</th>
                    <th className="border border-black px-3 py-2 text-center" >BD No.</th>
                    <th className="border border-black px-3 py-2 text-center" >Rank</th>
                    <th className="border border-black px-3 py-2 text-left" >Name</th>
                    <th className="border border-black px-3 py-2 text-left" >Branch</th>
                    {selectedEM?.details?.map((d: any) => (
                      <th
                        key={d.id}
                        className="border border-black px-2 py-2 text-start"
                        style={{ minWidth: '40px', maxWidth: '100px' }}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className="font-semibold"
                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '150px' }}
                          >
                            {d.name} - {d.male_marks}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="border border-black px-2 py-2 text-start" style={{ minWidth: '40px', maxWidth: '100px' }} >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '150px' }}>
                          Total - {detailsTotal}
                        </span>
                      </div>
                    </th>
                    <th className="border border-black px-2 py-2 text-start" style={{ minWidth: '40px', maxWidth: '100px' }} >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '150px' }}>
                          NCO Instr Assessment - {ncoTotal}
                        </span>
                      </div>
                    </th>
                    <th className="border border-black px-3 py-2 text-center">Total OA</th>
                    <th className="border border-black px-3 py-2 text-center">Position</th>
                    <th className="border border-black px-3 py-2 text-center">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {result.achieved_marks.map((mark: any, index: number) => {
                    const genData = generatedCadetMarks.get(mark.cadet_id);
                    const combinedConverted = genData?.combined_converted || 0;
                    const achievedMark = parseFloat(String(mark.achieved_mark || 0));
                    const totalOA = achievedMark + combinedConverted;
                    const position = positionMap.get(mark.cadet_id) || 0;
                    const remark = totalOA < passThreshold ? "Failed" : "-";
                    const marksBreakdown: Record<number, number> = {};
                    (mark.details || []).forEach((d: any) => {
                      if (d.ctw_results_module_estimated_marks_details_id) {
                        marksBreakdown[d.ctw_results_module_estimated_marks_details_id] = parseFloat(d.marks || 0);
                      }
                    });

                    return (
                      <tr key={mark.id} className="hover:bg-gray-50">
                        <td className="border border-black px-3 py-2 text-center font-medium">{index + 1}</td>
                        <td className="border border-black px-3 py-2 text-center font-mono">{mark.cadet?.cadet_number || "N/A"}</td>
                        <td className="border border-black px-3 py-2 text-center">
                          {mark.cadet?.assigned_ranks?.[0]?.rank?.short_name || "Officer Cadet"}
                        </td>
                        <td className="border border-black px-3 py-2 font-medium">{mark.cadet?.name || "N/A"}</td>
                        <td className="border border-black px-3 py-2">{mark.cadet?.assigned_branchs?.[0]?.branch?.name || "N/A"}</td>

                        {selectedEM?.details?.map((d: any) => (
                          <td key={d.id} className="border border-black px-2 py-1 text-center" style={{ minWidth: '40px', maxWidth: '100px' }}>
                            {d.is_generated
                              ? (((genData?.avg_achieved || 0) / (parseFloat(selectedEM?.conversation_mark) || 1)) * (parseFloat(d.male_marks) || 0)).toFixed(2)
                              : (marksBreakdown[d.id] || 0).toFixed(2)
                            }
                          </td>
                        ))}

                        <td className="border border-black px-3 py-2 text-center font-bold">{achievedMark.toFixed(2)}</td>
                        <td className="border border-black px-3 py-2 text-center font-bold">{combinedConverted.toFixed(2)}</td>
                        <td className="border border-black px-3 py-2 text-center font-bold">{totalOA.toFixed(2)}</td>
                        <td className="border border-black px-3 py-2 text-center">{getOrdinal(position)}</td>
                        <td className={`border border-black px-3 py-2 text-center font-medium ${remark === "Failed" ? "text-red-600" : "text-gray-400"}`}>
                          {remark}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-12 text-center text-[10px] text-gray-500 font-medium italic">
          <p>Generated on: {new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>
    </div>
  );
}
