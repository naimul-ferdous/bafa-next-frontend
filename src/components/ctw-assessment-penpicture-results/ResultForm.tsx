/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { commonService } from "@/libs/services/commonService";
import { ctwAssessmentPenpictureGradeService } from "@/libs/services/ctwAssessmentPenpictureGradeService";
import { Icon } from "@iconify/react";
import type {
  SystemCourse,
  SystemSemester,
  SystemProgram,
  SystemBranch,
} from "@/libs/types/system";
import type { User, CadetProfile } from "@/libs/types/user";
import type { 
  CtwAssessmentPenpictureResult, 
  CtwAssessmentPenpictureGrade 
} from "@/libs/types/ctw";

interface ResultFormProps {
  initialData?: CtwAssessmentPenpictureResult | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

interface StrengthItem {
  id?: number;
  strength: string;
  is_active: boolean;
}

interface WeaknessItem {
  id?: number;
  weakness: string;
  is_active: boolean;
}

export default function ResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
  const [formData, setFormData] = useState({
    course_id: 0,
    semester_id: 0,
    program_id: 0,
    branch_id: 0,
    instructor_id: 0,
    cadet_id: 0,
    ctw_assessment_penpicture_grade_id: 0,
    pen_picture: "",
    course_performance: "",
  });

  const [strengths, setStrengths] = useState<StrengthItem[]>([
    { strength: "", is_active: true }
  ]);

  const [weaknesses, setWeaknesses] = useState<WeaknessItem[]>([
    { weakness: "", is_active: true }
  ]);

  const [error, setError] = useState("");

  // Dropdown data
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [grades, setGrades] = useState<CtwAssessmentPenpictureGrade[]>([]);
  const [filteredGrades, setFilteredGrades] = useState<CtwAssessmentPenpictureGrade[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const [options, gradesRes] = await Promise.all([
          commonService.getResultOptions(),
          ctwAssessmentPenpictureGradeService.getActiveGrades({
            course_id: formData.course_id || undefined,
            semester_id: formData.semester_id || undefined
          }),
        ]);

        if (options) {
          setCourses(options.courses || []);
          setSemesters(options.semesters || []);
          setPrograms(options.programs || []);
          setBranches(options.branches || []);
          setCadets(options.cadets || []);
          setInstructors(options.instructors || []);
        }
        setGrades(gradesRes);
        setFilteredGrades(gradesRes);
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setError("Failed to load required data. Please refresh the page.");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, []);

  // Fetch and filter grades based on selected course and semester
  useEffect(() => {
    const fetchFilteredGrades = async () => {
      if (formData.course_id && formData.semester_id) {
        try {
          const gradesRes = await ctwAssessmentPenpictureGradeService.getActiveGrades({
            course_id: formData.course_id,
            semester_id: formData.semester_id
          });
          setFilteredGrades(gradesRes);
          
          // Reset selected grade if it's not in the filtered list
          if (formData.ctw_assessment_penpicture_grade_id && !gradesRes.find(g => g.id === formData.ctw_assessment_penpicture_grade_id)) {
            setFormData(prev => ({ ...prev, ctw_assessment_penpicture_grade_id: 0 }));
          }
        } catch (err) {
          console.error("Failed to fetch filtered grades:", err);
        }
      } else {
        setFilteredGrades([]);
      }
    };

    fetchFilteredGrades();
  }, [formData.course_id, formData.semester_id]);

  // Populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        course_id: initialData.course_id,
        semester_id: initialData.semester_id,
        program_id: initialData.program_id,
        branch_id: initialData.branch_id || 0,
        instructor_id: initialData.instructor_id,
        cadet_id: initialData.cadet_id,
        ctw_assessment_penpicture_grade_id: initialData.ctw_assessment_penpicture_grade_id,
        pen_picture: initialData.pen_picture || "",
        course_performance: initialData.course_performance || "",
      });

      // Load strengths if available
      if (initialData.strengths && initialData.strengths.length > 0) {
        setStrengths(initialData.strengths.map(s => ({
          id: s.id,
          strength: s.strength,
          is_active: s.is_active,
        })));
      }

      // Load weaknesses if available
      if (initialData.weaknesses && initialData.weaknesses.length > 0) {
        setWeaknesses(initialData.weaknesses.map(w => ({
          id: w.id,
          weakness: w.weakness,
          is_active: w.is_active,
        })));
      }
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStrengthChange = (index: number, field: keyof StrengthItem, value: any) => {
    setStrengths(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addStrength = () => {
    setStrengths(prev => [...prev, { strength: "", is_active: true }]);
  };

  const removeStrength = (index: number) => {
    if (strengths.length > 1) {
      setStrengths(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleWeaknessChange = (index: number, field: keyof WeaknessItem, value: any) => {
    setWeaknesses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addWeakness = () => {
    setWeaknesses(prev => [...prev, { weakness: "", is_active: true }]);
  };

  const removeWeakness = (index: number) => {
    if (weaknesses.length > 1) {
      setWeaknesses(prev => prev.filter((_, i) => i !== index));
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
    if (!formData.instructor_id) {
      setError("Please select an instructor");
      return;
    }
    if (!formData.cadet_id) {
      setError("Please select a cadet");
      return;
    }
    if (!formData.ctw_assessment_penpicture_grade_id) {
      setError("Please select a grade");
      return;
    }

    try {
      const submitData = {
        ...formData,
        branch_id: formData.branch_id || undefined,
        strengths: strengths.filter(s => s.strength.trim() !== ""),
        weaknesses: weaknesses.filter(w => w.weakness.trim() !== ""),
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} result`);
    }
  };

  if (loadingDropdowns) {
    return (
      <div className="text-center py-12">
        <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
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

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="hugeicons:file-01" className="w-5 h-5 text-blue-500" />
            Basic Information
          </h3>

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
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Instructor <span className="text-red-500">*</span></Label>
              <select
                value={formData.instructor_id}
                onChange={(e) => handleChange("instructor_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Select Instructor</option>
                {instructors.map(instructor => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name} ({instructor.service_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Cadet <span className="text-red-500">*</span></Label>
              <select
                value={formData.cadet_id}
                onChange={(e) => handleChange("cadet_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Select Cadet</option>
                {cadets.map(cadet => (
                  <option key={cadet.id} value={cadet.id}>
                    {cadet.name} ({cadet.cadet_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Grade <span className="text-red-500">*</span></Label>
              <select
                value={formData.ctw_assessment_penpicture_grade_id}
                onChange={(e) => handleChange("ctw_assessment_penpicture_grade_id", parseInt(e.target.value))}
                className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 ${
                  !formData.course_id || !formData.semester_id ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={!formData.course_id || !formData.semester_id}
                required
              >
                <option value={0}>
                  {!formData.course_id || !formData.semester_id 
                    ? "Select Course & Semester first" 
                    : filteredGrades.length === 0 ? "No grades available for this selection" : "Select Grade"}
                </option>
                {filteredGrades.map(grade => (
                  <option key={grade.id} value={grade.id}>
                    {grade.grade_name} ({grade.grade_code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pen Picture & Course Performance */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="hugeicons:note-01" className="w-5 h-5 text-blue-500" />
            Assessment Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Pen Picture</Label>
              <textarea
                value={formData.pen_picture}
                onChange={(e) => handleChange("pen_picture", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                placeholder="Enter pen picture description..."
              />
            </div>

            <div>
              <Label>Course Performance</Label>
              <textarea
                value={formData.course_performance}
                onChange={(e) => handleChange("course_performance", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                placeholder="Enter course performance notes..."
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Icon icon="hugeicons:thumbs-up" className="w-5 h-5 text-green-500" />
                Strengths
              </h3>
              <button
                type="button"
                onClick={addStrength}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                Add Strength
              </button>
            </div>

            <div className="space-y-3">
              {strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-1">
                    <Input
                      value={strength.strength}
                      onChange={(e) => handleStrengthChange(index, "strength", e.target.value)}
                      placeholder="Enter strength..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStrength(index)}
                    disabled={strengths.length === 1}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove"
                  >
                    <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Icon icon="hugeicons:alert-02" className="w-5 h-5 text-orange-500" />
                Weaknesses
              </h3>
              <button
                type="button"
                onClick={addWeakness}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                Add Weakness
              </button>
            </div>

            <div className="space-y-3">
              {weaknesses.map((weakness, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-1">
                    <Input
                      value={weakness.weakness}
                      onChange={(e) => handleWeaknessChange(index, "weakness", e.target.value)}
                      placeholder="Enter weakness..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeWeakness(index)}
                    disabled={weaknesses.length === 1}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove"
                  >
                    <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2"
          disabled={loading}
        >
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Result" : "Save Result")}
        </button>
      </div>
    </form>
  );
}
