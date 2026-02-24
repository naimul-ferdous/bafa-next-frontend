"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw11sqnAssessmentOlqTypeService } from "@/libs/services/ftw11sqnAssessmentOlqTypeService";
import FullLogo from "@/components/ui/fulllogo";
import type { Ftw11sqnAssessmentOlqType } from "@/libs/types/ftw11sqnAssessmentOlq";

export default function OlqTypeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const typeId = params?.id as string;

  const [type, setType] = useState<Ftw11sqnAssessmentOlqType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reordering, setReordering] = useState(false);

  const loadType = async () => {
    try {
      setLoading(true);
      const data = await ftw11sqnAssessmentOlqTypeService.getType(parseInt(typeId));
      if (data) {
        // Sort estimated marks by order
        if (data.estimated_marks) {
          data.estimated_marks.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        setType(data);
      } else {
        setError("OLQ Type not found");
      }
    } catch (err) {
      console.error("Failed to load OLQ type:", err);
      setError("Failed to load OLQ type data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeId) {
      loadType();
    }
  }, [typeId]);

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!type?.estimated_marks) return;

    const newMarks = [...type.estimated_marks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newMarks.length) return;

    // Swap
    [newMarks[index], newMarks[targetIndex]] = [newMarks[targetIndex], newMarks[index]];

    // Update state optimistically
    setType({ ...type, estimated_marks: newMarks });

    try {
      setReordering(true);
      const orders = newMarks.map(m => m.id);
      const success = await ftw11sqnAssessmentOlqTypeService.reorderEstimatedMarks(type.id, orders);
      if (!success) {
        loadType(); // Revert
      }
    } catch (err) {
      console.error("Failed to reorder estimated marks:", err);
      loadType(); // Revert
    } finally {
      setReordering(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

  if (error || !type) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "OLQ Type not found"}</p>
          <button
            onClick={() => router.push("/ftw/11sqn/assessments/olq/types")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to OLQ Types
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/ftw/11sqn/assessments/olq/types")}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
            Back to List
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => router.push(`/ftw/11sqn/assessments/olq/types/${type.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Type
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
            OLQ Type Details - {type.type_name}
          </p>
        </div>

        {/* Basic Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Type Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Course</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-semibold">
                {type.course ? `${type.course.name} (${type.course.code})` : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Type Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{type.type_name}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Type Code</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-mono">{type.type_code}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{type.is_active ? "Active" : "Inactive"}</span>
            </div>
            {type.creator && (
              <div className="flex">
                <span className="w-48 text-gray-900 font-medium">Created By</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1">{type.creator.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Estimated Marks Section */}
        {type.estimated_marks && type.estimated_marks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
              Estimated Marks
            </h2>
            <table className="w-full border border-black">
              <thead>
                <tr>
                  <th className="border border-black px-4 py-2 text-center">SL</th>
                  <th className="border border-black px-4 py-2 text-center">Order</th>
                  <th className="border border-black px-4 py-2 text-left">Event Name</th>
                  <th className="border border-black px-4 py-2 text-left">Event Code</th>
                  <th className="border border-black px-4 py-2 text-center">Estimated Mark</th>
                  <th className="border border-black px-4 py-2 text-left">Remarks</th>
                  <th className="border border-black px-4 py-2 text-center no-print">Action</th>
                </tr>
              </thead>
              <tbody>
                {type.estimated_marks.map((mark, index) => (
                  <tr key={mark.id}>
                    <td className="border border-black px-4 py-2 text-center">{index + 1}</td>
                    <td className="border border-black px-4 py-2 text-center font-bold text-blue-700">{mark.order}</td>
                    <td className="border border-black px-4 py-2">{mark.event_name}</td>
                    <td className="border border-black px-4 py-2 font-mono">{mark.event_code}</td>
                    <td className="border border-black px-4 py-2 text-center">{parseFloat(String(mark.estimated_mark)).toFixed(2)}</td>
                    <td className="border border-black px-4 py-2">{mark.remarks || "—"}</td>
                    <td className="border border-black px-4 py-2 text-center no-print">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          disabled={index === 0 || reordering}
                          onClick={() => handleMove(index, 'up')}
                          className={`p-1 rounded-md transition-colors ${
                            index === 0 || reordering
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                          title="Move Up"
                        >
                          <Icon icon="hugeicons:arrow-up-01" className="w-5 h-5" />
                        </button>
                        <button
                          disabled={index === type.estimated_marks!.length - 1 || reordering}
                          onClick={() => handleMove(index, 'down')}
                          className={`p-1 rounded-md transition-colors ${
                            index === type.estimated_marks!.length - 1 || reordering
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                          title="Move Down"
                        >
                          <Icon icon="hugeicons:arrow-down-01" className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Semesters Section */}
        {type.semesters && type.semesters.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
              Applicable Semesters
            </h2>
            <div className="flex flex-wrap gap-2">
              {type.semesters.map((sem) => (
                <span
                  key={sem.id}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                >
                  {sem.semester?.name || `Semester ${sem.semester_id}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* System Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            System Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created At</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {type.created_at ? new Date(type.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Last Updated</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {type.updated_at ? new Date(type.updated_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
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
