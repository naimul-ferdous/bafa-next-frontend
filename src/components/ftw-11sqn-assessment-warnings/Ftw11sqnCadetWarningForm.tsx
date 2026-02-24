/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import { commonService } from "@/libs/services/commonService";
import { useAuth } from "@/libs/hooks/useAuth";
import type { SystemWarningType, CadetWarning, SystemCourse, SystemSemester } from "@/libs/types/system";
import type { CadetProfile } from "@/libs/types/user";

interface Ftw11sqnCadetWarningFormProps {
  initialData?: CadetWarning | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export default function Ftw11sqnCadetWarningForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: Ftw11sqnCadetWarningFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    cadet_id: 0, 
    warning_id: 0, 
    course_id: 0, 
    semester_id: 0, 
    remarks: "", 
    is_active: true 
  });
  const [error, setError] = useState("");
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [warningTypes, setWarningTypes] = useState<SystemWarningType[]>([]);
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        cadet_id: initialData.cadet_id, 
        warning_id: initialData.warning_id, 
        course_id: initialData.course_id || 0, 
        semester_id: initialData.semester_id || 0, 
        remarks: initialData.remarks || "", 
        is_active: initialData.is_active !== false 
      });
    }
  }, [initialData]);

  const loadDropdownData = async () => {
    try {
      setLoadingDropdowns(true);
      const commonData = await commonService.getResultOptions();
      
      if (commonData) {
        setCadets(commonData.cadets || []);
        setWarningTypes(commonData.warning_types || []);
        setCourses(commonData.courses || []);
        setSemesters(commonData.semesters || []);
      }
    } catch (err) { 
      console.error("Failed to load dropdown data:", err); 
      setError("Failed to load form data. Please refresh the page.");
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const handleChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError("");
    if (!formData.cadet_id) { setError("Please select a cadet"); return; }
    if (!formData.warning_id) { setError("Please select a warning type"); return; }
    
    try {
      const submitData = { 
        ...formData, 
        course_id: formData.course_id || undefined, 
        semester_id: formData.semester_id || undefined, 
        created_by: user?.id 
      };
      await onSubmit(submitData);
    } catch (err: any) { 
      setError(err.message || "Failed to save warning"); 
    }
  };

  if (loadingDropdowns) {
    return (
      <div className="w-full min-h-[20vh] flex items-center justify-center">
        <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
        <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
        {error}
      </div>}

      <div className="border border-gray-200 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:alert-02" className="w-5 h-5 text-red-500" />
          Warning Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Cadet <span className="text-red-500">*</span></Label>
            <select value={formData.cadet_id} onChange={(e) => handleChange("cadet_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all" required>
              <option value={0}>Select Cadet</option>
              {cadets.map((cadet) => (
                <option key={cadet.id} value={cadet.id}>
                  {cadet.cadet_number || cadet.bd_no} - {cadet.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Warning Type <span className="text-red-500">*</span></Label>
            <select value={formData.warning_id} onChange={(e) => handleChange("warning_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all" required>
              <option value={0}>Select Warning Type</option>
              {warningTypes.filter(w => w.is_active).map((warning) => (
                <option key={warning.id} value={warning.id}>
                  {warning.name} (-{Number(warning.reduced_mark).toFixed(1)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Course</Label>
            <select value={formData.course_id} onChange={(e) => handleChange("course_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all">
              <option value={0}>Select Course (Optional)</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
          </div>

          <div>
            <Label>Semester</Label>
            <select value={formData.semester_id} onChange={(e) => handleChange("semester_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all">
              <option value={0}>Select Semester (Optional)</option>
              {semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <Label>Remarks</Label>
          <textarea value={formData.remarks} onChange={(e) => handleChange("remarks", e.target.value)} placeholder="Enter detailed remarks regarding this warning..." rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>

        <div>
          <Label className="mb-3 font-bold">Status</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData.is_active ? 'border-red-200 bg-red-50 ring-2 ring-red-500' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="mt-1 w-4 h-4 text-red-600 focus:ring-red-500" />
              <div>
                <div className="font-bold text-gray-900">Active</div>
                <div className="text-xs text-gray-500">Warning is currently in effect and marks will be deducted.</div>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${!formData.is_active ? 'border-green-200 bg-green-50 ring-2 ring-green-500' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-green-600 focus:ring-green-500" />
              <div>
                <div className="font-bold text-gray-900">Resolved</div>
                <div className="text-xs text-gray-500">Warning has been addressed, resolved or revoked.</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
        <button type="button" className="px-8 py-2.5 border border-gray-300 text-black rounded-xl hover:bg-gray-50 transition-all font-bold" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2 font-bold" disabled={loading}>
          {loading && <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />}
          {loading ? "Processing..." : isEdit ? "Update Warning" : "Save Warning"}
        </button>
      </div>
    </form>
  );
}
