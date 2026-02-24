/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import { courseService } from "@/libs/services/courseService";
import { semesterService } from "@/libs/services/semesterService";
import { programService } from "@/libs/services/programService";
import { branchService } from "@/libs/services/branchService";
import { groupService } from "@/libs/services/groupService";
import { examService } from "@/libs/services/examService";
import { cadetService } from "@/libs/services/cadetService";
import { instructorService } from "@/libs/services/instructorService";
import { ctwSwordDrillAssessmentEstimatedMarkService } from "@/libs/services/ctwSwordDrillAssessmentEstimatedMarkService";
import { Icon } from "@iconify/react";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup, SystemExam } from "@/libs/types/system";
import type { CtwSwordDrillResult, CtwSwordDrillAssessmentEstimatedMark } from "@/libs/types/ctwSwordDrill";
import type { InstructorBiodata } from "@/libs/types/user";

interface ResultFormProps {
  initialData?: CtwSwordDrillResult | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

interface CadetRow {
  id?: number;
  cadet_id: number;
  cadet_bd_no: string;
  cadet_name: string;
  cadet_rank: string;
  branch: string;
  instructor_1_mark: number;
  instructor_2_mark: number;
  is_active: boolean;
}

export default function SwordDrillResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
  const [formData, setFormData] = useState({
    course_id: 0,
    semester_id: 0,
    program_id: 0,
    branch_id: 0,
    group_id: 0,
    exam_type_id: 0,
    instructor_1_id: 0,
    instructor_2_id: 0,
    remarks: "",
    is_active: true,
  });

  const [cadetRows, setCadetRows] = useState<CadetRow[]>([]);
  const [error, setError] = useState("");

  // Dropdown data
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [exams, setExams] = useState<SystemExam[]>([]);
  const [instructors, setInstructors] = useState<InstructorBiodata[]>([]);
  const [assessments, setAssessments] = useState<CtwSwordDrillAssessmentEstimatedMark[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingCadets, setLoadingCadets] = useState(false);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const [coursesRes, semestersRes, programsRes, branchesRes, groupsRes, examsRes, instructorsRes] = await Promise.all([
          courseService.getAllCourses({ per_page: 100 }),
          semesterService.getAllSemesters({ per_page: 100 }),
          programService.getAllPrograms({ per_page: 100 }),
          branchService.getAllBranches({ per_page: 100 }),
          groupService.getAllGroups({ per_page: 100 }),
          examService.getAllExams({ per_page: 100 }),
          instructorService.getAllInstructors({ per_page: 200 }),
        ]);

        setCourses(coursesRes.data.filter(c => c.is_active));
        setSemesters(semestersRes.data.filter(s => s.is_active));
        setPrograms(programsRes.data.filter(p => p.is_active));
        setBranches(branchesRes.data.filter(b => b.is_active));
        setGroups(groupsRes.data.filter(g => g.is_active));
        setExams(examsRes.data.filter(e => e.is_active));
        setInstructors(instructorsRes.data);
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setError("Failed to load required data. Please refresh the page.");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, []);

  // Load assessments when semester changes
  useEffect(() => {
    const loadAssessments = async () => {
      if (!formData.semester_id) {
        setAssessments([]);
        return;
      }

      try {
        setLoadingAssessments(true);
        const response = await ctwSwordDrillAssessmentEstimatedMarkService.getAllEstimatedMarks({
          semester_id: formData.semester_id,
          per_page: 100,
        });
        setAssessments(response.data.filter(a => a.is_active));
      } catch (err) {
        console.error("Failed to load assessments:", err);
        setAssessments([]);
      } finally {
        setLoadingAssessments(false);
      }
    };

    loadAssessments();
  }, [formData.semester_id]);

  // Check if exam type has assessment
  const hasAssessment = (examTypeId: number): boolean => {
    return assessments.some(a => a.exam_type_id === examTypeId);
  };

  // Auto-load cadets when filters change
  useEffect(() => {
    const loadCadets = async () => {
      // Only load if required filters are selected
      if (!formData.course_id || !formData.semester_id || !formData.program_id || !formData.branch_id || !formData.exam_type_id) {
        setCadetRows([]);
        return;
      }

      try {
        setLoadingCadets(true);
        const cadetsRes = await cadetService.getAllCadets({
          per_page: 500,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          program_id: formData.program_id,
          branch_id: formData.branch_id,
          group_id: formData.group_id || undefined,
        });

        // Create cadet rows
        const selectedBranch = branches.find(b => b.id === formData.branch_id);
        const rows: CadetRow[] = cadetsRes.data.filter(c => c.is_active).map(cadet => {
          // Get current rank from assigned_ranks (first active or latest)
          const currentRank = cadet.assigned_ranks?.find(ar => ar.rank)?.rank;
          return {
            cadet_id: cadet.id,
            cadet_bd_no: cadet.bd_no || cadet.cadet_number || "",
            cadet_name: cadet.name,
            cadet_rank: currentRank?.short_name || currentRank?.name || "Officer Cadet",
            branch: selectedBranch?.name || "N/A",
            instructor_1_mark: 0,
            instructor_2_mark: 0,
            is_active: true,
          };
        });

        setCadetRows(rows);
      } catch (err) {
        console.error("Failed to load cadets:", err);
      } finally {
        setLoadingCadets(false);
      }
    };

    // Don't reload cadets if we have initial data (edit mode)
    if (!initialData) {
      loadCadets();
    }
  }, [formData.course_id, formData.semester_id, formData.program_id, formData.branch_id, formData.group_id, formData.exam_type_id, initialData, branches]);

  // Populate form with initial data
  useEffect(() => {
    if (initialData) {
      // Get instructors from result marks (assuming first two unique instructors)
      const instructorIds = initialData.result_marks
        ? Array.from(new Set(initialData.result_marks.map(m => m.instructor_id)))
        : [];

      setFormData({
        course_id: initialData.course_id,
        semester_id: initialData.semester_id,
        program_id: initialData.program_id || 0,
        branch_id: initialData.branch_id || 0,
        group_id: initialData.group_id || 0,
        exam_type_id: initialData.exam_type_id,
        instructor_1_id: instructorIds[0] || 0,
        instructor_2_id: instructorIds[1] || 0,
        remarks: initialData.remarks || "",
        is_active: initialData.is_active,
      });

      // Load cadet rows from initial data
      if (initialData.result_marks && initialData.result_marks.length > 0) {
        // Group marks by cadet_id
        const cadetMarks = new Map<number, { instructor_1_mark: number; instructor_2_mark: number }>();

        initialData.result_marks.forEach(m => {
          if (!cadetMarks.has(m.cadet_id)) {
            cadetMarks.set(m.cadet_id, { instructor_1_mark: 0, instructor_2_mark: 0 });
          }
          const marks = cadetMarks.get(m.cadet_id)!;
          if (m.instructor_id === instructorIds[0]) {
            marks.instructor_1_mark = m.achieved_mark;
          } else if (m.instructor_id === instructorIds[1]) {
            marks.instructor_2_mark = m.achieved_mark;
          }
        });

        // Get unique cadets
        const uniqueCadets = Array.from(new Set(initialData.result_marks.map(m => m.cadet_id)));
        const rows: CadetRow[] = uniqueCadets.map(cadetId => {
          const mark = initialData.result_marks?.find(m => m.cadet_id === cadetId);
          const currentRank = mark?.cadet?.assigned_ranks?.find(ar => ar.rank)?.rank;
          const marks = cadetMarks.get(cadetId) || { instructor_1_mark: 0, instructor_2_mark: 0 };

          return {
            cadet_id: cadetId,
            cadet_bd_no: mark?.cadet?.bd_no || mark?.cadet?.cadet_number || "",
            cadet_name: mark?.cadet?.name || "Unknown",
            cadet_rank: currentRank?.short_name || currentRank?.name || "Officer Cadet",
            branch: initialData.branch?.name || "N/A",
            instructor_1_mark: marks.instructor_1_mark,
            instructor_2_mark: marks.instructor_2_mark,
            is_active: mark?.is_active || true,
          };
        });
        setCadetRows(rows);
      }
    }
  }, [initialData, branches]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCadetChange = (cadetIndex: number, field: keyof CadetRow, value: any) => {
    setCadetRows(prev => {
      const updated = [...prev];
      updated[cadetIndex] = {
        ...updated[cadetIndex],
        [field]: value
      };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.course_id) { setError("Please select a course"); return; }
    if (!formData.semester_id) { setError("Please select a semester"); return; }
    if (!formData.program_id) { setError("Please select a program"); return; }
    if (!formData.branch_id) { setError("Please select a branch"); return; }
    if (!formData.exam_type_id) { setError("Please select an exam type"); return; }
    if (!formData.instructor_1_id) { setError("Please select Instructor 1"); return; }
    if (!formData.instructor_2_id) { setError("Please select Instructor 2"); return; }

    try {
      // Create marks array with both instructor marks for each cadet
      const marks: any[] = [];
      cadetRows.filter(c => c.cadet_id > 0).forEach(c => {
        // Add mark for instructor 1
        marks.push({
          cadet_id: c.cadet_id,
          instructor_id: formData.instructor_1_id,
          achieved_mark: c.instructor_1_mark || 0,
        });
        // Add mark for instructor 2
        marks.push({
          cadet_id: c.cadet_id,
          instructor_id: formData.instructor_2_id,
          achieved_mark: c.instructor_2_mark || 0,
        });
      });

      const submitData = {
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        program_id: formData.program_id,
        branch_id: formData.branch_id,
        group_id: formData.group_id || undefined,
        exam_type_id: formData.exam_type_id,
        remarks: formData.remarks || undefined,
        is_active: formData.is_active,
        marks: marks,
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} result`);
    }
  };

  // Check if all required filters are selected
  const filtersSelected = formData.course_id && formData.semester_id && formData.program_id && formData.branch_id && formData.exam_type_id;

  if (loadingDropdowns) {
    return (
      <div className="w-full min-h-[20vh] flex items-center justify-center">
        <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
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
              <select value={formData.course_id} onChange={(e) => handleChange("course_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" required>
                <option value={0}>Select Course</option>
                {courses.map(course => (<option key={course.id} value={course.id}>{course.name} ({course.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Semester <span className="text-red-500">*</span></Label>
              <select value={formData.semester_id} onChange={(e) => handleChange("semester_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" required>
                <option value={0}>Select Semester</option>
                {semesters.map(semester => (<option key={semester.id} value={semester.id}>{semester.name} ({semester.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Program <span className="text-red-500">*</span></Label>
              <select value={formData.program_id} onChange={(e) => handleChange("program_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" required>
                <option value={0}>Select Program</option>
                {programs.map(program => (<option key={program.id} value={program.id}>{program.name} ({program.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Branch <span className="text-red-500">*</span></Label>
              <select value={formData.branch_id} onChange={(e) => handleChange("branch_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" required>
                <option value={0}>Select Branch</option>
                {branches.map(branch => (<option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Group</Label>
              <select value={formData.group_id} onChange={(e) => handleChange("group_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
                <option value={0}>Select Group (Optional)</option>
                {groups.map(group => (<option key={group.id} value={group.id}>{group.name} ({group.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Exam Type <span className="text-red-500">*</span></Label>
              <select
                value={formData.exam_type_id}
                onChange={(e) => handleChange("exam_type_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                required
                disabled={!formData.semester_id || loadingAssessments}
              >
                <option value={0}>
                  {loadingAssessments ? "Loading assessments..." : !formData.semester_id ? "Select semester first" : "Select Exam Type"}
                </option>
                {exams.map(exam => {
                  const hasExamAssessment = hasAssessment(exam.id);
                  return (
                    <option
                      key={exam.id}
                      value={exam.id}
                      disabled={!hasExamAssessment}
                    >
                      {exam.name} ({exam.code}) {!hasExamAssessment ? "- No Assessment" : ""}
                    </option>
                  );
                })}
              </select>
              {formData.semester_id && !loadingAssessments && (
                <p className="mt-1 text-xs text-gray-500">
                  Only exam types with assessments for this semester are enabled
                </p>
              )}
            </div>

            <div>
              <Label>Instructor 1 <span className="text-red-500">*</span></Label>
              <select
                value={formData.instructor_1_id}
                onChange={(e) => handleChange("instructor_1_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Select Instructor 1</option>
                {instructors.map(instructor => (
                  <option key={instructor.id} value={instructor.user_id}>
                    {instructor.user?.name || instructor.short_name || `Instructor #${instructor.id}`} ({instructor.user?.service_number || "N/A"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Instructor 2 <span className="text-red-500">*</span></Label>
              <select
                value={formData.instructor_2_id}
                onChange={(e) => handleChange("instructor_2_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Select Instructor 2</option>
                {instructors.map(instructor => (
                  <option key={instructor.id} value={instructor.user_id}>
                    {instructor.user?.name || instructor.short_name || `Instructor #${instructor.id}`} ({instructor.user?.service_number || "N/A"})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4">
              <Label>Remarks</Label>
              <textarea value={formData.remarks} onChange={(e) => handleChange("remarks", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Enter any remarks (optional)"></textarea>
            </div>
          </div>
        </div>

        {/* Marks Table */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="hugeicons:note-edit" className="w-5 h-5 text-blue-500" />
            Cadets Marks Entry
            {loadingCadets && (
              <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
            )}
          </h3>

          {!filtersSelected ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
              <p>Please select Course, Semester, Program, Branch, and Exam Type to load cadets</p>
            </div>
          ) : loadingCadets ? (
            <div className="w-full min-h-[20vh] flex items-center justify-center">
              <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
            </div>
          ) : cadetRows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:user-group" className="w-10 h-10 mx-auto mb-2" />
              <p>No cadets found for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr>
                    <th className="border border-black px-3 py-2 text-center uppercase" rowSpan={2}>SL</th>
                    <th className="border border-black px-3 py-2 text-center uppercase" rowSpan={2}>BD NO.</th>
                    <th className="border border-black px-3 py-2 text-center uppercase" rowSpan={2}>RANK</th>
                    <th className="border border-black px-3 py-2 text-left uppercase" rowSpan={2}>NAME</th>
                    <th className="border border-black px-3 py-2 text-left uppercase" rowSpan={2}>Branch</th>
                    <th className="border border-black px-3 py-2 text-center uppercase" colSpan={2}>INSTRUCTORS</th>
                    <th className="border border-black px-3 py-2 text-center uppercase" rowSpan={2}>TOTAL</th>
                  </tr>
                  <tr>
                    <th className="border border-black px-2 py-2 text-center">Instr-01</th>
                    <th className="border border-black px-2 py-2 text-center">Instr-02</th>
                  </tr>
                </thead>
                <tbody>
                  {cadetRows.map((cadet, index) => {
                    const total = (cadet.instructor_1_mark || 0) + (cadet.instructor_2_mark || 0);
                    return (
                      <tr key={cadet.cadet_id}>
                        <td className="border border-black px-3 py-2 text-center font-medium">{index + 1}</td>
                        <td className="border border-black px-3 py-2 text-center">{cadet.cadet_bd_no}</td>
                        <td className="border border-black px-3 py-2 text-center">{cadet.cadet_rank}</td>
                        <td className="border border-black px-3 py-2 font-medium">{cadet.cadet_name}</td>
                        <td className="border border-black px-3 py-2 font-medium">{cadet.branch}</td>
                        <td className="border border-black px-2 py-1 text-center">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={cadet.instructor_1_mark || 0}
                            onChange={(e) => handleCadetChange(index, "instructor_1_mark", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="0"
                          />
                        </td>
                        <td className="border border-black px-2 py-1 text-center">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={cadet.instructor_2_mark || 0}
                            onChange={(e) => handleCadetChange(index, "instructor_2_mark", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="0"
                          />
                        </td>
                        <td className="border border-black px-3 py-2 text-center font-bold text-blue-700">
                          {total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-50" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2" disabled={loading}>
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Result" : "Save Result")}
        </button>
      </div>
    </form>
  );
}
