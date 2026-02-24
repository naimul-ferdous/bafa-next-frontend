/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwDtAssessmentResultService } from "@/libs/services/ctwDtAssessmentResultService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import FullLogo from "@/components/ui/fulllogo";

const DT_ASSESSMENT_MODULE_CODE = "dt_assessment";

export default function DtAssessmentResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [moduleId, setModuleId] = useState<number | null>(null);
  const [moduleLoading, setModuleLoading] = useState(true);

  useEffect(() => {
    const fetchModuleId = async () => {
      try {
        setModuleLoading(true);
        const modulesRes = await ctwResultsModuleService.getAllModules({ per_page: 100 });
        const foundModule = modulesRes.data.find((m: any) => m.code === DT_ASSESSMENT_MODULE_CODE);
        if (foundModule) {
          setModuleId(foundModule.id);
        } else {
          setError(`Module with code ${DT_ASSESSMENT_MODULE_CODE} not found.`);
        }
      } catch (err) {
        console.error("Failed to fetch module ID:", err);
        setError("Failed to fetch module ID.");
      } finally {
        setModuleLoading(false);
      }
    };
    fetchModuleId();
  }, []);

  useEffect(() => {
    const loadResult = async () => {
      if (moduleId === null || !resultId) return;

      try {
        setLoading(true);
        const data = await ctwDtAssessmentResultService.getResult(moduleId, parseInt(resultId));
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
  }, [resultId, moduleId, moduleLoading]);

  const handlePrint = () => window.print();

  const calculateTotalMarks = () => {
    if (!result?.achieved_marks) return 0;
    return result.achieved_marks.reduce((sum: number, mark: any) => sum + parseFloat(String(mark.achieved_mark || 0)), 0);
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
            onClick={() => router.push("/ctw/results/assessment_observation/dt")}
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
          onClick={() => router.push("/ctw/results/assessment_observation/dt")}
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
            onClick={() => router.push(`/ctw/results/assessment_observation/dt/${result.id}/edit`)}
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
          <p className="font-medium text-gray-900 uppercase tracking-wider pb-2">CTW DT Assessment Observation Result Sheet</p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase text-base">Result Information</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
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
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-black px-2 py-2 text-center align-middle w-12">Ser</th>
                    <th className="border border-black px-2 py-2 text-center align-middle w-24">BD/No</th>
                    <th className="border border-black px-2 py-2 text-center align-middle w-24">Rank</th>
                    <th className="border border-black px-2 py-2 text-left align-middle min-w-[150px]">Name</th>
                    <th className="border border-black px-2 py-2 text-center align-middle text-blue-700 font-bold w-24">Achieved Mark</th>
                  </tr>
                </thead>
                <tbody>
                  {result.achieved_marks.map((mark: any, index: number) => (
                    <tr key={mark.id} className="hover:bg-gray-50 transition-colors">
                      <td className="border border-black px-2 py-2 text-center font-medium">{index + 1}</td>
                      <td className="border border-black px-2 py-2 text-center font-mono">{mark.cadet?.cadet_number || "N/A"}</td>
                      <td className="border border-black px-2 py-2 text-center">
                        {mark.cadet?.assigned_ranks?.[0]?.rank?.short_name || "Officer Cadet"}
                      </td>
                      <td className="border border-black px-2 py-2 text-blue-600 font-bold uppercase">{mark.cadet?.name || "N/A"}</td>
                      <td className="border border-black px-2 py-2 text-center text-blue-700 font-black">
                        {parseFloat(String(mark.achieved_mark || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-black">
                    <td colSpan={4} className="border border-black px-2 py-2 text-right uppercase">Total Marks</td>
                    <td className="border border-black px-2 py-2 text-center text-blue-700">{calculateTotalMarks().toFixed(2)}</td>
                  </tr>
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
