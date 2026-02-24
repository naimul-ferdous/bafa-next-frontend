/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import type {
  Ftw11sqnFlyingSyllabus,
  Ftw11sqnFlyingSyllabusCreateData,
  Ftw11sqnFlyingPhaseType,
  Ftw11sqnFlyingSyllabusTypeCreateData,
  Ftw11sqnFlyingSyllabusExerciseCreateData,
  Ftw11sqnFlyingType
} from "@/libs/types/ftw11sqnFlying";
import { ftw11sqnFlyingTypeService } from "@/libs/services/ftw11sqnFlyingTypeService";
import { ftw11sqnFlyingPhaseTypeService } from "@/libs/services/ftw11sqnFlyingPhaseTypeService";

interface SyllabusFormProps {
  initialData?: Ftw11sqnFlyingSyllabus | null;
  onSubmit: (data: Ftw11sqnFlyingSyllabusCreateData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

interface ExerciseInput {
  id?: number;
  syllabus_type_id?: number; // Track the existing syllabus_type id for updates
  exercise_name: string;
  exercise_shortname: string;
  exercise_content: string;
  take_time_hours: number;
  remarks: string;
  exercise_sort: number;
  is_active: boolean;
  phase_type_id: number;
}

export interface SyllabusFormData {
  phase_full_name: string;
  phase_shortname: string;
  phase_symbol: string;
  phase_sort: number;
  flying_type_id: number;
  is_active: boolean;
  exercises: ExerciseInput[];
  // Map of phase_type_id to syllabus_type_id for existing types
  syllabusTypeIdMap: { [phaseTypeId: number]: number };
}

export default function SyllabusForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: SyllabusFormProps) {
  const [formData, setFormData] = useState<SyllabusFormData>({
    phase_full_name: "",
    phase_shortname: "",
    phase_symbol: "",
    phase_sort: 0,
    flying_type_id: 0,
    is_active: true,
    exercises: [],
    syllabusTypeIdMap: {},
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SyllabusFormData, string>>>({});
  const [flyingTypes, setFlyingTypes] = useState<Ftw11sqnFlyingType[]>([]);
  const [phaseTypes, setPhaseTypes] = useState<Ftw11sqnFlyingPhaseType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [exerciseTimeInputs, setExerciseTimeInputs] = useState<{ [key: string]: string }>({});

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
  const formatDecimalAsTime = (decimalHours: number): string => minutesToTimeString(decimalHoursToMinutes(decimalHours));

  // Calculate stats per phase type
  const phaseTypeStats = useMemo(() => {
    const stats: { [key: number]: { sorties: number; hours: number } } = {};
    phaseTypes.forEach(pt => {
      const exercises = formData.exercises.filter(ex => ex.phase_type_id === pt.id);
      const totalMinutes = exercises.reduce((sum, ex) => sum + decimalHoursToMinutes(ex.take_time_hours), 0);
      stats[pt.id] = {
        sorties: exercises.length,
        hours: minutesToDecimalHours(totalMinutes),
      };
    });
    return stats;
  }, [formData.exercises, phaseTypes]);

  // Handle sorties input change - auto add/remove exercises
  const handleSortiesChange = (phaseTypeId: number, newSorties: number) => {
    const phaseType = phaseTypes.find(pt => pt.id === phaseTypeId);
    if (!phaseType) return;

    setFormData(prev => {
      const otherExercises = prev.exercises.filter(ex => ex.phase_type_id !== phaseTypeId);
      const currentExercises = prev.exercises.filter(ex => ex.phase_type_id === phaseTypeId);
      const currentCount = currentExercises.length;

      let updatedExercises: ExerciseInput[];

      if (newSorties > currentCount) {
        // Add more exercises
        const newExercises: ExerciseInput[] = [];
        for (let i = currentCount; i < newSorties; i++) {
          newExercises.push({
            exercise_name: `${phaseType.type_name} ${i + 1}`,
            exercise_shortname: `${phaseType.type_code}${i + 1}`,
            exercise_content: "",
            take_time_hours: 0,
            remarks: "",
            exercise_sort: 0,
            is_active: true,
            phase_type_id: phaseTypeId,
          });
        }
        updatedExercises = [...otherExercises, ...currentExercises, ...newExercises];
      } else if (newSorties < currentCount) {
        // Remove exercises from the end
        updatedExercises = [...otherExercises, ...currentExercises.slice(0, newSorties)];
      } else {
        return prev;
      }

      // Re-sort all exercises
      return {
        ...prev,
        exercises: updatedExercises.map((ex, i) => ({ ...ex, exercise_sort: i })),
      };
    });
  };

  // Calculate totals
  const totalSorties = useMemo(() => formData.exercises.length, [formData.exercises]);
  const totalHoursMinutes = useMemo(() => {
    return formData.exercises.reduce((sum, ex) => sum + decimalHoursToMinutes(ex.take_time_hours), 0);
  }, [formData.exercises]);

  // Load flying types and phase types
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [flyingTypesRes, phaseTypesRes] = await Promise.all([
          ftw11sqnFlyingTypeService.getList(),
          ftw11sqnFlyingPhaseTypeService.getList()
        ]);
        setFlyingTypes(flyingTypesRes);
        setPhaseTypes(phaseTypesRes);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // Set default flying_type_id when flying types are loaded
  useEffect(() => {
    if (flyingTypes.length > 0 && !formData.flying_type_id && !initialData) {
      setFormData(prev => ({ ...prev, flying_type_id: flyingTypes[0]?.id || 0 }));
    }
  }, [flyingTypes, initialData, formData.flying_type_id]);

  // Load initial data for edit
  useEffect(() => {
    if (initialData && phaseTypes.length > 0) {
      // Build map of phase_type_id to syllabus_type_id
      const syllabusTypeIdMap: { [phaseTypeId: number]: number } = {};
      initialData.syllabus_types?.forEach(st => {
        syllabusTypeIdMap[st.ftw_11sqn_flying_phase_type_id] = st.id;
      });

      // Flatten all exercises from syllabus_types into a single array
      const allExercises: ExerciseInput[] = [];
      initialData.syllabus_types?.forEach(st => {
        st.exercises?.forEach(ex => {
          allExercises.push({
            id: ex.id,
            syllabus_type_id: st.id, // Track the existing syllabus_type id
            exercise_name: ex.exercise_name,
            exercise_shortname: ex.exercise_shortname,
            exercise_content: ex.exercise_content || "",
            take_time_hours: parseFloat(String(ex.take_time_hours)),
            remarks: ex.remarks || "",
            exercise_sort: ex.exercise_sort,
            is_active: ex.is_active,
            phase_type_id: st.ftw_11sqn_flying_phase_type_id,
          });
        });
      });

      // Sort by exercise_sort
      allExercises.sort((a, b) => a.exercise_sort - b.exercise_sort);

      setFormData({
        phase_full_name: initialData.phase_full_name,
        phase_shortname: initialData.phase_shortname,
        phase_symbol: initialData.phase_symbol || "",
        phase_sort: initialData.phase_sort,
        flying_type_id: initialData.flying_type_id,
        is_active: initialData.is_active,
        exercises: allExercises,
        syllabusTypeIdMap,
      });
    }
  }, [initialData, phaseTypes]);

  // Remove exercise
  const removeExercise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index).map((ex, i) => ({ ...ex, exercise_sort: i })),
    }));
  };

  // Update exercise field
  const updateExercise = (index: number, field: keyof ExerciseInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => {
        if (i !== index) return ex;
        return { ...ex, [field]: value };
      }),
    }));
  };

  // Get phase type info
  const getPhaseTypeName = (phaseTypeId: number) => phaseTypes.find(pt => pt.id === phaseTypeId)?.type_name || "Unknown";
  const getPhaseTypeCode = (phaseTypeId: number) => phaseTypes.find(pt => pt.id === phaseTypeId)?.type_code || "UNK";

  // Time input handlers
  const handleTimeInputChange = (key: string, value: string) => {
    setExerciseTimeInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleTimeInputBlur = (index: number, key: string) => {
    const inputValue = exerciseTimeInputs[key] || "";
    const totalMinutes = parseTimeToMinutes(inputValue);
    const decimalHours = minutesToDecimalHours(totalMinutes);
    updateExercise(index, "take_time_hours", decimalHours);
    setExerciseTimeInputs(prev => ({ ...prev, [key]: minutesToTimeString(totalMinutes) }));
  };

  const getTimeInputValue = (key: string, decimalHours: number): string => {
    if (exerciseTimeInputs[key] !== undefined) return exerciseTimeInputs[key];
    return formatDecimalAsTime(decimalHours);
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SyllabusFormData, string>> = {};
    if (!formData.phase_full_name.trim()) newErrors.phase_full_name = "Phase full name is required";
    if (!formData.phase_shortname.trim()) newErrors.phase_shortname = "Phase short name is required";
    if (!formData.flying_type_id) newErrors.flying_type_id = "Flying type is required";
    if (formData.exercises.length === 0) {
      newErrors.flying_type_id = "At least one exercise is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler - builds nested data structure for single API call
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Group exercises by phase_type_id
      const exercisesByType = new Map<number, ExerciseInput[]>();
      formData.exercises.forEach(ex => {
        const list = exercisesByType.get(ex.phase_type_id) || [];
        list.push(ex);
        exercisesByType.set(ex.phase_type_id, list);
      });

      // Build syllabus_types array
      const syllabusTypes: Ftw11sqnFlyingSyllabusTypeCreateData[] = [];
      exercisesByType.forEach((exercises, phaseTypeId) => {
        const totalMinutes = exercises.reduce((sum, ex) => sum + decimalHoursToMinutes(ex.take_time_hours), 0);

        // Look up existing syllabus_type_id from the map
        const existingSyllabusTypeId = formData.syllabusTypeIdMap[phaseTypeId];

        syllabusTypes.push({
          id: existingSyllabusTypeId, // Include id for existing syllabus_types
          ftw_11sqn_flying_phase_type_id: phaseTypeId,
          sorties: exercises.length,
          hours: minutesToDecimalHours(totalMinutes),
          is_active: true,
          exercises: exercises.map((ex, index) => {
            const exercise: Ftw11sqnFlyingSyllabusExerciseCreateData = {
              id: ex.id,
              exercise_name: ex.exercise_name.trim() || `${getPhaseTypeName(phaseTypeId)} ${index + 1}`,
              exercise_shortname: ex.exercise_shortname.trim() || `${getPhaseTypeCode(phaseTypeId)}${index + 1}`,
              exercise_content: ex.exercise_content || undefined,
              take_time_hours: ex.take_time_hours,
              remarks: ex.remarks || undefined,
              exercise_sort: index,
              is_active: ex.is_active,
            };
            return exercise;
          }),
        });
      });

      // Build the nested data structure
      const syllabusData: Ftw11sqnFlyingSyllabusCreateData = {
        phase_full_name: formData.phase_full_name,
        phase_shortname: formData.phase_shortname,
        phase_symbol: formData.phase_symbol || undefined,
        phase_sort: formData.phase_sort,
        flying_type_id: formData.flying_type_id,
        is_active: formData.is_active,
        syllabus_types: syllabusTypes,
      };

      // Single API call with all nested data
      await onSubmit(syllabusData);
    } catch (error: any) {
      console.error("Form submission error:", error);
      alert(error.response?.data?.message || "Failed to save flying syllabus");
    }
  };

  const handleChange = (field: keyof SyllabusFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:honor" className="w-5 h-5 text-blue-500" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phase Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.phase_full_name}
              onChange={(e) => handleChange("phase_full_name", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phase_full_name ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter phase full name"
            />
            {errors.phase_full_name && <p className="mt-1 text-sm text-red-500">{errors.phase_full_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phase Short Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.phase_shortname}
              onChange={(e) => handleChange("phase_shortname", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phase_shortname ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter phase short name"
            />
            {errors.phase_shortname && <p className="mt-1 text-sm text-red-500">{errors.phase_shortname}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phase Symbol</label>
            <input
              type="text"
              value={formData.phase_symbol}
              onChange={(e) => handleChange("phase_symbol", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phase symbol"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Flying Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.flying_type_id}
              onChange={(e) => handleChange("flying_type_id", parseInt(e.target.value))}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.flying_type_id ? "border-red-500" : "border-gray-300"}`}
            >
              <option value={0}>Select Flying Type</option>
              {flyingTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.type_name}</option>
              ))}
            </select>
            {errors.flying_type_id && <p className="mt-1 text-sm text-red-500">{errors.flying_type_id}</p>}
          </div>
          {phaseTypes.map((pt) => {
            const stats = phaseTypeStats[pt.id] || { sorties: 0, hours: 0 };
            return (
              <React.Fragment key={pt.id}>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{pt.type_name} Sorties Count</label>
                  <input
                    type="number"
                    min="0"
                    value={stats.sorties}
                    onChange={(e) => handleSortiesChange(pt.id, parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{pt.type_name} Total Hours</label>
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-700">
                    {formatDecimalAsTime(stats.hours)}
                  </div>
                  <p className="text-xs text-gray-500">Hours calculated from exercises</p>
                </div>
              </React.Fragment>
            );
          })}
          <div>
            <label className="block text-sm text-blue-600 mb-1">Total Sorties</label>
            <div className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-blue-800 font-semibold">
              {totalSorties}
            </div>
          </div>
          <div>
            <label className="block text-sm text-blue-600 mb-1">Total Hours</label>
            <div className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-blue-800 font-semibold">
              {minutesToTimeString(totalHoursMinutes)}
            </div>
          </div>
        </div>
      </div>

      {/* Exercises (All in one list) */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:notebook" className="w-5 h-5 text-purple-500" />
          Exercises ({formData.exercises.length})
        </h3>

        {formData.exercises.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
            <Icon icon="hugeicons:information-circle" className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Enter sorties count above to auto-generate exercises.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.exercises.map((exercise, index) => {
              const timeKey = `exercise-${index}`;
              return (
                <div key={index} className="p-4 rounded-lg border border-dashed border-gray-300 hover:border-gray-400">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">{index + 1}</span>
                      <span className="text-sm font-semibold text-gray-800">
                        Exercise #{index + 1}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        getPhaseTypeName(exercise.phase_type_id) === "Dual"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {getPhaseTypeName(exercise.phase_type_id)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      title="Remove Exercise"
                    >
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                      <select
                        value={exercise.phase_type_id}
                        onChange={(e) => updateExercise(index, "phase_type_id", parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {phaseTypes.map((pt) => (
                          <option key={pt.id} value={pt.id}>{pt.type_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Name</label>
                      <input
                        type="text"
                        value={exercise.exercise_name}
                        onChange={(e) => updateExercise(index, "exercise_name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`${getPhaseTypeName(exercise.phase_type_id)} ${index + 1}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                      <input
                        type="text"
                        value={exercise.exercise_shortname}
                        onChange={(e) => updateExercise(index, "exercise_shortname", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`${getPhaseTypeCode(exercise.phase_type_id)}${index + 1}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time (H:MM)</label>
                      <input
                        type="text"
                        value={getTimeInputValue(timeKey, exercise.take_time_hours)}
                        onChange={(e) => handleTimeInputChange(timeKey, e.target.value)}
                        onBlur={() => handleTimeInputBlur(index, timeKey)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0:00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                      <input
                        type="text"
                        value={exercise.remarks}
                        onChange={(e) => updateExercise(index, "remarks", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional remarks"
                      />
                    </div>
                    <div className="md:col-span-2 lg:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                      <textarea
                        value={exercise.exercise_content}
                        onChange={(e) => updateExercise(index, "exercise_content", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Exercise content"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="is_active"
              checked={formData.is_active === true}
              onChange={() => handleChange("is_active", true)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Active</div>
              <div className="text-sm text-gray-500">This flying syllabus will be available for use.</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="is_active"
              checked={formData.is_active === false}
              onChange={() => handleChange("is_active", false)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Inactive</div>
              <div className="text-sm text-gray-500">This flying syllabus will be hidden from use.</div>
            </div>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />
              {isEdit ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{isEdit ? "Update Syllabus" : "Create Syllabus"}</>
          )}
        </button>
      </div>
    </form>
  );
}