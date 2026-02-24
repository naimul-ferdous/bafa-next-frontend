/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import { cadetService } from "@/libs/services/cadetService";
import { commonService } from "@/libs/services/commonService";
import { atwResultService } from "@/libs/services/atwResultService";
import { atwInstructorAssignCadetService } from "@/libs/services/atwInstructorAssignCadetService";
import { useAuth } from "@/libs/hooks/useAuth";
import { Icon } from "@iconify/react";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup, SystemExam, AtwSubject, AtwSubjectMark } from "@/libs/types/system";
import type { AtwResult } from "@/libs/types/atwResult";

interface ResultFormProps {
  initialData?: AtwResult | null;
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
  cadet_branch: string;
  gender?: string;
  remarks: string;
  is_present: boolean;
  absent_reason: string;
  is_active: boolean;
  marks: { [markId: number]: number };
}

// Group marks by type
interface MarkGroup {
  type: string;
  marks: AtwSubjectMark[];
}

export default function ResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    course_id: 0,
    semester_id: 0,
    program_id: 0,
    branch_id: 0,
    group_id: 0,
    exam_type_id: 0,
    atw_subject_id: 0,
    instructor_id: 0,
    is_active: true,
  });

  useEffect(() => {
    if (!initialData && user?.id) {
      setFormData(prev => ({ ...prev, instructor_id: user.id }));
    }
  }, [user, initialData]);

  const [cadetRows, setCadetRows] = useState<CadetRow[]>([]);
  const [error, setError] = useState("");
  const [alreadyExists, setAlreadyExists] = useState(false);

  // Check if record already exists
  useEffect(() => {
    const checkExistence = async () => {
      if (isEdit) return; // Don't check existence in edit mode
      
      if (
        formData.course_id &&
        formData.semester_id &&
        formData.program_id &&
        formData.branch_id &&
        formData.exam_type_id &&
        formData.atw_subject_id &&
        formData.instructor_id
      ) {
        try {
          const exists = await atwResultService.checkExistence({
            course_id: formData.course_id,
            semester_id: formData.semester_id,
            program_id: formData.program_id,
            branch_id: formData.branch_id,
            group_id: formData.group_id || undefined,
            exam_type_id: formData.exam_type_id,
            atw_subject_id: formData.atw_subject_id,
            instructor_id: formData.instructor_id
          });

          if (exists) {
            setAlreadyExists(true);
            if (error !== "This result has already been entered for the selected criteria.") {
              setError("This result has already been entered for the selected criteria.");
            }
          } else {
            setAlreadyExists(false);
            if (error === "This result has already been entered for the selected criteria.") {
              setError("");
            }
          }
        } catch (err) {
          console.error("Failed to check result existence:", err);
        }
      } else {
        setAlreadyExists(false);
        if (error === "This result has already been entered for the selected criteria.") {
          setError("");
        }
      }
    };

    checkExistence();
  }, [
    formData.course_id,
    formData.semester_id,
    formData.program_id,
    formData.branch_id,
    formData.group_id,
    formData.exam_type_id,
    formData.atw_subject_id,
    formData.instructor_id,
    isEdit,
    error
  ]);

  // Dropdown data
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [exams, setExams] = useState<SystemExam[]>([]);
  const [subjects, setSubjects] = useState<AtwSubject[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingCadets, setLoadingCadets] = useState(false);

  // Selected subject for marks
  const [selectedSubject, setSelectedSubject] = useState<AtwSubject | null>(null);
  const [markGroups, setMarkGroups] = useState<MarkGroup[]>([]);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const options = await commonService.getResultOptions();

        if (options) {
          setCourses(options.courses);
          setSemesters(options.semesters);
          setPrograms(options.programs);
          setBranches(options.branches);
          setGroups(options.groups);
          setExams(options.exams);
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

  useEffect(() => {

    if (!user?.atw_assigned_subjects || user.atw_assigned_subjects.length === 0) {
      setSubjects([]);
      return;
    }
    const filteredAssignments = user.atw_assigned_subjects.filter((as: any) =>
      as.course_id === Number(formData.course_id) &&
      as.semester_id === Number(formData.semester_id) &&
      as.program_id === Number(formData.program_id) &&
      as.branch_id === Number(formData.branch_id) &&
      (!as.group_id || as.group_id === Number(formData.group_id))
    );
    const filteredSubjects = filteredAssignments.map((as: any) => ({
      ...(as.subject || {}),
      subject_marks: as.subject?.subject_marks || as.subject?.subjectMarks || []
    })).filter(s => s.id);
    setSubjects(filteredSubjects);
    if (formData.atw_subject_id && !filteredSubjects.some(s => s.id === formData.atw_subject_id)) {
      setFormData(prev => ({ ...prev, atw_subject_id: 0 }));
    }
  }, [formData.course_id, formData.semester_id, formData.program_id, formData.branch_id, formData.group_id, formData.atw_subject_id, user?.atw_assigned_subjects]);

  useEffect(() => {
    if (formData.atw_subject_id) {
      const subject = subjects.find(s => s.id === formData.atw_subject_id);
      setSelectedSubject(subject || null);
      if (subject?.subject_marks) {
        const groups: { [key: string]: AtwSubjectMark[] } = {};
        subject.subject_marks.forEach(mark => {
          const type = mark.type || "Other";
          if (!groups[type]) groups[type] = [];
          groups[type].push(mark);
        });
        setMarkGroups(Object.entries(groups).map(([type, marks]) => ({ type, marks })));
      } else {
        setMarkGroups([]);
      }
    } else {
      setSelectedSubject(null);
      setMarkGroups([]);
    }
  }, [formData.atw_subject_id, subjects]);

  // Auto-load cadets when filters change
  useEffect(() => {
    const loadCadets = async () => {
      // Only load if required filters are selected
      if (!formData.course_id || !formData.semester_id || !formData.program_id || !formData.branch_id || !formData.atw_subject_id) {
        setCadetRows([]);
        return;
      }

      try {
        setLoadingCadets(true);
        let cadetsList: any[] = [];
        if (user?.instructor_biodata && formData.atw_subject_id) {
          const assignedCadetsRes = await atwInstructorAssignCadetService.getAll({
            per_page: 500,
            course_id: formData.course_id,
            semester_id: formData.semester_id,
            program_id: formData.program_id,
            branch_id: formData.branch_id,
            group_id: formData.group_id || undefined,
            subject_id: formData.atw_subject_id,
            instructor_id: user.id,
            is_active: true
          });

          if (assignedCadetsRes.data.length > 0) {
            cadetsList = assignedCadetsRes.data.map((as: any) => as.cadet);
          } else {
            cadetsList = [];
          }
        } else {
          // Fallback for admins or if no specific instructor assignment logic needed
          const cadetsRes = await cadetService.getAllCadets({
            per_page: 500,
            course_id: formData.course_id,
            semester_id: formData.semester_id,
            program_id: formData.program_id,
            branch_id: formData.branch_id,
            group_id: formData.group_id || undefined,
          });
          cadetsList = cadetsRes.data;
        }

        // Create cadet rows
        const rows: CadetRow[] = cadetsList.filter(c => c).map(cadet => {
          // Get current rank from assigned_ranks (first active or latest)
          const currentRank = cadet.assigned_ranks?.find((ar: any) => ar.rank)?.rank;
          return {
            cadet_id: cadet.id,
            cadet_bd_no: cadet.bd_no || cadet.cadet_number || "",
            cadet_name: cadet.name,
            cadet_rank: currentRank?.short_name || currentRank?.name || "-",
            cadet_branch: cadet.assigned_branchs?.find((ab: any) => ab.is_current)?.branch?.name || cadet.assigned_branchs?.[0]?.branch?.name || "N/A",
            gender: cadet.gender,
            remarks: "",
            is_present: true,
            absent_reason: "",
            is_active: true,
            marks: {},
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
  }, [formData.course_id, formData.semester_id, formData.program_id, formData.branch_id, formData.group_id, formData.atw_subject_id, user, initialData]);

  // Populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        course_id: initialData.course_id,
        semester_id: initialData.semester_id,
        program_id: initialData.program_id,
        branch_id: initialData.branch_id || 0,
        group_id: initialData.group_id || 0,
        exam_type_id: initialData.exam_type_id,
        atw_subject_id: initialData.atw_subject_id,
        instructor_id: initialData.instructor_id || 0,
        is_active: initialData.is_active,
      });

      // Load cadet rows from initial data
      if (initialData.result_getting_cadets && initialData.result_getting_cadets.length > 0) {
        const rows: CadetRow[] = initialData.result_getting_cadets.map(c => {
          const marks: { [markId: number]: number } = {};
          c.cadet_marks?.forEach(m => {
            marks[m.atw_subject_mark_id] = Number(m.achieved_mark) || 0;
          });
          // Get rank from cadet's assigned_ranks if available
          const currentRank = c.cadet?.assigned_ranks?.find(ar => ar.rank)?.rank;
          return {
            id: c.id,
            cadet_id: c.cadet_id,
            cadet_bd_no: c.cadet_bd_no,
            cadet_name: c.cadet?.name || "Unknown",
            cadet_rank: currentRank?.short_name || currentRank?.name || "-",
            cadet_branch: c.cadet?.assigned_branchs?.find((ab: any) => ab.is_current)?.branch?.name || c.cadet?.assigned_branchs?.[0]?.branch?.name || "N/A",
            gender: c.cadet?.gender,
            remarks: c.remarks || "",
            is_present: c.is_present,
            absent_reason: c.absent_reason || "",
            is_active: c.is_active,
            marks,
          };
        });
        setCadetRows(rows);
      }
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMarkChange = (cadetIndex: number, markId: number, value: number) => {
    setCadetRows(prev => {
      const updated = [...prev];
      updated[cadetIndex] = {
        ...updated[cadetIndex],
        marks: { ...updated[cadetIndex].marks, [markId]: value }
      };
      return updated;
    });
  };

  const handlePresentChange = (cadetIndex: number, isPresent: boolean) => {
    setCadetRows(prev => {
      const updated = [...prev];
      updated[cadetIndex] = {
        ...updated[cadetIndex],
        is_present: isPresent,
        // Clear marks if not present
        marks: isPresent ? updated[cadetIndex].marks : {}
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
    if (!formData.atw_subject_id) { setError("Please select a subject"); return; }
    if (!formData.instructor_id) { setError("User session error: Instructor ID not found. Please re-login."); return; }

    try {
      const submitData = {
        ...formData,
        group_id: formData.group_id || undefined,
        cadets: cadetRows.filter(c => c.cadet_id > 0).map(c => ({
          cadet_id: c.cadet_id,
          cadet_bd_no: c.cadet_bd_no,
          remarks: c.remarks || undefined,
          is_present: c.is_present,
          absent_reason: c.is_present ? undefined : c.absent_reason,
          is_active: c.is_active,
          marks: Object.entries(c.marks).map(([markId, achievedMark]) => ({
            subject_id: formData.atw_subject_id,
            atw_subject_mark_id: parseInt(markId),
            achieved_mark: achievedMark || 0,
            is_active: true,
          })),
        })),
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} result`);
    }
  };

  // Check if all required filters are selected
  const filtersSelected = formData.course_id && formData.semester_id && formData.program_id && formData.branch_id;
  const subjectSelected = formData.atw_subject_id > 0;

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
              <select value={formData.exam_type_id} onChange={(e) => handleChange("exam_type_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" required>
                <option value={0}>Select Exam Type</option>
                {exams.map(exam => (<option key={exam.id} value={exam.id}>{exam.name} ({exam.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Subject <span className="text-red-500">*</span></Label>
              <select value={formData.atw_subject_id} onChange={(e) => handleChange("atw_subject_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" required>
                <option value={0}>Select Subject</option>
                {subjects.map(subject => (<option key={subject.id} value={subject.id}>{subject.subject_name} ({subject.subject_code})</option>))}
              </select>
            </div>
          </div>
        </div>

        {/* Marks Table */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="hugeicons:note-edit" className="w-5 h-5 text-blue-500" />
            Result Marks Entry
            {selectedSubject && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ~ {selectedSubject.subject_name} ({selectedSubject.subject_code})
              </span>
            )}
            {loadingCadets && (
              <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
            )}
          </h3>

          {!filtersSelected ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
              <p>Please select Course, Semester, Program, and Branch to load cadets</p>
            </div>
          ) : !subjectSelected ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:book-02" className="w-10 h-10 mx-auto mb-2" />
              <p>Please select a Subject to see mark columns</p>
            </div>
          ) : alreadyExists ? (
            <div className="text-center py-12 text-red-500 bg-red-50 rounded-lg border border-red-100">
              <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-2" />
              <p className="font-semibold text-lg">Already result mark inputed</p>
              <p className="text-sm">A result for these criteria already exists in the system.</p>
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
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  {/* First header row - Mark type groups */}
                  <tr>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>SL</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>BD NO.</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>RANK</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={2}>NAME</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>BRANCH</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>PRESENT</th>
                    {markGroups.map(group => (
                      <th
                        key={group.type}
                        className="border border-black px-3 py-2 text-center font-semibold uppercase"
                        colSpan={group.marks.length}
                      >
                        {group.type}
                      </th>
                    ))}
                    <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={2}>TOTAL</th>
                  </tr>
                  {/* Second header row - Individual marks */}
                  <tr>
                    {markGroups.flatMap(group =>
                      group.marks.map(mark => (
                        <th key={mark.id} className="border border-black px-2 py-2 text-center min-w-[100px]">
                          <div className="text-xs font-medium">{mark.name}</div>
                          <div className="text-xs text-gray-500">({mark.percentage}%)</div>
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {cadetRows.map((cadet, index) => {
                    // Calculate row total
                    const rowTotal = markGroups.reduce((acc, group) => {
                      return acc + group.marks.reduce((groupAcc, mark) => {
                        const inputMark = cadet.marks[mark.id] || 0;
                        let adjustedMark = inputMark;
                        
                        // If estimate_mark and percentage are different, convert input to percentage equivalent
                        if (mark.estimate_mark !== mark.percentage && mark.estimate_mark > 0) {
                          adjustedMark = (inputMark / mark.estimate_mark) * mark.percentage;
                        }
                        
                        return groupAcc + adjustedMark;
                      }, 0);
                    }, 0);

                    return (
                      <tr key={cadet.cadet_id}>
                        <td className="border border-black px-3 py-2 text-center font-medium">{index + 1}</td>
                        <td className="border border-black px-3 py-2 text-center">{cadet.cadet_bd_no}</td>
                        <td className="border border-black px-3 py-2 text-center">{cadet.cadet_rank}</td>
                        <td className={`border border-black px-3 py-2 font-medium ${!cadet.is_present ? 'text-red-500' : ''}`}>
                          {cadet.cadet_name} {cadet.gender === 'female' && <span className="text-pink-600 font-bold ml-1">(F)</span>}
                        </td>
                        <td className="border border-black px-3 py-2 text-center">{cadet.cadet_branch}</td>
                        <td className="border border-black px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={cadet.is_present}
                            onChange={(e) => handlePresentChange(index, e.target.checked)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                          />
                        </td>
                        {markGroups.flatMap(group =>
                          group.marks.map(mark => (
                            <td key={mark.id} className={`border border-black px-2 py-1 text-center ${!cadet.is_present ? "bg-gray-200" : ""}`}>
                              <input
                                type="number"
                                min={0}
                                max={mark.estimate_mark}
                                step={0.01}
                                value={cadet.is_present ? (cadet.marks[mark.id] || 0) : 0}
                                onChange={(e) => {
                                  const inputValue = parseFloat(e.target.value) || 0;
                                  const clampedValue = Math.min(Math.max(0, inputValue), mark.estimate_mark);
                                  handleMarkChange(index, mark.id, clampedValue);
                                }}
                                disabled={!cadet.is_present}
                                className={`w-full px-2 py-1 border rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!cadet.is_present
                                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                  : "border-gray-300 bg-white"
                                  }`}
                                placeholder="0"
                              />
                            </td>
                          ))
                        )}
                        <td className="border border-black px-3 py-2 text-center font-bold text-blue-700">
                          {(Number(rowTotal) || 0).toFixed(2)}
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
        <button type="submit" className={`px-6 py-2 text-white rounded-xl flex items-center gap-2 ${alreadyExists ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`} disabled={loading || alreadyExists}>
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Result" : "Save Result")}
        </button>
      </div>
    </form>
  );
}
