/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwDrillResultService } from "@/libs/services/ctwDrillResultService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import FullLogo from "@/components/ui/fulllogo";
import type { CtwDrillResult } from "@/libs/types/ctwDrill";

const FIRING_MODULE_CODE = "firing";

export default function FiringResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [result, setResult] = useState<CtwDrillResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New state for module ID and its loading state
  const [firingModuleId, setFiringModuleId] = useState<number | null>(null);
  const [moduleLoading, setModuleLoading] = useState(true);

  // Fetch firingModuleId
  useEffect(() => {
    const fetchModuleId = async () => {
      try {
        setModuleLoading(true);
        const modulesRes = await ctwResultsModuleService.getAllModules({ per_page: 100 });
        const firingModule = modulesRes.data.find((m: any) => m.code === FIRING_MODULE_CODE);
        if (firingModule) {
          setFiringModuleId(firingModule.id);
        } else {
          console.error(`Module with code ${FIRING_MODULE_CODE} not found.`);
          setError(`Module with code ${FIRING_MODULE_CODE} not found.`);
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
      if (firingModuleId === null || resultId === undefined) {
        return; // Don't load until module ID is fetched and resultId is available
      }

      try {
        setLoading(true);
        const data = await ctwDrillResultService.getResult(firingModuleId, parseInt(resultId)); // Pass module ID
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
  }, [resultId, firingModuleId, moduleLoading]); // Add firingModuleId and moduleLoading to dependencies

  const handlePrint = () => {
    window.print();
  };

  // Calculate total marks
  const calculateTotalMarks = () => {
    if (!result?.achieved_marks) return 0;
    return result.achieved_marks.reduce((sum, mark) => sum + parseFloat(String(mark.achieved_mark || 0)), 0);
  };

  if (loading || moduleLoading) { // Update loading condition
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
            onClick={() => router.push("/ctw/results/dt/firing")}
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
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ctw/results/dt/firing")}
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
            onClick={() => router.push(`/ctw/results/dt/firing/${result.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Result
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 cv-content">
        {/* Header with Logo */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
            CTW Firing Result Sheet
          </p>
        </div>

        {/* Result Information */}
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

        {/* Cadets Marks Table */}
        {result.achieved_marks && result.achieved_marks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
              Cadets Marks
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-2 text-center align-middle">Ser</th>
                    <th className="border border-black px-2 py-2 text-center align-middle">BD/No</th>
                    <th className="border border-black px-2 py-2 text-center align-middle">Rank</th>
                    <th className="border border-black px-2 py-2 text-center align-middle">Name</th>
                    <th className="border border-black px-2 py-2 text-center align-middle">Branch</th>
                    <th className="border border-black px-2 py-2 text-center align-middle">Instructor</th>
                    <th className="border border-black px-2 py-2 text-center align-middle text-blue-700">Achieved Mark</th>
                  </tr>
                </thead>
                <tbody>
                  {result.achieved_marks.map((mark, index) => (
                    <tr key={mark.id}>
                      <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                      <td className="border border-black px-2 py-2 text-center">{mark.cadet?.bd_no || mark.cadet?.cadet_number || "N/A"}</td>
                      <td className="border border-black px-2 py-2 text-center">
                        {mark.cadet?.assigned_ranks?.find(ar => ar.rank)?.rank?.short_name ||
                         mark.cadet?.assigned_ranks?.find(ar => ar.rank)?.rank?.name ||
                         "Officer Cadet"}
                      </td>
                      <td className="border border-black px-2 py-2 text-blue-600 font-medium">{mark.cadet?.name || "N/A"}</td>
                      <td className="border border-black px-2 py-2 text-center">{result.branch?.name || "N/A"}</td>
                      <td className="border border-black px-2 py-2 text-center">
                        {result.instructor?.name || "N/A"}
                        <div className="text-xs text-gray-500">{result.instructor?.service_number || ""}</div>
                      </td>
                      <td className="border border-black px-2 py-2 text-center text-blue-700 font-bold">
                        {parseFloat(String(mark.achieved_mark || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="font-semibold">
                    <td colSpan={6} className="border border-black px-2 py-2 text-center font-bold">TOTAL</td>
                    <td className="border border-black px-2 py-2 text-center text-blue-700 font-bold">
                      {calculateTotalMarks().toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Information */}
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

        {/* Footer with date */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}