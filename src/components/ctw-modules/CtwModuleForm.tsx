/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import type { CtwResultsModule } from "@/libs/types/ctw";
import type { SystemSemester, SystemExam } from "@/libs/types/system";
import { commonService } from "@/libs/services/commonService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";

interface CtwModuleFormProps {
  initialData?: CtwResultsModule | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

const ASSESSMENT_OPTIONS = [
  { value: 'dt', label: 'DT' },
  { value: 'pf', label: 'PF' },
  { value: 'ao', label: 'AO' },
  { value: 'gsk', label: 'GSK' },
  { value: 'bma', label: 'BMA' },
];

export default function CtwModuleForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: CtwModuleFormProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    short_name: "",
    code: "",
    assessment: "dt" as string,
    instructor_count: 1 as string | number,
    is_daily: false,
    total_mark: 100 as string | number,
    is_active: true,
  });
  const [error, setError] = useState("");

  // Copy module state
  const [showCopySection, setShowCopySection] = useState(false);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [exams, setExams] = useState<SystemExam[]>([]);
  const [copySemesterId, setCopySemesterId] = useState(0);
  const [copyExamTypeId, setCopyExamTypeId] = useState(0);
  const [copyModules, setCopyModules] = useState<CtwResultsModule[]>([]);
  const [copyModuleId, setCopyModuleId] = useState(0);
  const [copyLoading, setCopyLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      commonService.getResultOptions().then((opts) => {
        if (opts) {
          setSemesters(opts.semesters || []);
          setExams(opts.exams || []);
        }
      });
    }
  }, [isEdit]);

  useEffect(() => {
    if (!copySemesterId || !copyExamTypeId) {
      setCopyModules([]);
      setCopyModuleId(0);
      return;
    }
    setCopyLoading(true);
    ctwResultsModuleService
      .getModulesWithEstimatedMarks({ semester_id: copySemesterId })
      .then((mods) => {
        const filtered = mods.filter((m) =>
          m.estimated_marks?.some(
            (em) => em.semester_id === copySemesterId && em.exam_type_id === copyExamTypeId
          )
        );
        setCopyModules(filtered);
        setCopyModuleId(0);
      })
      .finally(() => setCopyLoading(false));
  }, [copySemesterId, copyExamTypeId]);

  const handleCopyModule = () => {
    const mod = copyModules.find((m) => m.id === copyModuleId);
    if (!mod) return;
    setFormData({
      full_name: mod.full_name ?? "",
      short_name: mod.short_name ?? "",
      code: mod.code ?? "",
      assessment: mod.assessment ?? "dt",
      instructor_count: mod.instructor_count ?? 1,
      is_daily: mod.is_daily ?? false,
      total_mark: mod.total_mark ?? 100,
      is_active: mod.is_active !== false,
    });
    setShowCopySection(false);
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name ?? "",
        short_name: initialData.short_name ?? "",
        code: initialData.code ?? "",
        assessment: initialData.assessment ?? "dt",
        instructor_count: initialData.instructor_count ?? 1,
        is_daily: initialData.is_daily ?? false,
        total_mark: initialData.total_mark ?? 100,
        is_active: initialData.is_active !== false,
      });
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? "update" : "create"} CTW module`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto">
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      {!isEdit && (
        <div className="mb-6 border border-blue-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCopySection((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm"
          >
            <span className="flex items-center gap-2">
              <Icon icon="hugeicons:copy-01" className="w-4 h-4" />
              Copy from existing module
            </span>
            <Icon icon={showCopySection ? "hugeicons:arrow-up-01" : "hugeicons:arrow-down-01"} className="w-4 h-4" />
          </button>

          {showCopySection && (
            <div className="p-5 bg-white space-y-4">
              <p className="text-xs text-gray-500">Select a semester and exam type to see modules already configured for that combination, then choose one to copy its data into the form.</p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                <div>
                  <Label>Semester</Label>
                  <select
                    value={copySemesterId}
                    onChange={(e) => { setCopySemesterId(Number(e.target.value)); setCopyModuleId(0); }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>— Select Semester —</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Exam Type</Label>
                  <select
                    value={copyExamTypeId}
                    onChange={(e) => { setCopyExamTypeId(Number(e.target.value)); setCopyModuleId(0); }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>— Select Exam Type —</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Module to Copy</Label>
                  {copyLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" /> Loading...
                    </div>
                  ) : (
                    <select
                      value={copyModuleId}
                      onChange={(e) => setCopyModuleId(Number(e.target.value))}
                      disabled={!copySemesterId || !copyExamTypeId}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value={0}>
                        {!copySemesterId || !copyExamTypeId
                          ? "— Select semester & exam type first —"
                          : copyModules.length === 0
                          ? "— No modules found —"
                          : "— Select Module —"}
                      </option>
                      {copyModules.map((m) => (
                        <option key={m.id} value={m.id}>{m.full_name} ({m.code})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCopyModule}
                  disabled={!copyModuleId}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Icon icon="hugeicons:copy-01" className="w-4 h-4" />
                  Apply Copy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
           <div>
          <Label>Module Full Name <span className="text-red-500">*</span></Label>
          <Input value={formData.full_name} onChange={(e) => handleChange("full_name", e.target.value)} placeholder="Enter full name" required />
        </div>
          <div>
            <Label>Short Name <span className="text-red-500">*</span></Label>
            <Input value={formData.short_name} onChange={(e) => handleChange("short_name", e.target.value)} placeholder="Enter short name" required />
          </div>
          <div>
            <Label>Code <span className="text-red-500">*</span></Label>
            <Input value={formData.code} onChange={(e) => handleChange("code", e.target.value)} placeholder="Enter module code" required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Total Mark <span className="text-red-500">*</span></Label>
            <Input type="number" value={formData.total_mark} onChange={(e) => handleChange("total_mark", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="Enter total mark" required />
          </div>
          <div>
            <Label>Instructor Count</Label>
            <Input type="number" value={formData.instructor_count} onChange={(e) => handleChange("instructor_count", e.target.value === "" ? "" : parseInt(e.target.value))} placeholder="Enter count" />
          </div>
          <div>
            <Label>Assessment</Label>
            <select
              value={formData.assessment}
              onChange={(e) => handleChange("assessment", e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {ASSESSMENT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label className="mb-3">Status</Label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
              <div>
                <div className="font-medium text-gray-900">Active:</div>
                <div className="text-sm text-gray-500">This module will be available for use throughout the system.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
              <div>
                <div className="font-medium text-gray-900">Inactive:</div>
                <div className="text-sm text-gray-500">This module will be hidden from general use.</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-50" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2" disabled={loading}>
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Module" : "Save Module")}
        </button>
      </div>
    </form>
  );
}
