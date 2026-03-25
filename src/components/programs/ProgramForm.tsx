/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { programService } from "@/libs/services/programService";
import { semesterService } from "@/libs/services/semesterService";
import type { SystemSemester, SystemProgramChangeableSemester, SystemProgram } from "@/libs/types/system";

interface ProgramFormProps {
  initialData?: SystemProgram | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  isEdit?: boolean;
}

export default function ProgramForm({ initialData, onSubmit, onCancel, loading = false, isEdit = false }: ProgramFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    description: "",
    duration_months: 0,
    is_changeable: false,
    is_active: true,
  });
  const [error, setError] = useState("");

  const [changeableName, setChangeableName] = useState("");
  const [changeableShortName, setChangeableShortName] = useState("");
  const [allSemesters, setAllSemesters] = useState<SystemSemester[]>([]);
  const [semestersLoading, setSemestersLoading] = useState(false);
  const [selectedSemesterIds, setSelectedSemesterIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    semesterService.getAllSemesters({ per_page: 200 }).then((res) => {
      setAllSemesters(res.data || []);
    });
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        short_name: initialData.short_name || "",
        description: (initialData as any).description || "",
        duration_months: (initialData as any).duration_months || 0,
        is_changeable: initialData.is_changeable || false,
        is_active: initialData.is_active !== false,
      });

      if (initialData.is_changeable) {
        setSemestersLoading(true);
        programService.getChangeableSemesters(initialData.id).then((rows: SystemProgramChangeableSemester[]) => {
          if (rows.length > 0) {
            setChangeableName(rows[0].name);
            setChangeableShortName(rows[0].short_name ?? "");
          }
          setSelectedSemesterIds(new Set(rows.map((r) => r.semester_id)));
          setSemestersLoading(false);
        });
      }
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "is_changeable" && !value) {
      setSelectedSemesterIds(new Set());
      setChangeableName("");
      setChangeableShortName("");
    }
  };

  const toggleSemester = (id: number) => {
    setSelectedSemesterIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await onSubmit({
        ...formData,
        changeable_semesters: formData.is_changeable
          ? Array.from(selectedSemesterIds).map((semId) => ({
            name: changeableName,
            short_name: changeableShortName,
            semester_id: semId,
          }))
          : [],
      });
    } catch (err: any) {
      setError(err.message || "Failed to save program");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label>Program Name <span className="text-red-500">*</span></Label>
          <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Enter program name" required />
        </div>
        <div>
          <Label>Short Name</Label>
          <Input value={formData.short_name} onChange={(e) => handleChange("short_name", e.target.value)} placeholder="e.g. BSc" />
        </div>
        <div>
          <Label>Duration (months)</Label>
          <Input type="number" value={formData.duration_months} onChange={(e) => handleChange("duration_months", parseInt(e.target.value) || 0)} placeholder="0" />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Enter description (optional)"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Is Changeable toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_changeable"
          checked={formData.is_changeable}
          onChange={(e) => handleChange("is_changeable", e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="is_changeable" className="font-medium text-gray-900 dark:text-white cursor-pointer">
          Changeable Program
        </label>
      </div>

      {/* Changeable Semesters */}
      {formData.is_changeable && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">
            Changeable Semesters
            {selectedSemesterIds.size > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                {selectedSemesterIds.size} selected
              </span>
            )}
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <Label className="text-xs mb-1">Changeable Program Name <span className="text-red-500">*</span></Label>
              <Input value={changeableName} onChange={(e) => setChangeableName(e.target.value)} placeholder="e.g. Changeable Semester" required={formData.is_changeable} />
            </div>
            <div>
              <Label className="text-xs mb-1">Short Name</Label>
              <Input value={changeableShortName} onChange={(e) => setChangeableShortName(e.target.value)} placeholder="e.g. CS" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-2">Select applicable semesters:</p>
          {semestersLoading ? (
            <p className="text-sm text-gray-500">Loading semesters...</p>
          ) : allSemesters.length === 0 ? (
            <p className="text-sm text-gray-500">No semesters available.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 max-h-56 overflow-y-auto">
              {allSemesters.map((semester) => (
                <label key={semester.id} className="flex items-center gap-2 cursor-pointer border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-blue-50">
                  <input
                    type="checkbox"
                    checked={selectedSemesterIds.has(semester.id)}
                    onChange={() => toggleSemester(semester.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-800">
                    {semester.name}
                    <span className="ml-1 text-xs text-gray-400">({semester.code})</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Status */}
      <div>
        <Label className="mb-3">Status</Label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
            <div>
              <div className="font-medium text-gray-900">Active</div>
              <div className="text-sm text-gray-500">This program will be available for use throughout the system.</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
            <div>
              <div className="font-medium text-gray-900">Inactive</div>
              <div className="text-sm text-gray-500">This program will be hidden from general use.</div>
            </div>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} disabled={loading} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60">
          {loading ? "Saving..." : isEdit ? "Update Program" : "Save Program"}
        </button>
      </div>
    </form>
  );
}
