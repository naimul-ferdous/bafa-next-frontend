/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwMarksheetService } from "@/libs/services/atwMarksheetService";
import type { AtwSubjectsModuleMarksheet } from "@/libs/types/system";
import FullLogo from "@/components/ui/fulllogo";

const formatType = (type: string) => {
  return type
    .replace(/([a-z])([A-Z])/g, "$1 $2")           // camelCase → camel Case
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")            // word123 → word 123
    .replace(/(classtest)/gi, "Class Test")
    .replace(/(quiztest)/gi, "Quiz Test")
    .replace(/(endsemester)/gi, "End Semester")
    .replace(/(midsemester)/gi, "Mid Semester")
    .replace(/(midterm)/gi, "Mid Term")
    .replace(/(finalexam)/gi, "Final Exam")
    .replace(/\b\w/g, (c) => c.toUpperCase());      // capitalize first letter of each word
};

export default function MarksheetDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [marksheet, setMarksheet] = useState<AtwSubjectsModuleMarksheet | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await atwMarksheetService.getMarksheet(parseInt(id));
      if (data) setMarksheet(data);
      else router.push("/atw/subjects/modules/marksheets");
    } catch (error) {
      console.error("Failed to load marksheet:", error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) loadData();
  }, [id, loadData]);

  if (loading) {
    return <div className="py-20 flex justify-center"><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" /></div>;
  }

  if (!marksheet) return null;

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/atw/subjects/modules/marksheets/${marksheet.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
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
            Marksheet Details - {marksheet.name}
          </p>
        </div>

        {/* Basic Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Marksheet Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Marksheet Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{marksheet.name}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Code</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-mono">{marksheet.code}</span>
            </div>
          </div>
        </div>

        {/* Components Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Components
          </h2>
          {marksheet.marks && marksheet.marks.length > 0 ? (
            <table className="w-full border-collapse border border-gray-900">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold text-xs">SL.</th>
                  <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold text-xs">COMPONENT TITLE</th>
                  <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold text-xs">TYPE</th>
                  <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold text-xs">EXAM MARK</th>
                  <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold text-xs">WEIGHT (%)</th>
                </tr>
              </thead>
              <tbody>
                {marksheet.marks.map((mark, index) => (
                  <tr key={mark.id}>
                    <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">{index + 1}</td>
                    <td className="border border-gray-900 px-4 py-2 text-gray-900 font-medium">{mark.name}</td>
                    <td className="border border-gray-900 px-4 py-2 text-gray-900">{mark.type ? formatType(mark.type) : "N/A"}</td>
                    <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">{mark.estimate_mark}</td>
                    <td className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-bold">{mark.percentage}%</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={3} className="border border-gray-900 px-4 py-2 text-right text-gray-900">TOTAL:</td>
                  <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">
                    {marksheet.marks.reduce((sum, mark) => sum + (parseFloat(String(mark.estimate_mark)) || 0), 0).toFixed(0)}
                  </td>
                  <td className="border border-gray-900 px-4 py-2 text-center text-blue-700">
                    {marksheet.marks.reduce((sum, mark) => sum + (parseFloat(String(mark.percentage)) || 0), 0).toFixed(0)}%
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-dashed text-center">No components added to this marksheet.</p>
          )}
        </div>

        {/* Signature Blocks - Creator + Last 4 Unique Editors */}
        <div className="mt-16 flex justify-end gap-10">
          {/* Created by */}
          <div className="text-left min-w-[180px]">
            <p className="text-xs text-gray-900 uppercase tracking-wider">Created by</p>
            <div className="border-b border-gray-400">
              <p className="text-sm text-gray-900">
                {marksheet.creator ? (
                  <>
                    {marksheet.creator.rank?.short_name && <>{marksheet.creator.rank.short_name} </>}
                    {marksheet.creator.name}
                  </>
                ) : "N/A"}
              </p>
              {marksheet.creator?.roles && marksheet.creator.roles.length > 0 && (
                <p className="text-xs text-gray-900 mt-0.5">{marksheet.creator.roles[0].name}</p>
              )}
            </div>
            <p className="text-xs text-gray-900">
              {marksheet.created_at ? new Date(marksheet.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric"
              }) : "N/A"}
            </p>
          </div>

          {/* Edited by - last 4 unique consecutive editors, oldest first, last one labeled "Last Edited by" */}
          {(() => {
            const logs = marksheet.edit_logs || [];
            // Filter to last 4 unique consecutive editors (skip if same person as previous)
            const uniqueEditors: typeof logs = [];
            for (const log of logs) {
              if (uniqueEditors.length >= 4) break;
              const lastEditor = uniqueEditors[uniqueEditors.length - 1];
              if (!lastEditor || lastEditor.edited_by !== log.edited_by) {
                uniqueEditors.push(log);
              }
            }
            // Reverse so oldest edit is first, latest edit is last
            const ordered = [...uniqueEditors].reverse();
            return ordered.map((log, idx) => (
              <div key={log.id} className="text-left min-w-[180px]">
                <p className="text-xs text-gray-900 uppercase tracking-wider">
                  {idx === ordered.length - 1 ? "Last Edited by" : "Edited by"}
                </p>
                <div className="border-b border-gray-400">
                  <p className="text-sm text-gray-900">
                    {log.editor ? (
                      <>
                        {log.editor.rank?.short_name && <>{log.editor.rank.short_name} </>}
                        {log.editor.name}
                      </>
                    ) : "N/A"}
                  </p>
                  {log.editor?.roles && log.editor.roles.length > 0 && (
                    <p className="text-xs text-gray-900 mt-0.5">{log.editor.roles[0].name}</p>
                  )}
                </div>
                <p className="text-xs text-gray-900">
                  {log.created_at ? new Date(log.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                  }) : "N/A"}
                </p>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
