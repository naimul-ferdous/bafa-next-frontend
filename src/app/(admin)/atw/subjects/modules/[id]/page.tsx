"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwSubjectModuleService } from "@/libs/services/atwSubjectModuleService";
import FullLogo from "@/components/ui/fulllogo";
import type { AtwSubjectModule } from "@/libs/types/system";

const formatType = (type: string) => {
  return type
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(classtest)/gi, "Class Test")
    .replace(/(quiztest)/gi, "Quiz Test")
    .replace(/(endsemester)/gi, "End Semester")
    .replace(/(midsemester)/gi, "Mid Semester")
    .replace(/(midterm)/gi, "Mid Term")
    .replace(/(finalexam)/gi, "Final Exam")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function SubjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.id as string;

  const [subject, setSubject] = useState<AtwSubjectModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSubject = async () => {
      try {
        setLoading(true);
        const data = await atwSubjectModuleService.getSubject(parseInt(subjectId));
        if (data) {
          setSubject(data);
        } else {
          setError("Subject not found");
        }
      } catch (err) {
        console.error("Failed to load subject:", err);
        setError("Failed to load subject data");
      } finally {
        setLoading(false);
      }
    };

    if (subjectId) {
      loadSubject();
    }
  }, [subjectId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading subject details...</p>
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "Subject not found"}</p>
          <button
            onClick={() => router.push("/atw/subjects/modules")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to Subjects
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
          onClick={() => router.push("/atw/subjects/modules")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/atw/subjects/modules/${subject.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* CV Content */}
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
            Subject Details - {subject.subject_name}
          </p>
        </div>

        {/* Basic Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Subject Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Subject Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.subject_name}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Subject Code</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-mono">{subject.subject_code}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Subject Legend</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.subject_legend || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Subject Period</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.subject_period || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Full Mark</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-semibold">{subject.subjects_full_mark}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Credit Hours</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-semibold">{subject.subjects_credit}</span>
            </div>
            {/* <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.is_active ? "Active" : "Inactive"}</span>
            </div> */}
          </div>
        </div>

        {/* Marksheet Structure Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Marksheet Structure
          </h2>
          {subject.marksheet ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Name</p>
                  <p className="font-bold text-gray-900">{subject.marksheet.name}</p>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Code</p>
                  <p className="font-mono text-gray-700">{subject.marksheet.code}</p>
                </div>
              </div>

              {subject.marksheet.marks && subject.marksheet.marks.length > 0 && (
                <table className="w-full border-collapse border border-gray-900">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold text-xs">SL.</th>
                      <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold text-xs">COMPONENT TITLE</th>
                      <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold text-xs">TYPE</th>
                      <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold text-xs">MAX MARK</th>
                      <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold text-xs">WEIGHT (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subject.marksheet.marks.map((mark, index) => (
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
                        {subject.marksheet.marks.reduce((sum, mark) => sum + (parseFloat(String(mark.estimate_mark)) || 0), 0).toFixed(0)}
                      </td>
                      <td className="border border-gray-900 px-4 py-2 text-center text-blue-700">
                        {subject.marksheet.marks.reduce((sum, mark) => sum + (parseFloat(String(mark.percentage)) || 0), 0).toFixed(0)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-dashed text-center">No marksheet linked to this subject module.</p>
          )}
        </div>

        {/* Signature Blocks - Creator + Last 4 Unique Editors */}
        <div className="mt-16 flex justify-end gap-10">
          {/* Created by */}
          <div className="text-left min-w-[180px]">
            <p className="text-xs text-gray-900 uppercase tracking-wider">Created by</p>
            <div className="border-b border-gray-400">
              <p className="text-sm text-gray-900">
                {subject.creator ? (
                  <>
                    {subject.creator.rank?.short_name && <>{subject.creator.rank.short_name} </>}
                    {subject.creator.name}
                  </>
                ) : "N/A"}
              </p>
              {subject.creator?.roles && subject.creator.roles.length > 0 && (
                <p className="text-xs text-gray-900 mt-0.5">{subject.creator.roles[0].name}</p>
              )}
            </div>
            <p className="text-xs text-gray-900">
              {subject.created_at ? new Date(subject.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric"
              }) : "N/A"}
            </p>
          </div>

          {/* Edited by - last 4 unique consecutive editors, oldest first, last one labeled "Last Edited by" */}
          {(() => {
            const logs = subject.edit_logs || [];
            const uniqueEditors: typeof logs = [];
            for (const log of logs) {
              if (uniqueEditors.length >= 4) break;
              const lastEditor = uniqueEditors[uniqueEditors.length - 1];
              if (!lastEditor || lastEditor.edited_by !== log.edited_by) {
                uniqueEditors.push(log);
              }
            }
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
