/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import type { AtwSubjectModule, AtwSubjectsModuleMarksheet, SystemSemester, SystemProgram } from "@/libs/types/system";
import { atwMarksheetService } from "@/libs/services/atwMarksheetService";
import { semesterService } from "@/libs/services/semesterService";
import { programService } from "@/libs/services/programService";

interface SubjectFormProps {
  initialData?: AtwSubjectModule | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export default function SubjectModuleForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: SubjectFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    atw_subjects_module_marksheet_id: "" as number | "",
    semester_id: "" as number | "",
    program_id: "" as number | "",
    subject_name: "",
    subject_code: "",
    subject_legend: "",
    subject_period: "",
    subject_type: "academic" as "academic" | "professional",
    subjects_full_mark: "100",
    subjects_credit: "0",
    is_current: true,
    is_active: true,
    syllabus_file: null as File | null,
  });

  const [marksheets, setMarksheets] = useState<AtwSubjectsModuleMarksheet[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  
  const [loadingMarksheets, setLoadingMarksheets] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  
  const [error, setError] = useState("");

  // Load initial options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingMarksheets(true);
        setLoadingSemesters(true);
        setLoadingPrograms(true);

        const [marksheetsRes, semestersRes, programsRes] = await Promise.all([
          atwMarksheetService.getAllMarksheets({ per_page: 100 }),
          semesterService.getAllSemesters({ per_page: 100 }),
          programService.getAllPrograms({ per_page: 100 }),
        ]);

        setMarksheets(marksheetsRes.data || []);
        setSemesters(semestersRes.data || []);
        setPrograms(programsRes.data || []);
      } catch (err) {
        console.error("Failed to load form options:", err);
      } finally {
        setLoadingMarksheets(false);
        setLoadingSemesters(false);
        setLoadingPrograms(false);
      }
    };
    fetchOptions();
  }, []);

  // Populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        atw_subjects_module_marksheet_id: initialData.atw_subjects_module_marksheet_id || "",
        semester_id: initialData.semester_id || "",
        program_id: initialData.program_id || "",
        subject_name: initialData.subject_name || "",
        subject_code: initialData.subject_code || "",
        subject_legend: initialData.subject_legend || "",
        subject_period: initialData.subject_period || "",
        subject_type: initialData.subject_type || "academic",
        subjects_full_mark: initialData.subjects_full_mark?.toString() || "0",
        subjects_credit: initialData.subjects_credit?.toString() || "0",
        is_current: initialData.is_current ?? true,
        is_active: initialData.is_active ?? true,
        syllabus_file: null,
      });
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData(prev => ({ ...prev, syllabus_file: e.target.files![0] }));
    }
  };

  const clearFile = () => {
    setFormData(prev => ({ ...prev, syllabus_file: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleNumericInput = (field: string, value: string) => {
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const selectedMarksheet = useMemo(() => {
    return marksheets.find(m => m.id === Number(formData.atw_subjects_module_marksheet_id));
  }, [marksheets, formData.atw_subjects_module_marksheet_id]);

  const previewSamples = useMemo(() => {
    if (!selectedMarksheet?.marks) return [];
    return selectedMarksheet.marks.map(m => Math.max(0, (Number(m.estimate_mark) || 0) - 1));
  }, [selectedMarksheet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const submitData = {
        ...formData,
        subjects_full_mark: parseFloat(formData.subjects_full_mark) || 0,
        subjects_credit: parseFloat(formData.subjects_credit) || 0,
        atw_subjects_module_marksheet_id: formData.atw_subjects_module_marksheet_id === "" ? null : formData.atw_subjects_module_marksheet_id,
        semester_id: formData.semester_id === "" ? null : formData.semester_id,
        program_id: formData.program_id === "" ? null : formData.program_id,
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} subject module`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "SELECT") {
        e.preventDefault();
        const form = target.closest("form");
        if (!form) return;
        const focusableElements = Array.from(
          form.querySelectorAll<HTMLElement>(
            'input:not([disabled]):not([type="radio"]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]:not([disabled])'
          )
        );
        const index = focusableElements.indexOf(target);
        if (index > -1 && index < focusableElements.length - 1) {
          focusableElements[index + 1].focus();
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="md:col-span-2 lg:col-span-2">
            <Label>Select Marksheet <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select
                value={formData.atw_subjects_module_marksheet_id}
                onChange={(e) => handleChange("atw_subjects_module_marksheet_id", e.target.value ? parseInt(e.target.value) : "")}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                required
              >
                <option value="">Select a Marksheet</option>
                {marksheets.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                {loadingMarksheets ? <Icon icon="hugeicons:fan-01" className="animate-spin" /> : <Icon icon="hugeicons:arrow-down-01" />}
              </div>
            </div>
            <p className="mt-1 text-[10px] text-gray-500 italic">Manage marksheets in the Marksheets section.</p>
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <Label>Semester</Label>
            <div className="relative">
              <select
                value={formData.semester_id}
                onChange={(e) => handleChange("semester_id", e.target.value ? parseInt(e.target.value) : "")}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
              >
                <option value="">Select Semester (Optional)</option>
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                {loadingSemesters ? <Icon icon="hugeicons:fan-01" className="animate-spin" /> : <Icon icon="hugeicons:arrow-down-01" />}
              </div>
            </div>
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <Label>Program</Label>
            <div className="relative">
              <select
                value={formData.program_id}
                onChange={(e) => handleChange("program_id", e.target.value ? parseInt(e.target.value) : "")}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
              >
                <option value="">Select Program (Optional)</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                {loadingPrograms ? <Icon icon="hugeicons:fan-01" className="animate-spin" /> : <Icon icon="hugeicons:arrow-down-01" />}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <Label>Subject Name <span className="text-red-500">*</span></Label>
            <Input value={formData.subject_name} onChange={(e) => handleChange("subject_name", e.target.value)} placeholder="Enter subject name" required />
          </div>
          <div>
            <Label>Subject Code <span className="text-red-500">*</span></Label>
            <Input value={formData.subject_code} onChange={(e) => handleChange("subject_code", e.target.value)} placeholder="Enter subject code" required />
          </div>
          <div>
            <Label>Subject Type <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select
                value={formData.subject_type}
                onChange={(e) => handleChange("subject_type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                required
              >
                <option value="academic">Academic</option>
                <option value="professional">Professional</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Icon icon="hugeicons:arrow-down-01" />
              </div>
            </div>
          </div>
          <div>
            <Label>Subject Legend</Label>
            <Input value={formData.subject_legend} onChange={(e) => handleChange("subject_legend", e.target.value)} placeholder="Enter legend (optional)" />
          </div>
          <div>
            <Label>Subject Period</Label>
            <Input value={formData.subject_period} onChange={(e) => handleChange("subject_period", e.target.value)} placeholder="Enter period (optional)" />
          </div>
          <div>
            <Label>Full Mark <span className="text-red-500">*</span></Label>
            <Input
              type="text"
              value={formData.subjects_full_mark}
              onChange={(e) => handleNumericInput("subjects_full_mark", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Credit</Label>
            <Input
              type="text"
              value={formData.subjects_credit}
              onChange={(e) => handleNumericInput("subjects_credit", e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <Label className="mb-2">Syllabus File (PDF/DOC)</Label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 border border-gray-200 rounded-lg focus:outline-none dark:border-gray-700"
            />
            {formData.syllabus_file && (
              <button
                type="button"
                onClick={clearFile}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Clear selected file"
              >
                <Icon icon="hugeicons:cancel-01" className="w-5 h-5" />
              </button>
            )}
          </div>
          {initialData?.syllabus && !formData.syllabus_file && (
            <p className="mt-2 text-sm text-gray-500">
              Current file: <a href={initialData.syllabus} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1"><Icon icon="hugeicons:document-attachment" /> View Document</a>
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">Optional. Max size 10MB.</p>
        </div>

        {/* Selected Marksheet Preview */}
        {selectedMarksheet && (() => {
          const marks = selectedMarksheet.marks || [];
          const previewGroups = Object.values(
            marks.reduce((acc, m, idx) => {
              const key = m.type || `__none_${idx}`;
              if (!acc[key]) acc[key] = { type: m.type || "", marks: [] as (typeof m & { _idx: number })[] };
              acc[key].marks.push({ ...m, _idx: idx });
              return acc;
            }, {} as Record<string, { type: string; marks: (typeof marks[0] & { _idx: number })[] }>)
          );

          const previewTotal = previewGroups.reduce((acc, group) =>
            acc + group.marks.reduce((gacc, m) => {
              const est = Number(m.estimate_mark) || 0;
              const pct = Number(m.percentage) || 0;
              const sample = previewSamples[m._idx] ?? 0;
              return gacc + (est !== pct && est > 0 ? (sample / est) * pct : sample);
            }, 0), 0);

          return (
            <div className="py-2">
              <Label>Result Entry Preview</Label>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-sm">
                  <thead>
                    <tr>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={3}>Sl</th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={3}>BD/No</th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={3}>Rank</th>
                      <th className="border border-black px-3 py-2 text-left" rowSpan={3}>Name</th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={3}>Branch</th>
                      {previewGroups.map((group, gi) => (
                        <th
                          key={gi}
                          className="border border-black px-3 py-2 text-center font-semibold uppercase"
                          colSpan={group.marks.reduce((acc, m) => acc + (Number(m.estimate_mark) !== Number(m.percentage) ? 2 : 1), 0)}
                        >
                          {group.type || '—'}
                        </th>
                      ))}
                      <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={3}>Total</th>
                    </tr>
                    <tr>
                      {previewGroups.flatMap((group, gi) =>
                        group.marks.map((m, mi) => (
                          <th key={`${gi}-${mi}`}
                            className="border border-black px-2 py-2 text-center"
                            colSpan={Number(m.estimate_mark) !== Number(m.percentage) ? 2 : 1}
                          >
                            <div className="text-xs font-medium uppercase">{m.name || '—'}</div>
                          </th>
                        ))
                      )}
                    </tr>
                    <tr>
                      {previewGroups.flatMap((group, gi) =>
                        group.marks.map((m, mi) => {
                          const est = Number(m.estimate_mark);
                          const pct = Number(m.percentage);
                          if (est !== pct) {
                            return (
                              <React.Fragment key={`${gi}-${mi}`}>
                                <th className="border border-black px-1 py-1 text-center w-[80px] min-w-[80px]">{est.toFixed(0)}</th>
                                <th className="border border-black px-1 py-1 text-center w-[80px] min-w-[80px]">{pct.toFixed(0)}</th>
                              </React.Fragment>
                            );
                          }
                          return (
                            <th key={`${gi}-${mi}`} className="border border-black px-1 py-1 text-center min-w-[100px]">
                              {pct.toFixed(0)}
                            </th>
                          );
                        })
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-3 py-2 text-center text-gray-400 italic text-xs">1</td>
                      <td className="border border-black px-3 py-2 text-center text-gray-400 italic text-xs">BD-001</td>
                      <td className="border border-black px-3 py-2 text-center text-gray-400 italic text-xs">Flt Cdt</td>
                      <td className="border border-black px-3 py-2 text-gray-400 italic text-xs">Example Cadet</td>
                      <td className="border border-black px-3 py-2 text-center text-gray-400 italic text-xs">GD(P)</td>
                      {previewGroups.flatMap((group, gi) =>
                        group.marks.map((m, mi) => {
                          const est = Number(m.estimate_mark) || 0;
                          const pct = Number(m.percentage) || 0;
                          const sample = previewSamples[m._idx] ?? 0;
                          const isSplit = est !== pct;
                          if (isSplit) {
                            const converted = est > 0 ? (sample / est) * pct : 0;
                            return (
                              <React.Fragment key={`${gi}-${mi}`}>
                                <td className="border border-black px-2 py-1 text-center text-gray-400 italic text-xs w-[80px] min-w-[80px]">{sample.toFixed(0)}</td>
                                <td className="border border-black px-2 py-1 text-center text-gray-400 italic text-xs w-[80px] min-w-[80px]">{converted.toFixed(2)}</td>
                              </React.Fragment>
                            );
                          }
                          return (
                            <td key={`${gi}-${mi}`} className="border border-black px-2 py-1 text-center text-gray-400 italic text-xs min-w-[100px]">
                              {sample.toFixed(0)}
                            </td>
                          );
                        })
                      )}
                      <td className="border border-black px-3 py-2 text-center font-bold text-gray-500 text-xs">{previewTotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-3">Is Current?</Label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="is_current"
                  checked={formData.is_current === true}
                  onChange={() => handleChange("is_current", true)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Current:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This module is part of the current active syllabus.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="is_current"
                  checked={formData.is_current === false}
                  onChange={() => handleChange("is_current", false)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Legacy:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This module is kept for historical records only.</div>
                </div>
              </label>
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
                  <div className="text-sm text-gray-500 dark:text-gray-400">This subject module will be available for use.</div>
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
                  <div className="text-sm text-gray-500 dark:text-gray-400">This subject module will be hidden from general use.</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-8 mt-6 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors" disabled={loading}>
          Cancel
        </button>
        <button
          type="submit"
          className="px-8 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
          disabled={
            loading ||
            !formData.subject_name.trim() ||
            !formData.subject_code.trim() ||
            !formData.atw_subjects_module_marksheet_id
          }
        >
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {isEdit ? "Update Module" : "Create Module"}
        </button>
      </div>
    </form >
  );
}
