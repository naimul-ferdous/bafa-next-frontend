"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnFlyingSyllabusService } from "@/libs/services/ftw12sqnFlyingSyllabusService";
import FullLogo from "@/components/ui/fulllogo";
import type { Ftw12sqnFlyingSyllabus, Ftw12sqnFlyingSyllabusExercise, Ftw12sqnFlyingSyllabusCreateData } from "@/libs/types/ftw12sqnFlying";
import { Ftw12sqnExerciseModalProvider, useFtw12sqnExerciseModal } from "@/context/Ftw12sqnExerciseModalContext";
import ExerciseFormModal from "@/components/ftw-12sqn-flying/ExerciseFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

interface AggregatedExercise extends Ftw12sqnFlyingSyllabusExercise {
  phase_type_name?: string;
  syllabus_type_id: number;
}

function ViewFlyingSyllabusContent() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { openModal } = useFtw12sqnExerciseModal();

  const [syllabus, setSyllabus] = useState<Ftw12sqnFlyingSyllabus | null>(null);
  const [loading, setLoading] = useState(true);

  // Status toggle modal state for exercise
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusExercise, setStatusExercise] = useState<AggregatedExercise | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const loadSyllabus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ftw12sqnFlyingSyllabusService.get(id, { include_inactive: true });
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

  // Listen for updates from modal
  useEffect(() => {
    const handleUpdate = () => loadSyllabus();
    window.addEventListener('syllabusUpdated', handleUpdate);
    return () => window.removeEventListener('syllabusUpdated', handleUpdate);
  }, [loadSyllabus]);

  // Derived data
  const aggregated = useMemo(() => {
    if (!syllabus?.syllabus_types) return { sorties: 0, hours: 0, exercises: [], types: [] };
    
    let totalSorties = 0;
    let totalHours = 0;
    let exercises: AggregatedExercise[] = [];
    
    syllabus.syllabus_types.forEach(st => {
      totalSorties += (st.sorties || 0);
      totalHours += parseFloat(String(st.hours || 0));
      if (st.exercises) {
        const mappedExercises: AggregatedExercise[] = st.exercises.map(ex => ({
          ...ex,
          phase_type_name: st.phase_type?.type_name,
          syllabus_type_id: st.id
        }));
        exercises = [...exercises, ...mappedExercises];
      }
    });

    return {
      sorties: totalSorties,
      hours: totalHours,
      exercises: exercises.sort((a, b) => (a.exercise_sort || 0) - (b.exercise_sort || 0)),
      types: syllabus.syllabus_types
    };
  }, [syllabus]);

  // Actions
  const handleEditExercise = (exercise: AggregatedExercise) => {
    const syllabusType = aggregated.types.find(t => t.id === exercise.syllabus_type_id);
    openModal(exercise, syllabusType?.ftw_12sqn_flying_phase_type_id, id);
  };

  const handleAddExercise = () => {
    openModal(undefined, undefined, id);
  };

  const handleToggleExerciseStatus = (exercise: AggregatedExercise) => {
    setStatusExercise(exercise);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusExercise || !syllabus) return;

    try {
      setStatusLoading(true);
      
      const updatedSyllabusData: Partial<Ftw12sqnFlyingSyllabusCreateData> = {
        phase_full_name: syllabus.phase_full_name,
        phase_shortname: syllabus.phase_shortname,
        phase_symbol: syllabus.phase_symbol,
        phase_sort: syllabus.phase_sort,
        flying_type_id: syllabus.flying_type_id,
        course_id: syllabus.course_id,
        semester_id: syllabus.semester_id,
        is_active: syllabus.is_active,
        syllabus_types: syllabus.syllabus_types?.map(st => ({
            id: st.id,
            ftw_12sqn_flying_phase_type_id: st.ftw_12sqn_flying_phase_type_id,
            sorties: st.sorties,
            hours: Number(st.hours),
            is_active: st.is_active,
            exercises: st.exercises?.map(ex => ({
                id: ex.id,
                exercise_name: ex.exercise_name,
                exercise_shortname: ex.exercise_shortname,
                exercise_content: ex.exercise_content ?? undefined,
                take_time_hours: Number(ex.take_time_hours),
                remarks: ex.remarks ?? undefined,
                exercise_sort: ex.exercise_sort,
                is_active: ex.id === statusExercise.id ? !ex.is_active : ex.is_active,
            })) || []
        }))
      };

      await ftw12sqnFlyingSyllabusService.update(id, updatedSyllabusData);
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
          <p className="text-red-600">Flying Syllabus not found</p>
          <button
            onClick={() => router.push("/ftw/12sqn/results/flying/syllabus")}
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
          onClick={() => router.push("/ftw/12sqn/results/flying/syllabus")}
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
            onClick={() => router.push(`/ftw/12sqn/results/flying/syllabus/${syllabus.id}/edit`)}
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
            Flying Syllabus Details - FTW 12 SQN - {syllabus.phase_full_name}
          </p>
        </div>

        {/* Basic Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Basic Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Phase Full Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.phase_full_name}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Phase Short Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.phase_shortname}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Phase Symbol</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.phase_symbol || "—"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Flying Type</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{syllabus.flying_type?.type_name || "—"}</span>
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
              <span className="text-gray-900 flex-1 font-mono">{syllabus.phase_sort}</span>
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

        {/* Phase Summary Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Phase Summary
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Total Sorties</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold text-blue-600">{aggregated.sorties}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Total Hours</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold text-green-600">{aggregated.hours.toFixed(2)} hrs</span>
            </div>
            {aggregated.types.map(type => (
              <div key={type.id} className="flex col-span-2">
                <span className="w-48 text-gray-900 font-medium">{type.phase_type?.type_name}</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1">
                  {type.sorties} Sorties, {type.hours} Hours
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Exercises List Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4 pb-1 border-b border-dashed border-gray-400">
            <h2 className="text-lg font-bold text-gray-900">
              Exercises List ({aggregated.exercises.length})
            </h2>
            <div className="flex gap-2 no-print">
              <button
                onClick={handleAddExercise}
                className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-200 hover:bg-blue-100 transition-all flex items-center gap-1"
              >
                <Icon icon="hugeicons:add-circle" className="w-3.5 h-3.5" />
                Add Exercise
              </button>
            </div>
          </div>
          
          <table className="w-full border-collapse border border-gray-900">
            <thead>
              <tr>
                <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold w-12">SL.</th>
                <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Short Name</th>
                <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Exercise Name</th>
                <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Phase Type</th>
                <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold">Time (Hrs)</th>
                <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold w-24">Status</th>
                <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold w-24 no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {aggregated.exercises.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-gray-900 px-4 py-8 text-center text-gray-500 italic">
                    No exercises found for this syllabus.
                  </td>
                </tr>
              ) : (
                aggregated.exercises.map((exercise, index) => (
                  <tr key={exercise.id} className="hover:bg-gray-50 group cursor-pointer" onClick={() => handleEditExercise(exercise)}>
                    <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">{index + 1}</td>
                    <td className="border border-gray-900 px-4 py-2 font-bold text-blue-700">{exercise.exercise_shortname}</td>
                    <td className="border border-gray-900 px-4 py-2 text-gray-900">{exercise.exercise_name}</td>
                    <td className="border border-gray-900 px-4 py-2 text-gray-600">{exercise.phase_type_name || "—"}</td>
                    <td className="border border-gray-900 px-4 py-2 text-center">
                      <span className="font-mono font-bold">{exercise.take_time_hours}</span>
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
          </table>
        </div>

        {/* Footer with date */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <ExerciseFormModal />
      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusExercise?.is_active ? "Deactivate Exercise" : "Activate Exercise"}
        message={`Are you sure you want to ${statusExercise?.is_active ? "deactivate" : "activate"} the exercise "${statusExercise?.exercise_name}"?`}
        confirmText={statusExercise?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusExercise?.is_active ? "danger" : "success"}
      />
    </div>
  );
}

export default function ViewFlyingSyllabusPage() {
    return (
        <Ftw12sqnExerciseModalProvider>
            <ViewFlyingSyllabusContent />
        </Ftw12sqnExerciseModalProvider>
    );
}
