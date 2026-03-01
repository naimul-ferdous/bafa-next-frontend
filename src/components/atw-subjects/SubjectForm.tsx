/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import { commonService } from "@/libs/services/commonService";
import type {
  AtwSubject,
  SystemCourse,
  SystemSemester,
  SystemProgram,
  SystemBranch,
  SystemGroup,
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
    group_id: null as number | null,
    atw_subject_module_id: 0,
    is_current: true,
    is_active: true,
  });

  const [options, setOptions] = useState<{
    courses: SystemCourse[];
    semesters: SystemSemester[];
    programs: SystemProgram[];
    branches: SystemBranch[];
    groups: SystemGroup[];
    subjects: AtwSubjectModule[];
  }>({
    courses: [],
    semesters: [],
    programs: [],
    branches: [],
    groups: [],
    subjects: [],
  });

  const [error, setError] = useState("");

  // Load options
  useEffect(() => {
    const loadOptions = async () => {
      const data = await commonService.getResultOptions();
      if (data) {
        setOptions({
          courses: data.courses || [],
          semesters: data.semesters || [],
          programs: data.programs || [],
          branches: data.branches || [],
          groups: data.groups || [],
          subjects: data.subjects || [],
        });
      }
    };
    loadOptions();
  }, []);

  // Populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        course_id: initialData.course_id,
        semester_id: initialData.semester_id,
        program_id: initialData.program_id,
        branch_id: initialData.branch_id || null,
        group_id: initialData.group_id || null,
        atw_subject_module_id: initialData.atw_subject_module_id,
        is_current: initialData.is_current,
        is_active: initialData.is_active,
      });
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
        {/* Course Selection */}
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

        {/* Semester Selection */}
        <div>
          <Label>Semester <span className="text-red-500">*</span></Label>
          <select
            value={formData.semester_id}
            onChange={(e) => handleChange("semester_id", parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            required
          >
            <option value={0}>Select Semester</option>
            {options.semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>{semester.name} ({semester.code})</option>
            ))}
          </select>
        </div>

        {/* Program Selection */}
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

        {/* Subject Module Selection */}
        <div>
          <Label>Subject Module <span className="text-red-500">*</span></Label>
          <select
            value={formData.atw_subject_module_id}
            onChange={(e) => handleChange("atw_subject_module_id", parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            required
          >
            <option value={0}>Select Subject Module</option>
            {options.subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.subject_name} ({subject.subject_code})</option>
            ))}
          </select>
        </div>

        {/* Branch Selection (Optional) */}
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

        {/* Group Selection (Optional) */}
        <div>
          <Label>Group (Optional)</Label>
          <select
            value={formData.group_id || ""}
            onChange={(e) => handleChange("group_id", e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="">Select Group</option>
            {options.groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name} ({group.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subject Marks Preview Table */}
      {formData.atw_subject_module_id > 0 && (() => {
        const selectedModule = options.subjects.find(s => s.id === formData.atw_subject_module_id);
        if (!selectedModule || !selectedModule.subject_marks || selectedModule.subject_marks.length === 0) return null;

        // Group marks by their type
        const markGroups = (selectedModule.subject_marks || []).reduce((groups: any[], mark) => {
          const type = mark.type || 'Other';
          const existingGroup = groups.find(g => g.type === type);
          if (existingGroup) {
            existingGroup.marks.push(mark);
          } else {
            groups.push({ type, marks: [mark] });
          }
          return groups;
        }, []);

        return (
          <div className="overflow-x-auto">
            <table className="w-full rounded-lg border-collapse border border-black">
              <thead>
                <tr>
                  <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={2}>Module Name</th>
                  <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={2}>Code</th>
                  <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={2}>Row Type</th>
                  {markGroups.map(group => (
                    <th
                      key={group.type}
                      className="border border-black px-3 py-2 text-center font-bold text-gray-900 capitalize"
                      colSpan={group.marks.length}
                    >
                      {group.type.replace(/([A-Z])/g, ' $1').trim()}
                    </th>
                  ))}
                  <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={2}>Total</th>
                </tr>
                {/* Second header row - Individual marks */}
                <tr>
                  {markGroups.flatMap((group: any) =>
                    group.marks.map((mark: any) => (
                      <th key={mark.id} className="border border-black px-2 py-2 text-center min-w-[100px]">
                        <div className="font-medium">{mark.name}</div>
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Row 1: Estimated Marks */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="border border-black px-3 py-2 text-center font-bold text-gray-900 bg-white" rowSpan={2}>{selectedModule.subject_name}</td>
                  <td className="border border-black px-3 py-2 text-center font-bold bg-white" rowSpan={2}>{selectedModule.subject_code}</td>
                  <td className="border border-black px-3 py-2 text-center font-bold text-gray-700">Estimated Mark</td>
                  {markGroups.flatMap((group: any) =>
                    group.marks.map((mark: any) => (
                      <td key={`est-${mark.id}`} className="border border-black px-3 py-2 text-center bg-white">
                        {Number(mark.estimate_mark).toFixed(0)}
                      </td>
                    ))
                  )}
                  <td className="border border-black px-3 py-2 text-center font-bold">
                    {selectedModule.subject_marks.reduce((acc, curr) => acc + Number(curr.estimate_mark), 0).toFixed(0)}
                  </td>
                </tr>
                {/* Row 2: Percentages */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="border border-black px-3 py-2 text-center font-bold text-gray-700 border-t-0">Percentage</td>
                  {markGroups.flatMap((group: any) =>
                    group.marks.map((mark: any) => (
                      <td key={`per-${mark.id}`} className="border border-black px-3 py-2 text-center">
                        {Number(mark.percentage).toFixed(0)}
                      </td>
                    ))
                  )}
                  <td className="border border-black px-3 py-2 text-center font-bold">
                    {selectedModule.subject_marks.reduce((acc, curr) => acc + Number(curr.percentage), 0).toFixed(0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* Switches for is_current and is_active */}
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
              <div className="text-sm text-gray-500 dark:text-gray-400">
                This subject will be available for use throughout the system.
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
                This subject will be hidden from general use.
              </div>
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
