"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwSubjectService } from "@/libs/services/atwSubjectService";
import FullLogo from "@/components/ui/fulllogo";
import type { AtwSubject } from "@/libs/types/system";

export default function SubjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.id as string;

  const [subject, setSubject] = useState<AtwSubject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSubject = async () => {
      try {
        setLoading(true);
        const data = await atwSubjectService.getSubject(parseInt(subjectId));
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
            onClick={() => router.push("/atw/subjects")}
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
          onClick={() => router.push("/atw/subjects")}
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
            onClick={() => router.push(`/atw/subjects/${subject.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Subject
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
            Basic Information
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
              <span className="w-48 text-gray-900 font-medium">Credit</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-semibold">{subject.subjects_credit}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Subject Type</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.is_professional ? "Professional" : "General"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.is_active ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        {/* Related Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Related Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Course</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {subject.course ? `${subject.course.name} (${subject.course.code})` : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Semester</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {subject.semester ? `${subject.semester.name} (${subject.semester.code})` : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Program</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {subject.program ? `${subject.program.name} (${subject.program.code})` : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Branch</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {subject.branch ? `${subject.branch.name} (${subject.branch.code})` : "Not Assigned"}
              </span>
            </div>
          </div>
        </div>

        {/* Marks Distribution Section */}
        {subject.subject_marks && subject.subject_marks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
              Marks Distribution
            </h2>
            <table className="w-full border-collapse border border-gray-900">
              <thead>
                <tr className="bg-white">
                  <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">SL.</th>
                  <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Title</th>
                  <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Type</th>
                  <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold">Percentage</th>
                  <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold">Estimate Mark</th>
                </tr>
              </thead>
              <tbody>
                {subject.subject_marks.map((mark, index) => (
                  <tr key={mark.id}>
                    <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">{index + 1}</td>
                    <td className="border border-gray-900 px-4 py-2 text-gray-900 font-medium">{mark.name}</td>
                    <td className="border border-gray-900 px-4 py-2 text-gray-900 capitalize">{mark.type || "N/A"}</td>
                    <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">{mark.percentage}%</td>
                    <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">{mark.estimate_mark}</td>
                  </tr>
                ))}
                <tr className="bg-white font-semibold">
                  <td colSpan={3} className="border border-gray-900 px-4 py-2 text-right text-gray-900">Total:</td>
                  <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">
                    {subject.subject_marks.reduce((sum, mark) => sum + parseFloat(mark.percentage.toString()), 0).toFixed(2)}%
                  </td>
                  <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">
                    {subject.subject_marks.reduce((sum, mark) => sum + parseFloat(mark.estimate_mark.toString()), 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
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
                {subject.created_at ? new Date(subject.created_at).toLocaleString("en-GB", {
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
                {subject.updated_at ? new Date(subject.updated_at).toLocaleString("en-GB", {
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
