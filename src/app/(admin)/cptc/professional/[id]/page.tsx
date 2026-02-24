/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { cptcProfessionalResultService } from "@/libs/services/cptcProfessionalResultService";
import FullLogo from "@/components/ui/fulllogo";
import type { CptcProfessionalResult } from "@/libs/types/cptcProfessionalResult";

export default function ViewProfessionalResultPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [result, setResult] = useState<CptcProfessionalResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(true);
        const data = await cptcProfessionalResultService.getResult(parseInt(resultId));
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

    if (resultId) {
      loadResult();
    }
  }, [resultId]);

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    router.push(`/cptc/professional/${resultId}/edit`);
  };

  const handleBack = () => {
    router.push("/cptc/professional");
  };

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
            onClick={handleBack}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  // Calculate total and average marks
  const totalMarks = result.cadet_marks?.reduce((sum, cm) => sum + parseFloat(String(cm.achieved_mark)), 0) || 0;
  const averageMarks = result.cadet_marks && result.cadet_marks.length > 0
    ? totalMarks / result.cadet_marks.length
    : 0;

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print border-b">
        <button
          onClick={handleBack}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEdit}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="p-6">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">CPTC Professional Result Details</h2>
        </div>

        {/* Result Information */}
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="hugeicons:file-02" className="w-5 h-5 text-blue-500" />
            Result Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Course</p>
              <p className="font-medium text-gray-900">
                {result.course?.name} ({result.course?.code})
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Semester</p>
              <p className="font-medium text-gray-900">
                {result.semester?.name} ({result.semester?.code})
              </p>
            </div>
            {result.program && (
              <div>
                <p className="text-sm text-gray-600">Program</p>
                <p className="font-medium text-gray-900">{result.program?.name}</p>
              </div>
            )}
            {result.branch && (
              <div>
                <p className="text-sm text-gray-600">Branch</p>
                <p className="font-medium text-gray-900">
                  {result.branch?.name} ({result.branch?.code})
                </p>
              </div>
            )}
            {result.group && (
              <div>
                <p className="text-sm text-gray-600">Group</p>
                <p className="font-medium text-gray-900">{result.group?.name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium">
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                  result.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.is_active ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created At</p>
              <p className="font-medium text-gray-900">
                {result.created_at ? new Date(result.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric"
                }) : "—"}
              </p>
            </div>
            {result.creator && (
              <div>
                <p className="text-sm text-gray-600">Created By</p>
                <p className="font-medium text-gray-900">{result.creator?.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon icon="hugeicons:user-group" className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Cadets</p>
                <p className="text-2xl font-bold text-gray-900">{result.cadet_marks?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Icon icon="hugeicons:calculator" className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Marks</p>
                <p className="text-2xl font-bold text-gray-900">{totalMarks.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Icon icon="hugeicons:chart-average" className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Mark</p>
                <p className="text-2xl font-bold text-gray-900">{averageMarks.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cadet Marks Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="hugeicons:file-check" className="w-5 h-5 text-blue-500" />
              Cadet Marks
            </h3>
          </div>

          {result.cadet_marks && result.cadet_marks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">SL</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">BD No</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Rank</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-900">Achieved Mark</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Remarks</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.cadet_marks
                    .sort((a, b) => (a.cadet?.bd_no || "").localeCompare(b.cadet?.bd_no || ""))
                    .map((cadetMark, index) => (
                      <tr key={cadetMark.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {cadetMark.cadet?.bd_no || "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {cadetMark.cadet?.assignedRanks?.[0]?.rank?.name || "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {cadetMark.cadet?.name || "—"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                            {parseFloat(String(cadetMark.achieved_mark)).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {cadetMark.remarks || "—"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                            cadetMark.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {cadetMark.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right font-bold text-gray-900">
                      Total:
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                        {totalMarks.toFixed(2)}
                      </span>
                    </td>
                    <td colSpan={2} className="px-6 py-4 text-right font-bold text-gray-900">
                      Average: <span className="text-purple-600">{averageMarks.toFixed(2)}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:file-not-found" className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No cadet marks found</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Shown on print */}
      <div className="p-6 border-t print-only">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <p>CONFIDENTIAL</p>
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          <p>CONFIDENTIAL</p>
        </div>
      </div>
    </div>
  );
}
