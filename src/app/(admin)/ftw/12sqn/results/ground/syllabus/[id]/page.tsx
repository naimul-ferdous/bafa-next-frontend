"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnGroundSyllabusService } from "@/libs/services/ftw12sqnGroundSyllabusService";
import FullLogo from "@/components/ui/fulllogo";
import type { Ftw12sqnGroundSyllabus } from "@/libs/types/ftw12sqnFlying";

export default function ViewGroundSyllabusPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [syllabus, setSyllabus] = useState<Ftw12sqnGroundSyllabus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSyllabus = async () => {
      try {
        setLoading(true);
        const data = await ftw12sqnGroundSyllabusService.get(parseInt(id));
        if (data) {
          setSyllabus(data);
        } else {
          setError("Ground syllabus not found");
        }
      } catch (err) {
        console.error("Failed to load syllabus:", err);
        setError("Failed to load ground syllabus data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadSyllabus();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading ground syllabus details...</p>
        </div>
      </div>
    );
  }

  if (error || !syllabus) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "Ground syllabus not found"}</p>
          <button
            onClick={() => router.push("/ftw/12sqn/results/ground/syllabus")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  // Calculate total max marks
  const totalMaxMarks = syllabus.exercises?.reduce((sum, ex) => sum + parseFloat(String(ex.max_mark || 0)), 0) || 0;
  const sortedExercises = syllabus.exercises?.sort((a, b) => a.exercise_sort - b.exercise_sort) || [];

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ftw/12sqn/results/ground/syllabus")}
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
            onClick={() => router.push(`/ftw/12sqn/results/ground/syllabus/${syllabus.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Syllabus
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
            Ground Syllabus Details - {syllabus.ground_full_name}
          </p>
        </div>

        {/* Basic Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Syllabus Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Subject Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.ground_full_name}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Short Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-mono">{syllabus.ground_shortname}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Symbol</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.ground_symbol || "—"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Sort Order</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.ground_sort}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Number of Tests</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.no_of_test}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Highest Mark</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.highest_mark}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Total Max Marks</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-semibold text-green-700">{totalMaxMarks}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.is_active ? "Active" : "Inactive"}</span>
            </div>
            {syllabus.creator && (
              <div className="flex">
                <span className="w-48 text-gray-900 font-medium">Created By</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1">{syllabus.creator.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tests/Exercises Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Tests ({sortedExercises.length})
          </h2>
          {sortedExercises.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    <th className="border border-black px-3 py-2 text-center font-semibold text-gray-900">SL</th>
                    <th className="border border-black px-3 py-2 text-left font-semibold text-gray-900">Test Name</th>
                    <th className="border border-black px-3 py-2 text-left font-semibold text-gray-900">Short Name</th>
                    <th className="border border-black px-3 py-2 text-center font-semibold text-gray-900">Max Mark</th>
                    <th className="border border-black px-3 py-2 text-left font-semibold text-gray-900">Remarks</th>
                    <th className="border border-black px-3 py-2 text-center font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExercises.map((exercise, index) => (
                    <tr key={exercise.id}>
                      <td className="border border-black px-3 py-2 text-center">{index + 1}</td>
                      <td className="border border-black px-3 py-2 font-medium">{exercise.exercise_name}</td>
                      <td className="border border-black px-3 py-2 font-mono">{exercise.exercise_shortname}</td>
                      <td className="border border-black px-3 py-2 text-center text-green-700 font-semibold">{exercise.max_mark}</td>
                      <td className="border border-black px-3 py-2">{exercise.exercise_remarks || "—"}</td>
                      <td className="border border-black px-3 py-2 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${exercise.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {exercise.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan={3} className="border border-black px-3 py-2 text-right">Total Max Marks:</td>
                    <td className="border border-black px-3 py-2 text-center text-green-700">{totalMaxMarks}</td>
                    <td colSpan={2} className="border border-black px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No tests/exercises found for this syllabus.</p>
          )}
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
                {syllabus.created_at ? new Date(syllabus.created_at).toLocaleString("en-GB", {
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
                {syllabus.updated_at ? new Date(syllabus.updated_at).toLocaleString("en-GB", {
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
