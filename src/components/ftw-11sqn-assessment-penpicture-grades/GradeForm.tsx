"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { Ftw11SqnAssessmentPenpictureGrade, SystemSemester, SystemCourse } from "@/libs/types/system";
import { commonService } from "@/libs/services/commonService";

interface GradeFormProps {
  initialData?: Ftw11SqnAssessmentPenpictureGrade | null;
  onSubmit: (data: GradeFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export interface GradeFormData {
  course_id: number | "";
  grade_name: string;
  grade_code: string;
  is_active: boolean;
  semesters: number[];
}

export default function GradeForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: GradeFormProps) {
  const [formData, setFormData] = useState<GradeFormData>({
    course_id: "",
    grade_name: "",
    grade_code: "",
    is_active: true,
    semesters: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof GradeFormData, string>>>({});
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setLoadingMetadata(true);
        const options = await commonService.getResultOptions();
        if (options) {
          setSemesters(options.semesters || []);
          setCourses(options.courses || []);
        }
      } catch (error) {
        console.error("Failed to load form metadata:", error);
      } finally {
        setLoadingMetadata(false);
      }
    };
    loadMetadata();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        course_id: initialData.course_id || "",
        grade_name: initialData.grade_name,
        grade_code: initialData.grade_code,
        is_active: initialData.is_active,
        semesters: initialData.semesters?.map(s => s.semester_id) || [],
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof GradeFormData, string>> = {};

    if (!formData.course_id) {
      newErrors.course_id = "Course is required";
    }

    if (!formData.grade_name.trim()) {
      newErrors.grade_name = "Grade name is required";
    }

    if (!formData.grade_code.trim()) {
      newErrors.grade_code = "Grade code is required";
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
      await onSubmit(formData);
    } catch (error: any) {
      console.error("Form submission error:", error);
      alert(error.response?.data?.message || "Failed to save grade");
    }
  };

  const handleChange = (field: keyof GradeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleSemester = (semesterId: number) => {
    setFormData(prev => ({
      ...prev,
      semesters: prev.semesters.includes(semesterId)
        ? prev.semesters.filter(id => id !== semesterId)
        : [...prev.semesters, semesterId],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Grade Information */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:award-01" className="w-5 h-5 text-blue-500" />
          Grade Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Course */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.course_id}
              onChange={(e) => handleChange("course_id", e.target.value ? parseInt(e.target.value) : "")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                errors.course_id ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loadingMetadata}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
            {errors.course_id && (
              <p className="mt-1 text-sm text-red-500">{errors.course_id}</p>
            )}
          </div>

          {/* Grade Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.grade_name}
              onChange={(e) => handleChange("grade_name", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.grade_name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter grade name"
            />
            {errors.grade_name && (
              <p className="mt-1 text-sm text-red-500">{errors.grade_name}</p>
            )}
          </div>

          {/* Grade Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.grade_code}
              onChange={(e) => handleChange("grade_code", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.grade_code ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter grade code"
            />
            {errors.grade_code && (
              <p className="mt-1 text-sm text-red-500">{errors.grade_code}</p>
            )}
          </div>
        </div>
      </div>

      {/* Semesters */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:calendar-03" className="w-5 h-5 text-purple-500" />
          Applicable Semesters
        </h3>
        {loadingMetadata ? (
          <div className="text-center py-4">
            <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {semesters.map((semester) => (
              <label
                key={semester.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.semesters.includes(semester.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.semesters.includes(semester.id)}
                  onChange={() => toggleSemester(semester.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">{semester.name}</span>
              </label>
            ))}
          </div>
        )}
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
              <div className="font-medium text-gray-900">Active:</div>
              <div className="text-sm text-gray-500">This grade will be available for use throughout the system.</div>
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
              <div className="font-medium text-gray-900">Inactive:</div>
              <div className="text-sm text-gray-500">This grade will be hidden from general use.</div>
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
            <>{isEdit ? "Update Grade" : "Create Grade"}</>
          )}
        </button>
      </div>
    </form>
  );
}
