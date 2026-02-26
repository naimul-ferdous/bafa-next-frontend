/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import { commonService } from "@/libs/services/commonService";
import { cadetService } from "@/libs/services/cadetService";
import { useAuth } from "@/libs/hooks/useAuth";
import type { SystemWarningType, CadetWarning, SystemCourse, SystemSemester } from "@/libs/types/system";
import type { CadetProfile } from "@/libs/types/user";
import { Icon } from "@iconify/react";
import RichTextEditor from "@/components/common/RichTextEditor";
import FullLogo from "@/components/ui/fulllogo";

interface CtwCadetWarningFormProps {
  initialData?: CadetWarning | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export default function CtwCadetWarningForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: CtwCadetWarningFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    cadet_id: 0,
    warning_id: 0,
    course_id: 0,
    semester_id: 0,
    remarks: "",
    is_active: true,
  });
  const [fetchingData, setFetchingData] = useState(true);
  const [loadingCadet, setLoadingCadet] = useState(false);
  const [error, setError] = useState("");
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [warningTypes, setWarningTypes] = useState<SystemWarningType[]>([]);
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    const fetchInitialCadet = async () => {
      if (initialData) {
        setFormData({
          cadet_id: initialData.cadet_id,
          warning_id: initialData.warning_id,
          course_id: initialData.course_id || 0,
          semester_id: initialData.semester_id || 0,
          remarks: initialData.remarks || "",
          is_active: initialData.is_active !== false,
        });

        if (initialData.cadet_id && !initialData.course_id) {
          await fetchAndSetCadetData(initialData.cadet_id);
        }
      }
    };
    fetchInitialCadet();
  }, [initialData]);

  const loadDropdownData = async () => {
    try {
      setFetchingData(true);
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
      setFetchingData(false);
    }
  };

  const fetchAndSetCadetData = async (cadetId: number) => {
    if (!cadetId) return;
    try {
      setLoadingCadet(true);
      const fullCadet = await cadetService.getCadet(cadetId);
      if (fullCadet) {
        const currentCourse = fullCadet.assigned_courses?.find(ac => ac.is_current)?.course_id || 0;
        const currentSemester = fullCadet.assigned_semesters?.find(as => as.is_current)?.semester_id || 0;

        setFormData(prev => ({
          ...prev,
          course_id: currentCourse || prev.course_id,
          semester_id: currentSemester || prev.semester_id
        }));
      }
    } catch (err) {
      console.error("Failed to fetch full cadet data:", err);
    } finally {
      setLoadingCadet(false);
    }
  };

  const handleCadetChange = async (cadetId: number) => {
    setFormData(prev => ({ ...prev, cadet_id: cadetId }));
    if (cadetId) {
      await fetchAndSetCadetData(cadetId);
    } else {
      setFormData(prev => ({ ...prev, course_id: 0, semester_id: 0 }));
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedCadetObj = cadets.find(c => c.id === formData.cadet_id);
  const selectedCadetNumber = selectedCadetObj?.cadet_number || selectedCadetObj?.bd_no || "";
  const selectedCourseName = courses.find(c => c.id === formData.course_id)?.name || "N/A";
  const selectedSemesterName = semesters.find(s => s.id === formData.semester_id)?.name || "N/A";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.cadet_id) {
      setError("Please select a cadet");
      return;
    }
    if (!formData.warning_id) {
      setError("Please select a warning type");
      return;
    }

    try {
      const submitData = {
        ...formData,
        course_id: formData.course_id || undefined,
        semester_id: formData.semester_id || undefined,
        created_by: user?.id,
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || "Failed to save warning");
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center p-12">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2 no-print">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="p-8">
        <div className="w-full flex justify-between mb-8 text-xs font-bold">
          <div></div>
          <div>
            <p className="text-center font-medium text-gray-900 uppercase px-4 underline">Restricted</p>
          </div>
          <div></div>
        </div>

        {/* Top Right Header Details */}
        <div className="flex justify-end mb-10">
          <div className="text-left space-y-0.5">
            <FullLogo />
            <p className="font-bold">BAFA-110 (REVISED)</p>
            <p>BAF Academy</p>
            <p>Cdts&apos; Trg Wg</p>
            <p>Jashore</p>
            <p className="mt-1 text-xs text-gray-500">
              Tel: 02477762242 ext 5195
            </p>
            <p className="mt-3 font-semibold">
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div>
          <div className="max-w-sm">
            <div>
              <Label htmlFor="cadet_id" className="font-bold uppercase tracking-wide"> To </Label>
              {selectedCadetNumber ? (
                <div>
                  <p className="font-bold">{selectedCadetNumber}</p>
                </div>
              ) : null}
              <div className="relative">
                <select
                  id="cadet_id"
                  value={formData.cadet_id}
                  onChange={(e) => handleCadetChange(parseInt(e.target.value))}
                  className="w-full py-1.5 focus:border-blue-500 outline-none bg-transparent font-bold appearance-none pr-8"
                  required
                >
                  <option value={0}>Select Cadet</option>
                  {cadets.map((cadet) => (
                    <option key={cadet.id} value={cadet.id}>
                      {cadet.assigned_ranks?.[0]?.rank?.name} {cadet.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {selectedCourseName ? (
              <div>
                <p className="text-gray-700 font-medium mt-1 flex items-center gap-2">
                  {selectedCourseName}
                  {loadingCadet && <Icon icon="hugeicons:loading-03" className="w-3 h-3 animate-spin text-blue-500" />}
                </p>
              </div>
            ) : null}
            {selectedSemesterName ? (
              <div>
                <p className="text-gray-700 font-medium mt-1 flex items-center gap-2">
                  {selectedSemesterName}
                  {loadingCadet && <Icon icon="hugeicons:loading-03" className="w-3 h-3 animate-spin text-blue-500" />}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Subject Section */}
        <div className="my-6">
          <div className="flex items-center gap-2">
            <span className="font-bold underline tracking-wide shrink-0">SUBJ:</span>
            <div className="flex-1 max-w-md relative">
              <select
                value={formData.warning_id}
                onChange={(e) => handleChange("warning_id", parseInt(e.target.value))}
                className="w-full px-3 py-1.5 focus:border-blue-500 outline-none bg-transparent font-bold uppercase appearance-none pr-8 underline"
                required
              >
                <option value={0}>Select Warning Type</option>
                {warningTypes.filter(w => w.is_active).map((warning) => (
                  <option key={warning.id} value={warning.id}>
                    {warning.name} (-{Number(warning.reduced_mark).toFixed(1)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mb-12">
          <div className="gap-2">
            <span className="font-bold mt-1">Ref:</span>
            <div className="mt-2">
              <RichTextEditor
                value={formData.remarks}
                onChange={(value) => handleChange("remarks", value)}
                placeholder="Enter detailed remarks regarding this warning..."
                className="border border-gray-200 shadow-none !bg-transparent min-h-[300px]"
              />
            </div>
          </div>
        </div>

        {/* Signature Placeholder - Mimicking the display page */}
        <div className="mt-20 flex justify-end">
          <div className="text-start w-64 pt-2 border-t-2 border-gray-900">
            <p className="font-bold uppercase">
              {isEdit && initialData?.creator?.name ? initialData.creator.name : (user?.name || "AUTHENTICATING OFFICER")}
            </p>
            <p>
              {isEdit && initialData?.creator?.rank ? initialData.creator.rank : (user?.rank?.name || "Squadron Leader")}
            </p>
            <p>
              {isEdit && initialData?.creator?.role ? initialData.creator.role : (user?.role?.name || "Sqn Cdr & Instr of no 1 Sqn")}
            </p>
            <p>Cadets&apos; Training Wing</p>
            <p>Bangladesh Air Force Academy</p>
          </div>
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200 no-print">
          <Label className="mb-4 font-bold text-gray-900">Current Status of Warning</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData.is_active ? 'border-red-200 bg-red-100/50 ring-2 ring-red-500' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <input
                type="radio"
                name="is_active"
                checked={formData.is_active === true}
                onChange={() => handleChange("is_active", true)}
                className="mt-1 w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
              />
              <div>
                <div className="font-bold text-gray-900">Active Warning</div>
                <div className="text-xs text-gray-500 mt-1">
                  This warning is currently in effect and affecting the cadet&apos;s performance records.
                </div>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${!formData.is_active ? 'border-green-200 bg-green-100/50 ring-2 ring-green-500' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <input
                type="radio"
                name="is_active"
                checked={formData.is_active === false}
                onChange={() => handleChange("is_active", false)}
                className="mt-1 w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <div>
                <div className="font-bold text-gray-900">Resolved / Inactive</div>
                <div className="text-xs text-gray-500 mt-1">
                  The warning has been addressed and is no longer active.
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 py-8 px-8 border-t border-gray-100 no-print">
        <button
          type="button"
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
          disabled={loading}
        >
          {loading && <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />}
          {loading ? "Processing..." : isEdit ? "Update Document" : "Issue Warning"}
        </button>
      </div>
    </form>
  );
}
