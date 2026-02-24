/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { CtwArmsDrillAssessmentEstimatedMark, CtwArmsDrillAssessmentEstimatedMarkCreateData } from "@/libs/types/ctwArmsDrill";
import type { SystemSemester, SystemExam } from "@/libs/types/system";
import { semesterService } from "@/libs/services/semesterService";
import { examService } from "@/libs/services/examService";

interface ArmsDrillEstimatedMarkFormProps {
  initialData?: CtwArmsDrillAssessmentEstimatedMark | null;
  onSubmit: (data: CtwArmsDrillAssessmentEstimatedMarkCreateData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export interface ArmsDrillEstimatedMarkFormData {
  semester_id: number;
  exam_type_id: number;
  estimated_mark_per_instructor: string;
  conversation_mark: string;
  is_active: boolean;
}

export default function ArmsDrillEstimatedMarkForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ArmsDrillEstimatedMarkFormProps) {
  const [formData, setFormData] = useState<ArmsDrillEstimatedMarkFormData>({
    semester_id: 0,
    exam_type_id: 0,
    estimated_mark_per_instructor: "",
    conversation_mark: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ArmsDrillEstimatedMarkFormData, string>>>({});
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [examTypes, setExamTypes] = useState<SystemExam[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [semestersResponse, examTypesResponse] = await Promise.all([
          semesterService.getAllSemesters({ per_page: 100 }),
          examService.getAllExams({ per_page: 100 }),
        ]);
        setSemesters(semestersResponse.data);
        setExamTypes(examTypesResponse.data);
      } catch (error) {
        console.error("Failed to load options:", error);
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        semester_id: initialData.semester_id,
        exam_type_id: initialData.exam_type_id,
        estimated_mark_per_instructor: initialData.estimated_mark_per_instructor?.toString() || "",
        conversation_mark: initialData.conversation_mark?.toString() || "",
        is_active: initialData.is_active,
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ArmsDrillEstimatedMarkFormData, string>> = {};

    if (!formData.semester_id) {
      newErrors.semester_id = "Semester is required";
    }

    if (!formData.exam_type_id) {
      newErrors.exam_type_id = "Exam type is required";
    }

    // Conversation mark is required only if estimated_mark_per_instructor is provided
    if (formData.estimated_mark_per_instructor) {
      if (!formData.conversation_mark) {
        newErrors.conversation_mark = "Conversation mark is required when estimated mark per instructor is provided";
      } else if (parseFloat(formData.conversation_mark) < 0) {
        newErrors.conversation_mark = "Conversation mark must be positive";
      }
    } else if (formData.conversation_mark && parseFloat(formData.conversation_mark) < 0) {
      newErrors.conversation_mark = "Conversation mark must be positive";
    }

    if (formData.estimated_mark_per_instructor && parseFloat(formData.estimated_mark_per_instructor) < 0) {
      newErrors.estimated_mark_per_instructor = "Estimated mark must be positive";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const submitData: CtwArmsDrillAssessmentEstimatedMarkCreateData = {
        semester_id: formData.semester_id,
        exam_type_id: formData.exam_type_id,
        estimated_mark_per_instructor: formData.estimated_mark_per_instructor ? parseFloat(formData.estimated_mark_per_instructor) : undefined,
        conversation_mark: formData.conversation_mark ? parseFloat(formData.conversation_mark) : undefined,
        is_active: formData.is_active,
      };
      await onSubmit(submitData);
    } catch (error: any) {
      console.error("Form submission error:", error);
      alert(error.response?.data?.message || "Failed to save estimated mark");
    }
  };

  const handleChange = (field: keyof ArmsDrillEstimatedMarkFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (loadingOptions) {
    return (
      <div className="text-center py-10">
        <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin mx-auto text-blue-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:document-01" className="w-5 h-5 text-blue-500" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.semester_id}
              onChange={(e) => handleChange("semester_id", parseInt(e.target.value))}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.semester_id ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value={0}>Select Semester</option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name} - {semester.code}
                </option>
              ))}
            </select>
            {errors.semester_id && (
              <p className="mt-1 text-sm text-red-500">{errors.semester_id}</p>
            )}
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.exam_type_id}
              onChange={(e) => handleChange("exam_type_id", parseInt(e.target.value))}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.exam_type_id ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value={0}>Select Exam Type</option>
              {examTypes.map((examType) => (
                <option key={examType.id} value={examType.id}>
                  {examType.name}
                </option>
              ))}
            </select>
            {errors.exam_type_id && (
              <p className="mt-1 text-sm text-red-500">{errors.exam_type_id}</p>
            )}
          </div>

          {/* Estimated Mark Per Instructor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Mark Per Instructor
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.estimated_mark_per_instructor}
              onChange={(e) => handleChange("estimated_mark_per_instructor", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.estimated_mark_per_instructor ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter estimated mark per instructor"
            />
            {errors.estimated_mark_per_instructor && (
              <p className="mt-1 text-sm text-red-500">{errors.estimated_mark_per_instructor}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Optional: Leave blank if not applicable</p>
          </div>

          {/* Conversation Mark */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversation Mark {formData.estimated_mark_per_instructor && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.conversation_mark}
              onChange={(e) => handleChange("conversation_mark", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.conversation_mark ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter conversation mark"
            />
            {errors.conversation_mark && (
              <p className="mt-1 text-sm text-red-500">{errors.conversation_mark}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Required if estimated mark per instructor is provided</p>
          </div>
        </div>
      </div>

      {/* Active Status */}
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
              <div className="text-sm text-gray-500">This estimated mark will be available for use throughout the system.</div>
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
              <div className="text-sm text-gray-500">This estimated mark will be hidden from general use.</div>
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
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />
              {isEdit ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{isEdit ? "Update Estimated Mark" : "Create Estimated Mark"}</>
          )}
        </button>
      </div>
    </form>
  );
}
