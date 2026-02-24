/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import FullLogo from "@/components/ui/fulllogo";
import type { CtwResultsModuleEstimatedMark } from "@/libs/types/ctw";

export default function ViewEstimatedMarkPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = parseInt(params?.id as string);
  const markId = parseInt(params?.markId as string);

  const [mark, setMark] = useState<CtwResultsModuleEstimatedMark | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMark = async () => {
      try {
        setLoading(true);
        const marks = await ctwResultsModuleService.getEstimatedMarks(moduleId);
        const found = marks.find((m: any) => m.id === markId);
        if (found) {
          setMark(found);
        } else {
          setError("Estimated mark not found");
        }
      } catch (err) {
        console.error("Failed to load estimated mark:", err);
        setError("Failed to load estimated mark data");
      } finally {
        setLoading(false);
      }
    };

    if (moduleId && markId) {
      loadMark();
    }
  }, [moduleId, markId]);

  const handlePrint = () => {
    window.print();
  };

  // Determine which info fields have data
  const infoFields = useMemo(() => {
    if (!mark) return [];
    const fields: { label: string; value: string; color?: string }[] = [];
    if (mark.course?.name) fields.push({ label: "Course", value: mark.course.name });
    if (mark.semester?.name) fields.push({ label: "Semester", value: mark.semester.name });
    if (mark.program?.name) fields.push({ label: "Program", value: mark.program.name });
    if (mark.branch?.name) fields.push({ label: "Branch", value: mark.branch.name });
    if (mark.exam_type?.name) fields.push({ label: "Exam Type", value: mark.exam_type.name });
    fields.push({ label: "Status", value: mark.is_active ? "Active" : "Inactive", color: mark.is_active ? "text-green-600" : "text-red-600" });
    if (mark.estimated_mark_per_instructor) fields.push({ label: "Mark Per Instructor", value: parseFloat(String(mark.estimated_mark_per_instructor)).toFixed(2), color: "text-blue-700" });
    if (mark.conversation_mark) fields.push({ label: "Conversation Mark", value: parseFloat(String(mark.conversation_mark)).toFixed(2), color: "text-green-700" });
    return fields;
  }, [mark]);

  // Determine which detail columns have data
  const detailColumns = useMemo(() => {
    if (!mark?.details || mark.details.length === 0) return { hasName: false, hasMaleQty: false, hasFemaleQty: false, hasMaleMarks: false, hasFemaleMarks: false };
    const details = mark.details;
    return {
      hasName: details.some(d => d.name),
      hasMaleQty: details.some(d => d.male_quantity !== undefined && d.male_quantity !== null && d.male_quantity !== 0),
      hasFemaleQty: details.some(d => d.female_quantity !== undefined && d.female_quantity !== null && d.female_quantity !== 0),
      hasMaleMarks: details.some(d => d.male_marks !== undefined && d.male_marks !== null && Number(d.male_marks) !== 0),
      hasFemaleMarks: details.some(d => d.female_marks !== undefined && d.female_marks !== null && Number(d.female_marks) !== 0),
    };
  }, [mark]);

  // Determine which score columns have data across all details
  const scoreColumns = useMemo(() => {
    if (!mark?.details) return { hasMaleQty: false, hasMaleTime: false, hasMaleMark: false, hasFemaleQty: false, hasFemaleTime: false, hasFemaleMark: false };
    const allScores = mark.details.flatMap(d => d.scores || []);
    if (allScores.length === 0) return { hasMaleQty: false, hasMaleTime: false, hasMaleMark: false, hasFemaleQty: false, hasFemaleTime: false, hasFemaleMark: false };
    return {
      hasMaleQty: allScores.some(s => s.male_quantity !== undefined && s.male_quantity !== null && s.male_quantity !== 0),
      hasMaleTime: allScores.some(s => s.male_time),
      hasMaleMark: allScores.some(s => s.male_mark !== undefined && s.male_mark !== null && Number(s.male_mark) !== 0),
      hasFemaleQty: allScores.some(s => s.female_quantity !== undefined && s.female_quantity !== null && s.female_quantity !== 0),
      hasFemaleTime: allScores.some(s => s.female_time),
      hasFemaleMark: allScores.some(s => s.female_mark !== undefined && s.female_mark !== null && Number(s.female_mark) !== 0),
    };
  }, [mark]);

  const detailColCount = useMemo(() => {
    let count = 1; // SL always
    if (detailColumns.hasName) count++;
    if (detailColumns.hasMaleQty) count++;
    if (detailColumns.hasFemaleQty) count++;
    if (detailColumns.hasMaleMarks) count++;
    if (detailColumns.hasFemaleMarks) count++;
    return count;
  }, [detailColumns]);

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
          <p className="text-red-600">{error || "Estimated mark not found"}</p>
          <button
            onClick={() => router.push(`/ctw/modules/${moduleId}`)}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to Module
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push(`/ctw/modules/${moduleId}`)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to Module
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
            onClick={() => router.push(`/ctw/modules/${moduleId}/estimated-marks/${mark.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit
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
            Estimated Mark Configuration Detail
          </p>
        </div>

        {infoFields.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
              Configuration Information
            </h2>
            <div className="grid grid-cols-2 gap-x-12 gap-y-3">
              {infoFields.map((field, idx) => (
                <div key={idx} className="flex">
                  <span className="w-48 text-gray-900 font-medium">{field.label}</span>
                  <span className="mr-4">:</span>
                  <span className={`flex-1 font-bold ${field.color || "text-gray-900"}`}>{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mark.details && mark.details.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
              Configuration Details
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-2 text-center">SL</th>
                    {detailColumns.hasName && <th className="border border-black px-2 py-2 text-left">Name</th>}
                    {detailColumns.hasMaleQty && <th className="border border-black px-2 py-2 text-center">Male Qty</th>}
                    {detailColumns.hasFemaleQty && <th className="border border-black px-2 py-2 text-center">Female Qty</th>}
                    {detailColumns.hasMaleMarks && <th className="border border-black px-2 py-2 text-center">Male Marks</th>}
                    {detailColumns.hasFemaleMarks && <th className="border border-black px-2 py-2 text-center">Female Marks</th>}
                  </tr>
                </thead>
                <tbody>
                  {mark.details.map((detail, index) => (
                    <React.Fragment key={detail.id || index}>
                      <tr>
                        <td className="border border-black px-2 py-2 text-center" rowSpan={detail.scores && detail.scores.length > 0 ? 2 : 1}>{index + 1}</td>
                        {detailColumns.hasName && <td className="border border-black px-2 py-2" rowSpan={detail.scores && detail.scores.length > 0 ? 2 : 1}>{detail.name || "-"}</td>}
                        {detailColumns.hasMaleQty && <td className="border border-black px-2 py-2 text-center">{detail.male_quantity ?? "-"}</td>}
                        {detailColumns.hasFemaleQty && <td className="border border-black px-2 py-2 text-center">{detail.female_quantity ?? "-"}</td>}
                        {detailColumns.hasMaleMarks && <td className="border border-black px-2 py-2 text-center">{detail.male_marks ?? "-"}</td>}
                        {detailColumns.hasFemaleMarks && <td className="border border-black px-2 py-2 text-center">{detail.female_marks ?? "-"}</td>}
                      </tr>
                      {detail.scores && detail.scores.length > 0 && (
                        <tr>
                          <td colSpan={detailColCount - (detailColumns.hasName ? 2 : 1)} className="border border-black px-3 py-2">
                            <table className="w-full border-collapse border border-black text-xs">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-black px-2 py-1 text-center">#</th>
                                  {scoreColumns.hasMaleQty && <th className="border border-black px-2 py-1 text-center">Male Qty</th>}
                                  {scoreColumns.hasMaleTime && <th className="border border-black px-2 py-1 text-center">Male Time</th>}
                                  {scoreColumns.hasMaleMark && <th className="border border-black px-2 py-1 text-center">Male Mark</th>}
                                  {scoreColumns.hasFemaleQty && <th className="border border-black px-2 py-1 text-center">Female Qty</th>}
                                  {scoreColumns.hasFemaleTime && <th className="border border-black px-2 py-1 text-center">Female Time</th>}
                                  {scoreColumns.hasFemaleMark && <th className="border border-black px-2 py-1 text-center">Female Mark</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {detail.scores.map((score, sIdx) => (
                                  <tr key={score.id || sIdx}>
                                    <td className="border border-black px-2 py-1 text-center">{sIdx + 1}</td>
                                    {scoreColumns.hasMaleQty && <td className="border border-black px-2 py-1 text-center">{score.male_quantity ?? "-"}</td>}
                                    {scoreColumns.hasMaleTime && <td className="border border-black px-2 py-1 text-center">{score.male_time || "-"}</td>}
                                    {scoreColumns.hasMaleMark && <td className="border border-black px-2 py-1 text-center">{score.male_mark ?? "-"}</td>}
                                    {scoreColumns.hasFemaleQty && <td className="border border-black px-2 py-1 text-center">{score.female_quantity ?? "-"}</td>}
                                    {scoreColumns.hasFemaleTime && <td className="border border-black px-2 py-1 text-center">{score.female_time || "-"}</td>}
                                    {scoreColumns.hasFemaleMark && <td className="border border-black px-2 py-1 text-center">{score.female_mark ?? "-"}</td>}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            System Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created At</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {mark.created_at ? new Date(mark.created_at).toLocaleString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Last Updated</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {mark.updated_at ? new Date(mark.updated_at).toLocaleString("en-GB", {
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
