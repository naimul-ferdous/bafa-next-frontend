/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { commonService } from "@/libs/services/commonService";
import { Icon } from "@iconify/react";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch, AtwSubject } from "@/libs/types/system";

interface SubjectFormProps {
  initialData?: AtwSubject | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

interface SubjectMark {
  id?: number;
  name: string;
  type: string;
  percentage: number;
  estimate_mark: number;
}

export default function SubjectForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: SubjectFormProps) {
  const [formData, setFormData] = useState({
    course_id: 0,
    semester_id: 0,
    program_id: 0,
    branch_id: 0,
    subject_name: "",
    subject_code: "",
    subject_legend: "",
    subject_period: "",
    subjects_full_mark: 0,
    subjects_credit: 0,
    is_professional: false,
    is_active: true,
  });
  const [subjectMarks, setSubjectMarks] = useState<SubjectMark[]>([
    { name: "", type: "", percentage: 0, estimate_mark: 0 }
  ]);
  const [error, setError] = useState("");

  // Dropdown data
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  const filteredBranches = useMemo(() => {
    if (!formData.program_id) return [];
    return branches.filter(b => b.program_id === formData.program_id);
  }, [branches, formData.program_id]);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const data = await commonService.getResultOptions();
        
        if (data) {
          setCourses(data.courses.filter(c => c.is_active));
          setSemesters(data.semesters.filter(s => s.is_active && !!s.is_academic));
          setPrograms(data.programs.filter(p => p.is_active));
          setBranches(data.branches.filter(b => b.is_active));
        }
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setError("Failed to load required data. Please refresh the page.");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, []);

  // Populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        course_id: initialData.course_id,
        semester_id: initialData.semester_id,
        program_id: initialData.program_id,
        branch_id: initialData.branch_id || 0,
        subject_name: initialData.subject_name,
        subject_code: initialData.subject_code,
        subject_legend: initialData.subject_legend || "",
        subject_period: initialData.subject_period || "",
        subjects_full_mark: initialData.subjects_full_mark,
        subjects_credit: initialData.subjects_credit,
        is_professional: initialData.is_professional,
        is_active: initialData.is_active,
      });

      // Load subject marks if available (check both subject_marks and subjectMarks)
      const marks = initialData.subject_marks || (initialData as any).subjectMarks;
      if (marks && marks.length > 0) {
        setSubjectMarks(marks.map((mark: any) => ({
          id: mark.id,
          name: mark.name,
          type: mark.type || "",
          percentage: mark.percentage,
          estimate_mark: mark.estimate_mark,
        })));
      }
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMarkChange = (index: number, field: keyof SubjectMark, value: any) => {
    setSubjectMarks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMarkRow = () => {
    setSubjectMarks(prev => [...prev, { name: "", type: "", percentage: 0, estimate_mark: 0 }]);
  };

  const removeMarkRow = (index: number) => {
    if (subjectMarks.length > 1) {
      setSubjectMarks(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.course_id) {
      setError("Please select a course");
      return;
    }
    if (!formData.semester_id) {
      setError("Please select a semester");
      return;
    }
    if (!formData.program_id) {
      setError("Please select a program");
      return;
    }

    try {
      const submitData = {
        ...formData,
        branch_id: formData.branch_id || undefined,
        subject_marks: subjectMarks.filter(mark => mark.name.trim() !== ""),
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} subject`);
    }
  };

  if (loadingDropdowns) {
    return (
      <div className="text-center py-12">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-gray-600">Loading form data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Course, Semester, Program, Branch */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Course <span className="text-red-500">*</span></Label>
            <select
              value={formData.course_id}
              onChange={(e) => handleChange("course_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={0}>Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Semester <span className="text-red-500">*</span></Label>
            <select
              value={formData.semester_id}
              onChange={(e) => handleChange("semester_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={0}>Select Semester</option>
              {semesters.map(semester => (
                <option key={semester.id} value={semester.id}>{semester.name} ({semester.code})</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Program <span className="text-red-500">*</span></Label>
            <select
              value={formData.program_id}
              onChange={(e) => handleChange("program_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={0}>Select Program</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>{program.name} ({program.code})</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Branch</Label>
            <select
              value={formData.branch_id}
              onChange={(e) => handleChange("branch_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Select Branch (Optional)</option>
              {filteredBranches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Subject Name <span className="text-red-500">*</span></Label>
            <Input value={formData.subject_name} onChange={(e) => handleChange("subject_name", e.target.value)} placeholder="Enter subject name" required />
          </div>
          <div>
            <Label>Subject Code <span className="text-red-500">*</span></Label>
            <Input value={formData.subject_code} onChange={(e) => handleChange("subject_code", e.target.value)} placeholder="Enter subject code" required />
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
            <Label>Full Mark</Label>
            <Input type="number" step={0.01} value={formData.subjects_full_mark} onChange={(e) => handleChange("subjects_full_mark", parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </div>
          <div>
            <Label>Credit</Label>
            <Input type="number" step={0.01} value={formData.subjects_credit} onChange={(e) => handleChange("subjects_credit", parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </div>
        </div>

        {/* Professional Status */}
        <div className="border border-gray-200 rounded-lg p-4">
          <Label className="mb-3">Subject Type</Label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_professional}
                onChange={(e) => handleChange("is_professional", e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-900">Professional Subject</span>
            </label>
          </div>
        </div>

        {/* Active Status */}
        <div className="border border-gray-200 rounded-lg p-4">
          <Label className="mb-3">Status</Label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
              <div>
                <div className="font-medium text-gray-900">Active:</div>
                <div className="text-sm text-gray-500">This subject will be available for use throughout the system.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
              <div>
                <div className="font-medium text-gray-900">Inactive:</div>
                <div className="text-sm text-gray-500">This subject will be hidden from general use.</div>
              </div>
            </label>
          </div>
        </div>

        {/* Marks Distribution */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
              <Label className="mb-0">Marks Distribution</Label>
              <button
                type="button"
                onClick={addMarkRow}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                Add Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">Sl.</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">Title</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">Select Type</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">Mark Percentage</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">Exam Mark</th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectMarks.map((mark, index) => (
                    <tr key={index} className="bg-white">
                      <td className="border border-gray-300 px-4 py-2 text-center text-gray-900">{index + 1}</td>
                      <td className="border border-gray-300 px-2 py-2">
                        <input
                          type="text"
                          value={mark.name}
                          onChange={(e) => handleMarkChange(index, "name", e.target.value)}
                          placeholder="Enter Mark Title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-2">
                        <select
                          value={mark.type}
                          onChange={(e) => handleMarkChange(index, "type", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="">Select a Subject Type</option>
                          <option value="entrytest">Entry Test</option>
                          <option value="attendance">Attendence</option>
                          <option value="classtest">Class Test</option>
                          <option value="quiztest">Quiz Test</option>
                          <option value="assignment">Assignment</option>
                          <option value="presentation">Presentation</option>
                          <option value="viva">Viva</option>
                          <option value="note">Note</option>
                          <option value="experiment">Experiment</option>
                          <option value="midsemester">Mid Semester</option>
                          <option value="endsemester">End Semester</option>
                        </select>
                      </td>
                      <td className="border border-gray-300 px-2 py-2">
                        <input
                          type="number"
                          step={0.01}
                          value={mark.percentage}
                          onChange={(e) => handleMarkChange(index, "percentage", parseFloat(e.target.value) || 0)}
                          placeholder="Enter Marks Percentage"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          min={0}
                          max={100}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-2">
                        <input
                          type="number"
                          step={0.01}
                          value={mark.estimate_mark}
                          onChange={(e) => handleMarkChange(index, "estimate_mark", parseFloat(e.target.value) || 0)}
                          placeholder="Enter Exam Mark"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          min={0}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        {subjectMarks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMarkRow(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Remove"
                          >
                            <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                          </button>
                        )}
                        {subjectMarks.length === 1 && (
                          <button
                            type="button"
                            onClick={addMarkRow}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Add"
                          >
                            <Icon icon="hugeicons:add-circle" className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-50" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2" disabled={loading}>
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Subject" : "Save Subject")}
        </button>
      </div>
    </form>
  );
}
