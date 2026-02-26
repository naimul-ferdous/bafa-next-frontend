/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { ftw11sqnFlyingSyllabusService } from "@/libs/services/ftw11sqnFlyingSyllabusService";
import { ftw11sqnFlyingPhaseTypeService } from "@/libs/services/ftw11sqnFlyingPhaseTypeService";
import { useExerciseModal } from "@/context/ExerciseModalContext";
import FullLogo from "@/components/ui/fulllogo";
import { Icon } from "@iconify/react";
import type { Ftw11sqnFlyingPhaseType } from "@/libs/types/ftw11sqnFlying";

export default function ExerciseFormModal() {
  const { isOpen, editingExercise, initialPhaseTypeId, syllabusId, closeModal } = useExerciseModal();

  const [phaseTypes, setPhaseTypes] = useState<Ftw11sqnFlyingPhaseType[]>([]);
  const [phaseTypesLoading, setPhaseTypesLoading] = useState(false);

  const [formData, setFormData] = useState({
    phaseTypeId: null as number | null,
    exercise_name: "",
    exercise_shortname: "",
    exercise_content: "",
    take_time_hours: 0 as number,
    remarks: "",
    exercise_sort: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeInput, setTimeInput] = useState("");

  // Time conversion helpers
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr || timeStr.trim() === "") return 0;
    const cleanStr = timeStr.replace(".", ":");
    if (cleanStr.includes(":")) {
      const parts = cleanStr.split(":");
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      return hours * 60 + minutes;
    }
    const num = parseFloat(timeStr);
    if (!isNaN(num)) return Math.round(num * 60);
    return 0;
  };

  const minutesToTimeString = (totalMinutes: number): string => {
    if (totalMinutes <= 0) return "0:00";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  const decimalHoursToMinutes = (decimalHours: number): number => Math.round(decimalHours * 60);
  const minutesToDecimalHours = (totalMinutes: number): number => Math.round((totalMinutes / 60) * 100) / 100;

  // Fetch all phase types once on mount
  useEffect(() => {
    setPhaseTypesLoading(true);
    ftw11sqnFlyingPhaseTypeService
      .getList()
      .then(setPhaseTypes)
      .finally(() => setPhaseTypesLoading(false));
  }, []);

  // Populate form whenever modal opens
  useEffect(() => {
    if (editingExercise) {
      const decimalHours = parseFloat(String(editingExercise.take_time_hours || 0));
      setFormData({
        phaseTypeId: initialPhaseTypeId,
        exercise_name: editingExercise.exercise_name,
        exercise_shortname: editingExercise.exercise_shortname,
        exercise_content: editingExercise.exercise_content || "",
        take_time_hours: decimalHours,
        remarks: editingExercise.remarks || "",
        exercise_sort: editingExercise.exercise_sort,
        is_active: editingExercise.is_active !== false,
      });
      setTimeInput(minutesToTimeString(decimalHoursToMinutes(decimalHours)));
    } else {
      setFormData({
        phaseTypeId: initialPhaseTypeId,
        exercise_name: "",
        exercise_shortname: "",
        exercise_content: "",
        take_time_hours: 0,
        remarks: "",
        exercise_sort: 0,
        is_active: true,
      });
      setTimeInput("0:00");
    }
    setError("");
  }, [editingExercise, isOpen, initialPhaseTypeId]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTimeInputBlur = () => {
    const totalMinutes = parseTimeToMinutes(timeInput);
    const decimalHours = minutesToDecimalHours(totalMinutes);
    setFormData(prev => ({ ...prev, take_time_hours: decimalHours }));
    setTimeInput(minutesToTimeString(totalMinutes));
  };

  /** Recalculate sorties (active count) and total hours for a type's exercise list */
  const recalcType = (exercises: any[]) => {
    const sorties = exercises.filter((ex: any) => ex.is_active !== false).length;
    const hours = parseFloat(
      exercises
        .reduce((sum: number, ex: any) => sum + parseFloat(String(ex.take_time_hours || 0)), 0)
        .toFixed(2)
    );
    return { sorties, hours };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!syllabusId) {
      setError("Syllabus ID is missing");
      return;
    }
    if (!formData.phaseTypeId) {
      setError("Please select a Phase Type");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 1. Fetch current full syllabus
      const syllabus = await ftw11sqnFlyingSyllabusService.get(syllabusId);
      if (!syllabus) throw new Error("Syllabus not found");

      const selectedPhaseTypeId = formData.phaseTypeId;

      // Exercise fields (no phaseTypeId)
      const exercisePayload: any = {
        exercise_name: formData.exercise_name,
        exercise_shortname: formData.exercise_shortname,
        exercise_content: formData.exercise_content || null,
        take_time_hours: formData.take_time_hours,
        remarks: formData.remarks || null,
        exercise_sort: formData.exercise_sort,
        is_active: formData.is_active,
      };

      // 2. Build a mutable copy of syllabus_types with exercises
      let syllabusTypes: any[] = (syllabus.syllabus_types || []).map(st => ({
        id: st.id,
        ftw_11sqn_flying_phase_type_id: st.ftw_11sqn_flying_phase_type_id,
        sorties: st.sorties,
        hours: Number(st.hours),
        is_active: st.is_active,
        exercises: (st.exercises || []).map(ex => ({
          id: ex.id,
          exercise_name: ex.exercise_name,
          exercise_shortname: ex.exercise_shortname,
          exercise_content: ex.exercise_content ?? null,
          take_time_hours: parseFloat(String(ex.take_time_hours || 0)),
          remarks: ex.remarks ?? null,
          exercise_sort: ex.exercise_sort,
          is_active: ex.is_active,
        })),
      }));

      if (editingExercise) {
        // ── EDIT ──────────────────────────────────────────────────────────────
        const oldPhaseTypeId = initialPhaseTypeId;
        const phaseTypeChanged = selectedPhaseTypeId !== oldPhaseTypeId;

        if (phaseTypeChanged && oldPhaseTypeId) {
          // Remove from old type
          syllabusTypes = syllabusTypes.map(st => {
            if (st.ftw_11sqn_flying_phase_type_id === oldPhaseTypeId) {
              const exercises = st.exercises.filter((ex: any) => ex.id !== editingExercise.id);
              return { ...st, exercises, ...recalcType(exercises) };
            }
            return st;
          });

          // Add to new type (find or create)
          const targetIdx = syllabusTypes.findIndex(
            st => st.ftw_11sqn_flying_phase_type_id === selectedPhaseTypeId
          );
          if (targetIdx >= 0) {
            syllabusTypes[targetIdx].exercises.push({ ...exercisePayload, id: editingExercise.id });
            Object.assign(syllabusTypes[targetIdx], recalcType(syllabusTypes[targetIdx].exercises));
          } else {
            const newExercises = [{ ...exercisePayload, id: editingExercise.id }];
            syllabusTypes.push({
              ftw_11sqn_flying_phase_type_id: selectedPhaseTypeId,
              is_active: true,
              exercises: newExercises,
              ...recalcType(newExercises),
            });
          }
        } else {
          // Same phase type — update exercise in place
          syllabusTypes = syllabusTypes.map(st => {
            if (st.ftw_11sqn_flying_phase_type_id === selectedPhaseTypeId) {
              const exercises = st.exercises.map((ex: any) =>
                ex.id === editingExercise.id ? { ...ex, ...exercisePayload } : ex
              );
              return { ...st, exercises, ...recalcType(exercises) };
            }
            return st;
          });
        }
      } else {
        // ── ADD ───────────────────────────────────────────────────────────────
        const targetIdx = syllabusTypes.findIndex(
          st => st.ftw_11sqn_flying_phase_type_id === selectedPhaseTypeId
        );
        if (targetIdx >= 0) {
          syllabusTypes[targetIdx].exercises.push({ ...exercisePayload });
          Object.assign(syllabusTypes[targetIdx], recalcType(syllabusTypes[targetIdx].exercises));
        } else {
          // Phase type doesn't exist for this syllabus yet — create it
          const newExercises = [{ ...exercisePayload }];
          syllabusTypes.push({
            ftw_11sqn_flying_phase_type_id: selectedPhaseTypeId,
            is_active: true,
            exercises: newExercises,
            ...recalcType(newExercises),
          });
        }
      }

      // 3. Send full update
      await ftw11sqnFlyingSyllabusService.update(syllabusId, {
        phase_full_name: syllabus.phase_full_name,
        phase_shortname: syllabus.phase_shortname,
        phase_symbol: syllabus.phase_symbol,
        phase_sort: syllabus.phase_sort,
        flying_type_id: syllabus.flying_type_id,
        is_active: syllabus.is_active,
        syllabus_types: syllabusTypes,
      });

      closeModal();
      window.dispatchEvent(new CustomEvent("syllabusUpdated"));
    } catch (err: any) {
      setError(err.message || "Failed to save exercise");
    } finally {
      setLoading(false);
    }
  };

  const selectedPhaseType = phaseTypes.find(pt => pt.id === formData.phaseTypeId);

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-2xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <FullLogo />
          <h2 className="text-xl font-bold text-gray-900 mt-2">
            {editingExercise ? "Edit Exercise" : "Add a New Exercise"}
          </h2>
          <p className="text-sm text-gray-500">
            {editingExercise ? "Update exercise details" : "Configure your new exercise details"}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
            <Icon icon="hugeicons:alert-circle" className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Phase Type Selector */}
          <div>
            <Label>
              Phase Type <span className="text-red-500">*</span>
            </Label>
            {phaseTypesLoading ? (
              <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />
                Loading types...
              </div>
            ) : (
              <div className="flex gap-3 mt-1 flex-wrap">
                {phaseTypes.map(pt => {
                  const isSolo = pt.type_code === "solo";
                  const isSelected = formData.phaseTypeId === pt.id;
                  return (
                    <label
                      key={pt.id}
                      className={`flex items-center gap-2 px-5 py-2 rounded-lg border-2 cursor-pointer transition-all select-none font-semibold text-sm ${
                        isSelected
                          ? isSolo
                            ? "border-orange-400 bg-orange-50 text-orange-700"
                            : "border-blue-400 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="phaseTypeId"
                        value={pt.id}
                        checked={isSelected}
                        onChange={() => handleChange("phaseTypeId", pt.id)}
                        className="sr-only"
                      />
                      <Icon
                        icon={isSolo ? "hugeicons:user" : "hugeicons:user-multiple-02"}
                        className="w-4 h-4"
                      />
                      {pt.type_name}
                      {isSelected && (
                        <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
                      )}
                    </label>
                  );
                })}
              </div>
            )}
            {selectedPhaseType && (
              <p className="text-xs text-gray-400 mt-1">
                Exercise will be saved under the{" "}
                <strong className="text-gray-600">{selectedPhaseType.type_name}</strong> type.
                {" "}Sorties & Hours will be recalculated automatically.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <Label>
                Exercise Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.exercise_name}
                onChange={(e) => handleChange("exercise_name", e.target.value)}
                placeholder="Enter exercise name"
                required
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <Label>
                Short Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.exercise_shortname}
                onChange={(e) => handleChange("exercise_shortname", e.target.value)}
                placeholder="Enter short name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Time (H:MM) <span className="text-red-500">*</span></Label>
              <Input
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                onBlur={handleTimeInputBlur}
                placeholder="0:00"
                required
              />
            </div>

            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.exercise_sort}
                onChange={(e) => handleChange("exercise_sort", parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label>Remarks</Label>
            <Input
              value={formData.remarks}
              onChange={(e) => handleChange("remarks", e.target.value)}
              placeholder="Optional remarks"
            />
          </div>

          <div>
            <Label>Content</Label>
            <textarea
              value={formData.exercise_content}
              onChange={(e) => handleChange("exercise_content", e.target.value)}
              placeholder="Exercise content details..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="is_active"
                  checked={formData.is_active === true}
                  onChange={() => handleChange("is_active", true)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-900">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="is_active"
                  checked={formData.is_active === false}
                  onChange={() => handleChange("is_active", false)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-900">Inactive</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            onClick={closeModal}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md"
            disabled={loading}
          >
            {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
            {editingExercise ? "Update Exercise" : "Save Exercise"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
