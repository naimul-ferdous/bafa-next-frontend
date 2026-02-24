"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw11sqnFlyingSyllabusService } from "@/libs/services/ftw11sqnFlyingSyllabusService";
import FullLogo from "@/components/ui/fulllogo";
import type { Ftw11sqnFlyingSyllabus } from "@/libs/types/ftw11sqnFlying";

export default function ViewFlyingSyllabusPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [syllabus, setSyllabus] = useState<Ftw11sqnFlyingSyllabus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSyllabus = async () => {
      try {
        setLoading(true);
        const data = await ftw11sqnFlyingSyllabusService.get(id);
        setSyllabus(data);
      } catch (error) {
        console.error("Failed to load syllabus:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadSyllabus();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!syllabus) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-02" className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Flying Syllabus Not Found</h2>
          <p className="text-gray-500 mt-2">The flying syllabus you are looking for does not exist.</p>
          <button
            onClick={() => router.push("/ftw/11sqn/results/flying/syllabus")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Flying Syllabus Details</h2>
      </div>

      {/* Basic Information */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:document-01" className="w-5 h-5 text-blue-500" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">Phase Full Name</label>
            <p className="mt-1 text-gray-900 font-medium">{syllabus.phase_full_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Phase Short Name</label>
            <p className="mt-1 text-gray-900">{syllabus.phase_shortname}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Phase Symbol</label>
            <p className="mt-1 text-gray-900">{syllabus.phase_symbol || "—"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Flying Type</label>
            <p className="mt-1 text-gray-900">{syllabus.flying_type?.type_name || "—"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Phase Type</label>
            <p className="mt-1 text-gray-900">{syllabus.flying_phase_type?.type_name || "—"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Sort Order</label>
            <p className="mt-1 text-gray-900">{syllabus.phase_sort}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Phase Sorties</label>
            <p className="mt-1">
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                {syllabus.phase_sorties}
              </span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Phase Hours</label>
            <p className="mt-1">
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                {syllabus.phase_hours} hrs
              </span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Status</label>
            <p className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                syllabus.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                {syllabus.is_active ? "Active" : "Inactive"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:notebook" className="w-5 h-5 text-green-500" />
          Exercises ({syllabus.exercises?.length || 0})
        </h3>
        {syllabus.exercises && syllabus.exercises.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercise Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phase Type</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Time (Hrs)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {syllabus.exercises.map((exercise, index) => (
                  <tr key={exercise.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{exercise.exercise_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{exercise.exercise_shortname}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{exercise.phase_type?.type_name || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {exercise.take_time_hours}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${
                        exercise.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {exercise.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No exercises found for this syllabus.</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4">
        <button
          onClick={() => router.push("/ftw/11sqn/results/flying/syllabus")}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Back to List
        </button>
        <button
          onClick={() => router.push(`/ftw/11sqn/results/flying/syllabus/${syllabus.id}/edit`)}
          className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
        >
          <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
          Edit Syllabus
        </button>
      </div>
    </div>
  );
}
