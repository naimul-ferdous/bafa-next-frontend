/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { Ftw12sqnAssessmentCounselingEvent } from "@/libs/types/system";

interface EventFormProps {
  initialData?: Ftw12sqnAssessmentCounselingEvent | null;
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export interface EventFormData {
  event_name: string;
  event_code: string;
  event_type: string;
  is_active: boolean;
}

export default function EventForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    event_name: "",
    event_code: "",
    event_type: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        event_name: initialData.event_name,
        event_code: initialData.event_code,
        event_type: initialData.event_type,
        is_active: initialData.is_active,
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.event_name.trim()) {
      newErrors.event_name = "Event name is required";
    }

    if (!formData.event_code.trim()) {
      newErrors.event_code = "Event code is required";
    }

    if (!formData.event_type.trim()) {
      newErrors.event_type = "Event type is required";
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
      alert(error.response?.data?.message || "Failed to save event");
    }
  };

  const handleChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event Information */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:calendar-01" className="w-5 h-5 text-blue-500" />
          Event Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.event_name}
              onChange={(e) => handleChange("event_name", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.event_name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter event name"
            />
            {errors.event_name && (
              <p className="mt-1 text-sm text-red-500">{errors.event_name}</p>
            )}
          </div>

          {/* Event Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.event_code}
              onChange={(e) => handleChange("event_code", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.event_code ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter event code"
            />
            {errors.event_code && (
              <p className="mt-1 text-sm text-red-500">{errors.event_code}</p>
            )}
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.event_type}
              onChange={(e) => handleChange("event_type", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.event_type ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter event type"
            />
            {errors.event_type && (
              <p className="mt-1 text-sm text-red-500">{errors.event_type}</p>
            )}
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
              <div className="font-medium text-gray-900">Active:</div>
              <div className="text-sm text-gray-500">This event will be available for use throughout the system.</div>
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
              <div className="text-sm text-gray-500">This event will be hidden from general use.</div>
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
            <>{isEdit ? "Update Event" : "Create Event"}</>
          )}
        </button>
      </div>
    </form>
  );
}
