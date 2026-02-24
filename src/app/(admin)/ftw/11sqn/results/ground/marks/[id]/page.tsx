"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ftw11sqnGroundExaminationMarkService } from "@/libs/services/ftw11sqnGroundExaminationMarkService";
import FullLogo from "@/components/ui/fulllogo";
import type { Ftw11sqnGroundExaminationMark } from "@/libs/types/ftw11sqnExamination";
import { Icon } from "@iconify/react";

export default function ViewFtw11sqnGroundExaminationMarkPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [loading, setLoading] = useState(true);
  const [mark, setMark] = useState<Ftw11sqnGroundExaminationMark | null>(null);

  useEffect(() => {
    const fetchMark = async () => {
      try {
        setLoading(true);
        const data = await ftw11sqnGroundExaminationMarkService.getMark(id);
        if (data) {
          setMark(data);
        } else {
          alert("Examination mark not found");
          router.push("/ftw/11sqn/results/ground/marks");
        }
      } catch (error) {
        console.error("Failed to fetch examination mark:", error);
        alert("Failed to fetch examination mark");
        router.push("/ftw/11sqn/results/ground/marks");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMark();
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center min-h-[400px]">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!mark) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-8">
          <p className="text-gray-500">Examination mark not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 11SQN Ground Examination Mark Details</h2>
      </div>

      <div className="space-y-6">
        {/* Cadet Information */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cadet Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900">{mark.cadet?.name || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">BD Number</label>
              <p className="text-gray-900">{mark.cadet?.bdno || "—"}</p>
            </div>
          </div>
        </div>

        {/* Examination Information */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Examination Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Subject</label>
              <p className="text-gray-900">{mark.syllabus?.ground_fullname || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Test</label>
              <p className="text-gray-900">{mark.exercise?.ground_test_name || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Course</label>
              <p className="text-gray-900">{mark.course?.name || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Semester</label>
              <p className="text-gray-900">{mark.semester?.name || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Exam Type</label>
              <p className="text-gray-900">{mark.examType?.name || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Instructor</label>
              <p className="text-gray-900">{mark.instructor?.name || "—"}</p>
            </div>
          </div>
        </div>

        {/* Marks & Performance */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Marks & Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Achieved Mark</label>
              <p className="text-gray-900 text-xl font-bold">{mark.achieved_mark || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Achieved Time</label>
              <p className="text-gray-900">{mark.achieved_time || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Participation Date</label>
              <p className="text-gray-900">{mark.participate_date || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Present</label>
              <p>
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${mark.is_present ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {mark.is_present ? "Yes" : "No"}
                </span>
              </p>
            </div>
          </div>
          {!mark.is_present && mark.absent_reason && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-500">Absent Reason</label>
              <p className="text-gray-900">{mark.absent_reason}</p>
            </div>
          )}
          {mark.remark && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-500">Remark</label>
              <p className="text-gray-900">{mark.remark}</p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Active Status</label>
              <p>
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${mark.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {mark.is_active ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created At</label>
              <p className="text-gray-900">{mark.created_at ? new Date(mark.created_at).toLocaleString() : "—"}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/ftw/11sqn/results/ground/marks")}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-2" />
            Back to List
          </button>
          <button
            onClick={() => router.push(`/ftw/11sqn/results/ground/marks/${mark.id}/edit`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 inline mr-2" />
            Edit Mark
          </button>
        </div>
      </div>
    </div>
  );
}
