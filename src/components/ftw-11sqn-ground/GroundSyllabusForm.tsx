/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import type {
  Ftw11sqnGroundSyllabus,
  Ftw11sqnGroundSyllabusCreateData,
  Ftw11sqnGroundSyllabusExerciseCreateData,
} from "@/libs/types/ftw11sqnFlying";

interface GroundSyllabusFormProps {
  initialData?: Ftw11sqnGroundSyllabus | null;
  onSubmit: (data: Ftw11sqnGroundSyllabusCreateData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

interface ExerciseInput {
  id?: number;
  exercise_name: string;
  exercise_shortname: string;
  exercise_content: string;
  exercise_remarks: string;
  exercise_sort: number;
  max_mark: number;
  is_active: boolean;
}

export interface GroundSyllabusFormData {
  ground_full_name: string;
  ground_shortname: string;
  ground_symbol: string;
  ground_sort: number;
  no_of_test: number;
  highest_mark: number;
  is_active: boolean;
  exercises: ExerciseInput[];
}

export default function GroundSyllabusForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: GroundSyllabusFormProps) {
  const [formData, setFormData] = useState<GroundSyllabusFormData>({
    ground_full_name: "",
    ground_shortname: "",
    ground_symbol: "",
    ground_sort: 0,
    no_of_test: 0,
    highest_mark: 0,
    is_active: true,
    exercises: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof GroundSyllabusFormData, string>>>({});

  // Calculate total max marks from exercises
  const totalMaxMarks = useMemo(() => {
    return formData.exercises.reduce((sum, ex) => sum + (ex.max_mark || 0), 0);
  }, [formData.exercises]);

  // Handle number of tests change - auto add/remove exercises
  const handleNoOfTestChange = (newCount: number) => {
    setFormData(prev => {
      const currentCount = prev.exercises.length;
      let updatedExercises: ExerciseInput[];

      if (newCount > currentCount) {
        // Add more exercises
        const newExercises: ExerciseInput[] = [];
        for (let i = currentCount; i < newCount; i++) {
          newExercises.push({
            exercise_name: `Test ${i + 1}`,
            exercise_shortname: `T${i + 1}`,
            exercise_content: "",
            exercise_remarks: "",
            exercise_sort: i,
            max_mark: 0,
            is_active: true,
          });
        }
        updatedExercises = [...prev.exercises, ...newExercises];
      } else if (newCount < currentCount) {
        // Remove exercises from the end
        updatedExercises = prev.exercises.slice(0, newCount);
      } else {
        return prev;
      }

      return {
        ...prev,
        no_of_test: newCount,
        exercises: updatedExercises.map((ex, i) => ({ ...ex, exercise_sort: i })),
      };
    });
  };

  // Load initial data for edit
  useEffect(() => {
    if (initialData) {
      const exercises: ExerciseInput[] = (initialData.exercises || []).map((ex, index) => ({
        id: ex.id,
        exercise_name: ex.exercise_name,
        exercise_shortname: ex.exercise_shortname,
        exercise_content: ex.exercise_content || "",
        exercise_remarks: ex.exercise_remarks || "",
        exercise_sort: ex.exercise_sort || index,
        max_mark: parseFloat(String(ex.max_mark || 0)),
        is_active: ex.is_active,
      }));

      // Sort by exercise_sort
      exercises.sort((a, b) => a.exercise_sort - b.exercise_sort);

      setFormData({
        ground_full_name: initialData.ground_full_name,
        ground_shortname: initialData.ground_shortname,
        ground_symbol: initialData.ground_symbol || "",
        ground_sort: initialData.ground_sort,
        no_of_test: initialData.no_of_test,
        highest_mark: parseFloat(String(initialData.highest_mark || 0)),
        is_active: initialData.is_active,
        exercises: exercises,
      });
    }
  }, [initialData]);


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

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof GroundSyllabusFormData, string>> = {};
    if (!formData.ground_full_name.trim()) newErrors.ground_full_name = "Ground subject name is required";
    if (!formData.ground_shortname.trim()) newErrors.ground_shortname = "Short name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const exercises: Ftw11sqnGroundSyllabusExerciseCreateData[] = formData.exercises.map((ex, index) => ({
        id: ex.id,
        exercise_name: ex.exercise_name.trim() || `Test ${index + 1}`,
        exercise_shortname: ex.exercise_shortname.trim() || `T${index + 1}`,
        exercise_content: ex.exercise_content || undefined,
        exercise_remarks: ex.exercise_remarks || undefined,
        exercise_sort: index,
        max_mark: ex.max_mark,
        is_active: ex.is_active,
      }));

      const syllabusData: Ftw11sqnGroundSyllabusCreateData = {
        ground_full_name: formData.ground_full_name,
        ground_shortname: formData.ground_shortname,
        ground_symbol: formData.ground_symbol || undefined,
        ground_sort: formData.ground_sort,
        no_of_test: formData.exercises.length,
        highest_mark: formData.highest_mark,
        is_active: formData.is_active,
        exercises: exercises,
      };

      await onSubmit(syllabusData);
    } catch (error: any) {
      console.error("Form submission error:", error);
      alert(error.response?.data?.message || "Failed to save ground syllabus");
    }
  };

  const handleChange = (field: keyof GroundSyllabusFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:honor" className="w-5 h-5 text-blue-500" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ground Subject Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.ground_full_name}
              onChange={(e) => handleChange("ground_full_name", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.ground_full_name ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter ground subject name"
            />
            {errors.ground_full_name && <p className="mt-1 text-sm text-red-500">{errors.ground_full_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.ground_shortname}
              onChange={(e) => handleChange("ground_shortname", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.ground_shortname ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter short name"
            />
            {errors.ground_shortname && <p className="mt-1 text-sm text-red-500">{errors.ground_shortname}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
            <input
              type="text"
              value={formData.ground_symbol}
              onChange={(e) => handleChange("ground_symbol", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter symbol (e.g., I, II, III)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Tests</label>
            <input
              type="number"
              min="0"
              value={formData.no_of_test}
              onChange={(e) => handleNoOfTestChange(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-generates test exercises</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Highest Mark</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.highest_mark}
              onChange={(e) => handleChange("highest_mark", parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Max Marks</label>
            <div className="w-full px-4 py-2 border border-green-200 rounded-lg bg-green-50 text-green-800 font-semibold">
              {totalMaxMarks}
            </div>
            <p className="text-xs text-gray-500 mt-1">Sum of all tests max marks</p>
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:notebook" className="w-5 h-5 text-purple-500" />
          Tests 
        </h3>

        {formData.exercises.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
            <Icon icon="hugeicons:information-circle" className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Enter number of tests above to auto-generate exercises.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.exercises.map((exercise, index) => (
              <div key={index} className="p-4 rounded-lg border border-dashed border-gray-300 hover:border-gray-400">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">{index + 1}</span>
                  <span className="text-sm font-semibold text-gray-800">
                    Test #{index + 1}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                    <input
                      type="text"
                      value={exercise.exercise_name}
                      onChange={(e) => updateExercise(index, "exercise_name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Test ${index + 1}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                    <input
                      type="text"
                      value={exercise.exercise_shortname}
                      onChange={(e) => updateExercise(index, "exercise_shortname", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`T${index + 1}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Mark</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={exercise.max_mark}
                      onChange={(e) => updateExercise(index, "max_mark", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <input
                      type="text"
                      value={exercise.exercise_remarks}
                      onChange={(e) => updateExercise(index, "exercise_remarks", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional remarks"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={exercise.is_active ? "active" : "inactive"}
                      onChange={(e) => updateExercise(index, "is_active", e.target.value === "active")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      value={exercise.exercise_content}
                      onChange={(e) => updateExercise(index, "exercise_content", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Test content description"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
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
              <div className="text-sm text-gray-500">This ground syllabus will be available for use.</div>
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
              <div className="text-sm text-gray-500">This ground syllabus will be hidden from use.</div>
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
