/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { Ftw11SqnAssessmentOlqType, Ftw11SqnAssessmentOlqTypeCreateData } from "@/libs/types/ftw11sqnAssessmentOlq";
import semesterService from "@/libs/services/semesterService";
import { SystemSemester } from "@/libs/types/system";

interface OlqTypeFormProps {
  initialData?: Ftw11SqnAssessmentOlqType | null;
  onSubmit: (data: Ftw11SqnAssessmentOlqTypeCreateData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

interface EstimatedMarkInput {
  id?: number;
  event_name: string;
  event_code: string;
  estimated_mark: number | string;
  remarks: string;
}

export interface OlqTypeFormData {
  type_name: string;
  type_code: string;
  is_multiplier: boolean;
  multiplier: string;
  is_active: boolean;
  estimated_marks: EstimatedMarkInput[];
  semesters: number[];
}

export default function OlqTypeForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: OlqTypeFormProps) {
  const [formData, setFormData] = useState<OlqTypeFormData>({
    type_name: "",
    type_code: "",
    is_multiplier: false,
    multiplier: "1",
    is_active: true,
    estimated_marks: [],
    semesters: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OlqTypeFormData, string>>>({});
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setLoadingMetadata(true);
        const res = await semesterService.getAllSemesters({ per_page: 100 });
        setSemesters(res.data);
      } catch (error) {
        console.error("Failed to load semesters:", error);
      } finally {
        setLoadingMetadata(false);
      }
    };
    loadMetadata();
  }, []);

  useEffect(() => {
    if (initialData) {
      const sortedMarks = initialData.estimated_marks 
        ? [...initialData.estimated_marks].sort((a, b) => (a.order || 0) - (b.order || 0))
        : [];

      setFormData({
        type_name: initialData.type_name,
        type_code: initialData.type_code,
        is_multiplier: initialData.is_multiplier || false,
        multiplier: initialData.multiplier || "1",
        is_active: initialData.is_active,
        estimated_marks: sortedMarks.map(m => ({
          id: m.id,
          event_name: m.event_name,
          event_code: m.event_code,
          estimated_mark: parseFloat(String(m.estimated_mark)),
          remarks: m.remarks || "",
        })) || [],
        semesters: initialData.semesters?.map((s: any) => s.semester_id) || [],
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof OlqTypeFormData, string>> = {};

    if (!formData.type_name.trim()) {
      newErrors.type_name = "Type name is required";
    }

    if (!formData.type_code.trim()) {
      newErrors.type_code = "Type code is required";
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
      const submitData: Ftw11SqnAssessmentOlqTypeCreateData = {
        type_name: formData.type_name,
        type_code: formData.type_code,
        is_multiplier: formData.is_multiplier,
        multiplier: formData.multiplier,
        is_active: formData.is_active,
        estimated_marks: formData.estimated_marks.map((m, index) => ({
          event_name: m.event_name,
          event_code: m.event_code,
          estimated_mark: typeof m.estimated_mark === "number" ? m.estimated_mark : (parseFloat(m.estimated_mark as string) || 0),
          remarks: m.remarks || undefined,
          order: index + 1,
        })),
        semesters: formData.semesters,
      };
      await onSubmit(submitData);
    } catch (error: any) {
      console.error("Form submission error:", error);
      alert(error.response?.data?.message || "Failed to save OLQ type");
    }
  };

  const handleChange = (field: keyof OlqTypeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Estimated marks handlers
  const addEstimatedMark = () => {
    setFormData(prev => ({
      ...prev,
      estimated_marks: [...prev.estimated_marks, { event_name: "", event_code: "", estimated_mark: '', remarks: "" }],
    }));
  };

  const updateEstimatedMark = (index: number, field: keyof EstimatedMarkInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      estimated_marks: prev.estimated_marks.map((m, i) => i === index ? { ...m, [field]: value } : m),
    }));
  };

  const removeEstimatedMark = (index: number) => {
    setFormData(prev => ({
      ...prev,
      estimated_marks: prev.estimated_marks.filter((_, i) => i !== index),
    }));
  };

  const moveEstimatedMark = (index: number, direction: 'up' | 'down') => {
    const newMarks = [...formData.estimated_marks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newMarks.length) return;

    [newMarks[index], newMarks[targetIndex]] = [newMarks[targetIndex], newMarks[index]];
    setFormData(prev => ({ ...prev, estimated_marks: newMarks }));
  };

  // Semester handlers
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
      {/* Basic Information */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:document-01" className="w-5 h-5 text-blue-500" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Type Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.type_name}
              onChange={(e) => handleChange("type_name", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.type_name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter type name"
            />
            {errors.type_name && (
              <p className="mt-1 text-sm text-red-500">{errors.type_name}</p>
            )}
          </div>

          {/* Type Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.type_code}
              onChange={(e) => handleChange("type_code", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.type_code ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter type code"
            />
            {errors.type_code && (
              <p className="mt-1 text-sm text-red-500">{errors.type_code}</p>
            )}
          </div>
        </div>
      </div>

      {/* Multiplier Settings */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:mathematics-01" className="w-5 h-5 text-orange-500" />
          Multiplier Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer bg-gray-50/50">
            <input
              type="checkbox"
              id="is_multiplier"
              checked={formData.is_multiplier}
              onChange={(e) => handleChange("is_multiplier", e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_multiplier" className="text-sm font-medium text-gray-700 cursor-pointer">
              Enable Marks Multiplier
            </label>
          </div>

          {formData.is_multiplier && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Multiplier Value (e.g., 1.5, 2.0)
              </label>
              <input
                type="text"
                value={formData.multiplier}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    handleChange("multiplier", val);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1.5"
              />
            </div>
          )}
        </div>
      </div>

      {/* Estimated Marks */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Icon icon="hugeicons:chart-line-data-01" className="w-5 h-5 text-green-500" />
            Estimated Marks (Events)
          </h3>
          <button
            type="button"
            onClick={addEstimatedMark}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
            Add Event
          </button>
        </div>

        {formData.estimated_marks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {`No events added. Click "Add Event" to add one.`}
          </div>
        ) : (
          <div className="space-y-2">
            {formData.estimated_marks.map((mark, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50/30">
                <div className="flex flex-col gap-2 no-print self-center">
                  <button
                    type="button"
                    onClick={() => moveEstimatedMark(index, "up")}
                    disabled={index === 0}
                    className={`p-1 rounded-md transition-colors ${
                      index === 0 ? "text-gray-300 cursor-not-allowed" : "text-blue-600 hover:bg-blue-100"
                    }`}
                    title="Move Up"
                  >
                    <Icon icon="hugeicons:arrow-up-01" className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveEstimatedMark(index, "down")}
                    disabled={index === formData.estimated_marks.length - 1}
                    className={`p-1 rounded-md transition-colors ${
                      index === formData.estimated_marks.length - 1 ? "text-gray-300 cursor-not-allowed" : "text-blue-600 hover:bg-blue-100"
                    }`}
                    title="Move Down"
                  >
                    <Icon icon="hugeicons:arrow-down-01" className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                    <input
                      type="text"
                      value={mark.event_name}
                      onChange={(e) => updateEstimatedMark(index, "event_name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Event name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Code</label>
                    <input
                      type="text"
                      value={mark.event_code}
                      onChange={(e) => updateEstimatedMark(index, "event_code", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Event code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Mark</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      value={mark.estimated_mark}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          updateEstimatedMark(index, "estimated_mark", "");
                          return;
                        }
                        if (/^\d*\.?\d*$/.test(val)) {
                          updateEstimatedMark(index, "estimated_mark", val);
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val !== "") {
                          const parsed = parseFloat(val);
                          if (!isNaN(parsed)) {
                            updateEstimatedMark(index, "estimated_mark", parsed);
                          } else {
                            updateEstimatedMark(index, "estimated_mark", "");
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <input
                      type="text"
                      value={mark.remarks}
                      onChange={(e) => updateEstimatedMark(index, "remarks", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Optional remarks"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeEstimatedMark(index)}
                  className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Remove"
                >
                  <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
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
              <div className="text-sm text-gray-500">This OLQ type will be available for assignment.</div>
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
              <div className="text-sm text-gray-500">This OLQ type will be hidden.</div>
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
            <>{isEdit ? "Update OLQ Type" : "Create OLQ Type"}</>
          )}
        </button>
      </div>
    </form>
  );
}
