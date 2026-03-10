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
import SearchableSelect from "@/components/form/SearchableSelect";

interface AtwCadetWarningFormProps {
  initialData?: CadetWarning | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export default function AtwCadetWarningForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: AtwCadetWarningFormProps) {
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

      <div>
        <div className="w-full flex justify-between mb-8 text-xs font-bold">
          <div></div>
          <div>
            <p className="text-center font-medium text-gray-900 uppercase px-4">Restricted</p>
          </div>
          <div></div>
        </div>

        {/* Top Right Header Details */}
        <div className="flex justify-end mb-10">
          <div className="text-left space-y-0.5">
            <FullLogo />
            <p className="font-bold">BAFA-110 (REVISED)</p>
            <p>BAF Academy</p>
            <p>Academic Training Wing</p>
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
            <div className="relative">
              <Label className="font-bold uppercase tracking-wide"> To </Label>
              
              <SearchableSelect
                options={cadets.map(c => ({
                  value: c.id.toString(),
                  label: `${c.assigned_ranks?.[0]?.rank?.short_name || ""} ${c.name} (${c.cadet_number || c.bd_no})`
                }))}
                value={formData.cadet_id.toString()}
                onChange={(val) => handleCadetChange(parseInt(val))}
                placeholder="Select Cadet"
                disabled={isEdit || loading}
                required
              />
            </div>

            {selectedCourseName && selectedCourseName !== "N/A" ? (
              <div className="mt-2">
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <Icon icon="hugeicons:course" className="w-3.5 h-3.5" />
                  {selectedCourseName}
                  {loadingCadet && <Icon icon="hugeicons:loading-03" className="w-3 h-3 animate-spin text-blue-500" />}
                </p>
              </div>
            ) : null}
            {selectedSemesterName && selectedSemesterName !== "N/A" ? (
              <div className="mt-1">
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <Icon icon="hugeicons:calendar-01" className="w-3.5 h-3.5" />
                  {selectedSemesterName}
                  {loadingCadet && <Icon icon="hugeicons:loading-03" className="w-3 h-3 animate-spin text-blue-500" />}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Subject Section */}
        <div className="my-4">
          <div className="flex items-center gap-2">
            <span className="font-bold underline tracking-wide shrink-0 uppercase">SUBJ:</span>
            <div className="flex-1 max-w-md relative">
              <SearchableSelect
                options={warningTypes.filter(w => w.is_active).map(w => ({
                  value: w.id.toString(),
                  label: `${w.name} (-${Number(w.reduced_mark).toFixed(1)})`
                }))}
                value={formData.warning_id.toString()}
                onChange={(val) => handleChange("warning_id", parseInt(val))}
                placeholder="Select Warning Type"
                required
              />
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
            <p>Academic Training Wing</p>
            <p>Bangladesh Air Force Academy</p>
          </div>
        </div>

        <div>
          <Label className="mb-3">Status</Label>
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
                <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  This warning will be active and affecting performance.
                </div>
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
                <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  This warning will be marked as resolved or inactive.
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 py-8 no-print">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
          disabled={loading}
        >
          {loading && <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />}
          {loading ? "Saving Document..." : isEdit ? "Update Warning" : "Issue Warning"}
        </button>
      </div>
    </form>
  );
}
