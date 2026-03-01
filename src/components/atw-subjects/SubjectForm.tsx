/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import { commonService } from "@/libs/services/commonService";
import type {
  AtwSubject,
  SystemCourse,
  SystemSemester,
  SystemProgram,
  SystemBranch,
  AtwSubjectModule
} from "@/libs/types/system";

interface SubjectFormProps {
  initialData?: AtwSubject | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export default function SubjectForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: SubjectFormProps) {
  const [formData, setFormData] = useState({
    course_id: 0,
    semester_id: 0,
    program_id: 0,
    branch_id: null as number | null,
    atw_subject_module_id: 0,
    is_current: true,
    is_active: true,
  });

  const [options, setOptions] = useState<{
    courses: SystemCourse[];
    semesters: SystemSemester[];
    programs: SystemProgram[];
    branches: SystemBranch[];
    subjects: AtwSubjectModule[];
  }>({
    courses: [],
    semesters: [],
    programs: [],
    branches: [],
    subjects: [],
  });

  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [error, setError] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadOptions = async () => {
      const data = await commonService.getResultOptions();
      if (data) {
        setOptions({
          courses: data.courses || [],
          semesters: data.semesters || [],
          programs: data.programs || [],
          branches: data.branches || [],
          subjects: data.subjects || [],
        });
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        course_id: initialData.course_id,
        semester_id: initialData.semester_id,
        program_id: initialData.program_id,
        branch_id: initialData.branch_id || null,
        atw_subject_module_id: initialData.atw_subject_module_id,
        is_current: initialData.is_current,
        is_active: initialData.is_active,
      });
    }
  }, [initialData]);

  // Fetch semesters whenever course changes
  useEffect(() => {
    if (!formData.course_id) {
      setOptions(prev => ({ ...prev, semesters: [] }));
      return;
    }
    const fetchSemesters = async () => {
      setLoadingSemesters(true);
      const semesters = await commonService.getSemestersByCourse(formData.course_id);
      setOptions(prev => ({ ...prev, semesters }));
      if (semesters.length > 0) {
        setFormData(prev => ({ ...prev, semester_id: semesters[0].id }));
      }
      setLoadingSemesters(false);
    };
    fetchSemesters();
  }, [formData.course_id]);

  const handleChange = (field: string, value: any) => {
    if (field === 'course_id') {
      setFormData(prev => ({ ...prev, course_id: value, semester_id: 0 }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedModule = useMemo(() =>
    options.subjects.find(s => s.id === formData.atw_subject_module_id),
    [options.subjects, formData.atw_subject_module_id]
  );

  const previewSamples = useMemo(() => {
    const marks = selectedModule?.marksheet?.marks || [];
    return marks.map(m => Math.max(0, (Number(m.estimate_mark) || 0) - 1));
  }, [selectedModule]);

  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.toLowerCase();
    if (!q) return options.subjects;
    return options.subjects.filter(s =>
      s.subject_name.toLowerCase().includes(q) || s.subject_code.toLowerCase().includes(q)
    );
  }, [options.subjects, subjectSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(e.target as Node)) {
        setSubjectDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.course_id || !formData.semester_id || !formData.program_id || !formData.atw_subject_module_id) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} ATW subject`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <Label>Course <span className="text-red-500">*</span></Label>
          <select
            value={formData.course_id}
            onChange={(e) => handleChange("course_id", parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            required
          >
            <option value={0}>Select Course</option>
            {options.courses.map((course) => (
              <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Semester <span className="text-red-500">*</span></Label>
          <div className="relative">
            <select
              value={formData.semester_id}
              onChange={(e) => handleChange("semester_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
              required
              disabled={!formData.course_id || loadingSemesters || (!!formData.course_id && !loadingSemesters && options.semesters.length === 0)}
            >
              <option value={0}>
                {loadingSemesters
                  ? 'Loading...'
                  : !formData.course_id
                    ? 'Select course first'
                    : options.semesters.length === 0
                      ? 'No semester on this course'
                      : 'Select Semester'}
              </option>
              {options.semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>{semester.name} ({semester.code})</option>
              ))}
            </select>
            {loadingSemesters && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div>
          <Label>Program <span className="text-red-500">*</span></Label>
          <select
            value={formData.program_id}
            onChange={(e) => handleChange("program_id", parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            required
          >
            <option value={0}>Select Program</option>
            {options.programs.map((program) => (
              <option key={program.id} value={program.id}>{program.name} ({program.code})</option>
            ))}
          </select>
        </div>

        <div ref={subjectDropdownRef} className="relative">
          <Label>Subject <span className="text-red-500">*</span></Label>
          <div
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 cursor-pointer flex items-center justify-between gap-2"
            onClick={() => setSubjectDropdownOpen(prev => !prev)}
          >
            <span className={selectedModule ? "text-gray-900" : "text-gray-400"}>
              {selectedModule ? `${selectedModule.subject_name} (${selectedModule.subject_code})` : "Select Subject Module"}
            </span>
            <Icon icon={subjectDropdownOpen ? "hugeicons:arrow-up-01" : "hugeicons:arrow-down-01"} className="w-4 h-4 text-gray-400 shrink-0" />
          </div>
          {subjectDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    placeholder="Search subject..."
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              </div>
              <ul className="max-h-52 overflow-y-auto py-1">
                <li
                  className="px-4 py-2 text-sm text-gray-400 cursor-pointer hover:bg-gray-50"
                  onClick={() => { handleChange("atw_subject_module_id", 0); setSubjectSearch(""); setSubjectDropdownOpen(false); }}
                >
                  — Select Subject —
                </li>
                {filteredSubjects.length === 0 ? (
                  <li className="px-4 py-2 text-sm text-gray-400 italic">No results found</li>
                ) : (
                  filteredSubjects.map(subject => (
                    <li
                      key={subject.id}
                      className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 ${formData.atw_subject_module_id === subject.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-900"}`}
                      onClick={() => { handleChange("atw_subject_module_id", subject.id); setSubjectSearch(""); setSubjectDropdownOpen(false); }}
                    >
                      {subject.subject_name} <span className="text-gray-400">({subject.subject_code})</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <div>
          <Label>Branch (Optional)</Label>
          <select
            value={formData.branch_id || ""}
            onChange={(e) => handleChange("branch_id", e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="">Select Branch</option>
            {options.branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Result Entry Preview */}
      {selectedModule && (() => {
        const marks = selectedModule.marksheet?.marks || [];
        if (marks.length === 0) return null;

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

      <div className="flex gap-8">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_current}
            onChange={(e) => handleChange("is_current", e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="font-medium text-gray-900">Is Current</span>
        </label>
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
              <div className="text-sm text-gray-500 dark:text-gray-400">This subject will be available for use throughout the system.</div>
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
              <div className="text-sm text-gray-500 dark:text-gray-400">This subject will be hidden from general use.</div>
            </div>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-100 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 transition-colors"
          disabled={loading}
        >
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update ATW Subject" : "Save ATW Subject")}
        </button>
      </div>
    </form>
  );
}
