"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwAssessmentPenpictureGradeService } from "@/libs/services/ctwAssessmentPenpictureGradeService";
import FullLogo from "@/components/ui/fulllogo";
import type { CtwAssessmentPenpictureGrade } from "@/libs/types/ctw";

export default function GradeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const gradeId = params?.id as string;

  const [grade, setGrade] = useState<CtwAssessmentPenpictureGrade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGrade = async () => {
      try {
        setLoading(true);
        const data = await ctwAssessmentPenpictureGradeService.getGrade(parseInt(gradeId));
        if (data) {
          setGrade(data);
        } else {
          setError("Grade not found");
        }
      } catch (err) {
        console.error("Failed to load grade:", err);
        setError("Failed to load grade data");
      } finally {
        setLoading(false);
      }
    };

    if (gradeId) {
      loadGrade();
    }
  }, [gradeId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading grade details...</p>
        </div>
      </div>
    );
  }

  if (error || !grade) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "Grade not found"}</p>
          <button
            onClick={() => router.push("/ctw/assessments/penpicture/grades")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to Grades
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
          onClick={() => router.push("/ctw/assessments/penpicture/grades")}
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
            onClick={() => router.push(`/ctw/assessments/penpicture/grades/${grade.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Grade
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
            Assessment Grade Details - {grade.grade_name}
          </p>
        </div>

        {/* Basic Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Grade Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Grade Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{grade.grade_name}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Grade Code</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-mono">{grade.grade_code}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Course</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{grade.course ? `${grade.course.name} (${grade.course.code})` : "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{grade.is_active ? "Active" : "Inactive"}</span>
            </div>
            {grade.creator && (
              <div className="flex">
                <span className="w-48 text-gray-900 font-medium">Created By</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1">{grade.creator.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Semesters Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Applicable Semesters
          </h2>
          <div className="flex flex-wrap gap-2">
            {grade.semesters && grade.semesters.length > 0 ? (
              grade.semesters.map((s, i) => (
                <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-lg border border-purple-100">
                  {s.semester?.name}
                </span>
              ))
            ) : (
              <p className="text-gray-500 italic">No semesters assigned to this grade.</p>
            )}
          </div>
        </div>

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
                {grade.created_at ? new Date(grade.created_at).toLocaleString("en-GB", {
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
                {grade.updated_at ? new Date(grade.updated_at).toLocaleString("en-GB", {
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
