/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwSubjectService } from "@/libs/services/atwSubjectService";
import FullLogo from "@/components/ui/fulllogo";
import type { AtwSubject } from "@/libs/types/system";

export default function AtwSubjectDetailsPage() {
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
          setError("Subject mapping not found");
        }
      } catch (err) {
        console.error("Failed to load subject mapping:", err);
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
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "Subject mapping not found"}</p>
          <button
            onClick={() => router.push("/atw/subjects")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  // Group marks by their type
  const markGroups = (subject.module?.subject_marks || []).reduce((groups: any[], mark) => {
    const type = mark.type || 'Other';
    const existingGroup = groups.find(g => g.type === type);
    if (existingGroup) {
      existingGroup.marks.push(mark);
    } else {
      groups.push({ type, marks: [mark] });
    }
    return groups;
  }, []);

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
        </div>
      </div>

      {/* Content */}
      <div className="p-8 cv-content">
        {/* Header with Logo */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="font-medium text-gray-900 uppercase tracking-wider pb-2">
            ATW Subject Mapping Details
          </p>
        </div>

        {/* Academic Context Information */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase tracking-wide">
            Academic Context Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-bold">Subject Module</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-semibold">{subject.module?.subject_name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-bold">Subject Code</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-mono">{subject.module?.subject_code || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-bold">Course</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.course?.name || "N/A"} ({subject.course?.code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-bold">Semester</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.semester?.name || "N/A"} ({subject.semester?.code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-bold">Program</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.program?.name || "N/A"} ({subject.program?.code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-bold">Branch</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.branch?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-bold">Group</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.group?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-bold">Credit Hours</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{subject.module?.subjects_credit || "0"}</span>
            </div>
          </div>
        </div>

        {/* Marks Distribution Section */}
        {subject.module?.subject_marks && subject.module.subject_marks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase tracking-wide">
              Marks Distribution Structure
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full rounded-lg border-collapse border border-black">
                <thead>
                  <tr>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Module Name</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Code</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Mark</th>
                    {markGroups.map((group: any) => (
                      <th
                        key={group.type}
                        className="border border-black px-3 py-2 text-center text-gray-900 capitalize"
                        colSpan={group.marks.length}
                      >
                        {group.type.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Total</th>
                  </tr>
                  {/* Second header row - Individual marks */}
                  <tr>
                    {markGroups.flatMap((group: any) =>
                      group.marks.map((mark: any) => (
                        <th key={mark.id} className="border border-black px-2 py-2 text-center min-w-[100px]">
                          <div className="font-bold">{mark.name}</div>
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Estimated Marks */}
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="border border-black px-3 py-2 text-center text-gray-900 bg-white" rowSpan={2}>{subject.module.subject_name}</td>
                    <td className="border border-black px-3 py-2 text-center bg-white" rowSpan={2}>{subject.module.subject_code}</td>
                    <td className="border border-black px-3 py-2 text-center text-gray-700">Estimated Mark</td>
                    {markGroups.flatMap((group: any) =>
                      group.marks.map((mark: any) => (
                        <td key={`est-${mark.id}`} className="border border-black px-3 py-2 text-center bg-white">
                          {Number(mark.estimate_mark).toFixed(0)}
                        </td>
                      ))
                    )}
                    <td className="border border-black px-3 py-2 text-center">
                      {subject.module.subject_marks.reduce((acc, curr) => acc + Number(curr.estimate_mark), 0).toFixed(0)}
                    </td>
                  </tr>
                  {/* Row 2: Percentages */}
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="border border-black px-3 py-2 text-center text-gray-900 border-t-0">Percentage</td>
                    {markGroups.flatMap((group: any) =>
                      group.marks.map((mark: any) => (
                        <td key={`per-${mark.id}`} className="border border-black px-3 py-2 text-center text-gray-900 bg-white">
                          {Number(mark.percentage).toFixed(0)}
                        </td>
                      ))
                    )}
                    <td className="border border-black px-3 py-2 text-center font-bold">
                      {subject.module.subject_marks.reduce((acc, curr) => acc + Number(curr.percentage), 0).toFixed(0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase tracking-wide">
            System Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-bold">Status</span>
              <span className="mr-4">:</span>
              <span className={`flex-1 font-bold ${subject.is_active ? "text-green-600" : "text-red-600"}`}>
                {subject.is_active ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-bold">Current Cycle</span>
              <span className="mr-4">:</span>
              <span className={`flex-1 font-bold ${subject.is_current ? "text-blue-600" : "text-gray-500"}`}>
                {subject.is_current ? "YES" : "NO"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-bold">Created At</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {subject.created_at ? new Date(subject.created_at).toLocaleString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-bold">Last Updated</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {subject.updated_at ? new Date(subject.updated_at).toLocaleString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer with date */}
        <div className="mt-12 text-center text-xs text-gray-500 font-medium uppercase tracking-widest">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}
