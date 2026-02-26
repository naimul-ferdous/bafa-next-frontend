"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw11sqnGroundSyllabusService } from "@/libs/services/ftw11sqnGroundSyllabusService";
import FullLogo from "@/components/ui/fulllogo";
import type { Ftw11sqnGroundSyllabus, Ftw11sqnGroundSyllabusExercise, Ftw11sqnGroundSyllabusCreateData } from "@/libs/types/ftw11sqnFlying";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

export default function ViewGroundSyllabusPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [syllabus, setSyllabus] = useState<Ftw11sqnGroundSyllabus | null>(null);
  const [loading, setLoading] = useState(true);

  // Status toggle modal state for exercise
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusExercise, setStatusExercise] = useState<Ftw11sqnGroundSyllabusExercise | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const loadSyllabus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ftw11sqnGroundSyllabusService.get(id, { include_inactive: true });
      setSyllabus(data);
    } catch (error) {
      console.error("Failed to load syllabus:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadSyllabus();
    }
  }, [id, loadSyllabus]);

  // Derived data
  const aggregated = useMemo(() => {
    if (!syllabus?.exercises) return { totalMaxMark: 0, exercises: [] };
    
    let totalMaxMark = 0;
    const exercises = [...syllabus.exercises];
    
    exercises.forEach(ex => {
      totalMaxMark += parseFloat(String(ex.max_mark || 0));
    });

    return {
      totalMaxMark,
      exercises: exercises.sort((a, b) => (a.exercise_sort || 0) - (b.exercise_sort || 0))
    };
  }, [syllabus]);

  // Actions
  const handleEditExercise = (exercise: Ftw11sqnGroundSyllabusExercise) => {
    // For ground syllabus, we redirect to the main edit page since exercises are managed there
    router.push(`/ftw/11sqn/results/ground/syllabus/${id}/edit`);
  };

  const handleToggleExerciseStatus = (exercise: Ftw11sqnGroundSyllabusExercise) => {
    setStatusExercise(exercise);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusExercise || !syllabus) return;

    try {
      setStatusLoading(true);
      
      const updatedSyllabusData: Partial<Ftw11sqnGroundSyllabusCreateData> = {
        ground_full_name: syllabus.ground_full_name,
        ground_shortname: syllabus.ground_shortname,
        ground_symbol: syllabus.ground_symbol,
        ground_sort: syllabus.ground_sort,
        no_of_test: syllabus.no_of_test,
        highest_mark: Number(syllabus.highest_mark),
        course_id: syllabus.course_id,
        semester_id: syllabus.semester_id,
        is_active: syllabus.is_active,
        exercises: syllabus.exercises?.map(ex => ({
            id: ex.id,
            exercise_name: ex.exercise_name,
            exercise_shortname: ex.exercise_shortname,
            exercise_content: ex.exercise_content ?? undefined,
            exercise_remarks: ex.exercise_remarks ?? undefined,
            exercise_sort: ex.exercise_sort,
            max_mark: Number(ex.max_mark),
            is_active: ex.id === statusExercise.id ? !ex.is_active : ex.is_active,
        })) || []
      };

      await ftw11sqnGroundSyllabusService.update(id, updatedSyllabusData);
      await loadSyllabus();
      setStatusModalOpen(false);
      setStatusExercise(null);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading syllabus details...</p>
        </div>
      </div>
    );
  }

  if (!syllabus) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">Ground Syllabus not found</p>
          <button
            onClick={() => router.push("/ftw/11sqn/results/ground/syllabus")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to List
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
          onClick={() => router.push("/ftw/11sqn/results/ground/syllabus")}
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
            onClick={() => router.push(`/ftw/11sqn/results/ground/syllabus/${syllabus.id}/edit`)}
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
            Basic Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Subject Full Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.ground_full_name}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Short Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.ground_shortname}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Symbol</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.ground_symbol || "—"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Course</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 uppercase font-bold text-blue-700">{syllabus.course?.name || "—"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Semester</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 uppercase font-bold text-blue-700">{syllabus.semester?.name || "—"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Sort Order</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-mono">{syllabus.ground_sort}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  syllabus.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {syllabus.is_active ? "Active" : "Inactive"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Assessment Summary Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Assessment Summary
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Number of Tests</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold text-blue-600">{syllabus.no_of_test}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Highest Mark</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold text-green-600">{syllabus.highest_mark}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Component Total</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold text-purple-600">{aggregated.totalMaxMark}</span>
            </div>
          </div>
        </div>

        {/* Components List Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4 pb-1 border-b border-dashed border-gray-400">
            <h2 className="text-lg font-bold text-gray-900">
              Subject Components / Topics ({aggregated.exercises.length})
            </h2>
          </div>
          
          <table className="w-full border-collapse border border-gray-900">
            <thead>
              <tr>
                <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold w-12">SL.</th>
                <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Short Name</th>
                <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Component Name</th>
                <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold w-24">Max Mark</th>
                <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold w-24">Status</th>
                <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold w-24 no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {aggregated.exercises.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-gray-900 px-4 py-8 text-center text-gray-500 italic">
                    No components found for this syllabus.
                  </td>
                </tr>
              ) : (
                aggregated.exercises.map((exercise, index) => (
                  <tr key={exercise.id} className="hover:bg-gray-50 group cursor-pointer" onClick={() => handleEditExercise(exercise)}>
                    <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">{index + 1}</td>
                    <td className="border border-gray-900 px-4 py-2 font-bold text-blue-700">{exercise.exercise_shortname}</td>
                    <td className="border border-gray-900 px-4 py-2 text-gray-900">
                        <div>{exercise.exercise_name}</div>
                        {exercise.exercise_content && (
                            <div className="text-[10px] text-gray-500 mt-0.5">{exercise.exercise_content}</div>
                        )}
                    </td>
                    <td className="border border-gray-900 px-4 py-2 text-center">
                      <span className="font-mono font-bold">{exercise.max_mark}</span>
                    </td>
                    <td className="border border-gray-900 px-4 py-2 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        exercise.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {exercise.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="border border-gray-900 px-4 py-2 text-center no-print" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                            <button
                                onClick={() => handleEditExercise(exercise)}
                                className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                                title="Edit"
                            >
                                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleToggleExerciseStatus(exercise)}
                                className={`p-1 rounded transition-colors ${exercise.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                title={exercise.is_active ? "Deactivate" : "Activate"}
                            >
                                <Icon icon={exercise.is_active ? "hugeicons:unavailable" : "hugeicons:checkmark-circle-02"} className="w-4 h-4" />
                            </button>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {aggregated.exercises.length > 0 && (
                <tfoot>
                    <tr className="bg-gray-50 font-bold">
                        <td colSpan={3} className="border border-gray-900 px-4 py-2 text-right uppercase text-xs">Total:</td>
                        <td className="border border-gray-900 px-4 py-2 text-center">{aggregated.totalMaxMark}</td>
                        <td colSpan={2} className="border border-gray-900"></td>
                    </tr>
                </tfoot>
            )}
          </table>
        </div>

        {/* Footer with date */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusExercise?.is_active ? "Deactivate Component" : "Activate Component"}
        message={`Are you sure you want to ${statusExercise?.is_active ? "deactivate" : "activate"} the component "${statusExercise?.exercise_name}"?`}
        confirmText={statusExercise?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusExercise?.is_active ? "danger" : "success"}
      />
    </div>
  );
}
