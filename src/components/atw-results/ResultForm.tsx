/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Label from "@/components/form/Label";
import { cadetService } from "@/libs/services/cadetService";
import { commonService } from "@/libs/services/commonService";
import { atwResultService } from "@/libs/services/atwResultService";
import { atwSubjectService } from "@/libs/services/atwSubjectService";
import { atwInstructorAssignSubjectService } from "@/libs/services/atwInstructorAssignSubjectService";
import { atwSubjectGroupService } from "@/libs/services/atwSubjectGroupService";
import { useAuth } from "@/libs/hooks/useAuth";
import { Icon } from "@iconify/react";
import type { SystemCourse, SystemSemester, SystemProgram, SystemExam, AtwSubjectsModuleMarksheetMark, AtwSubjectModule } from "@/libs/types/system";
import type { AtwResult } from "@/libs/types/atwResult";
import Link from "next/link";

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
  marks: { [markId: number]: number | string };
}

// Group marks by type
interface MarkGroup {
  type: string;
  marks: AtwSubjectsModuleMarksheetMark[];
}

export default function ResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
  const { user, userIsSystemAdmin } = useAuth();
  const [formData, setFormData] = useState({
    course_id: 0,
    semester_id: 0,
    program_id: 0,
    exam_type_id: 0,
    atw_subject_id: 0, // This will store the Subject Module ID
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
  const [existingResultId, setExistingResultId] = useState<number | null>(null);

  // Check if record already exists
  useEffect(() => {
    const checkExistence = async () => {
      if (isEdit) return; // Don't check existence in edit mode
      
      if (
        formData.course_id &&
        formData.semester_id &&
        formData.program_id &&
        formData.exam_type_id &&
        formData.atw_subject_id &&
        formData.instructor_id
      ) {
        try {
          const { exists, id } = await atwResultService.checkExistence({
            course_id: formData.course_id,
            semester_id: formData.semester_id,
            program_id: formData.program_id,
            exam_type_id: formData.exam_type_id,
            atw_subject_id: formData.atw_subject_id, // This is the module ID
            instructor_id: formData.instructor_id
          });

          if (exists) {
            setAlreadyExists(true);
            setExistingResultId(id ?? null);
            if (error !== "This result has already been entered for the selected criteria.") {
              setError("This result has already been entered for the selected criteria.");
            }
          } else {
            setAlreadyExists(false);
            setExistingResultId(null);
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
  const [exams, setExams] = useState<SystemExam[]>([]);
  const [subjectMappings, setSubjectMappings] = useState<AtwSubjectModule[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingCadets, setLoadingCadets] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  // Selected subject for marks
  const [selectedSubjectMapping, setSelectedSubjectMapping] = useState<AtwSubjectModule | null>(null);
  const [markGroups, setMarkGroups] = useState<MarkGroup[]>([]);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const options = await commonService.getResultOptions();

        if (options) {
          let coursesList = options.courses;

          if (!userIsSystemAdmin && user?.id) {
            // Fetch UNIQUE courses from instructor assignments
            try {
              const res = await atwInstructorAssignSubjectService.getAll({
                instructor_id: user.id,
                per_page: 1000
              });
              
              if (res && res.data && res.data.length > 0) {
                const assignedCourseIds = new Set(res.data.map((as: any) => Number(as.course_id)));
                coursesList = options.courses.filter(c => assignedCourseIds.has(Number(c.id)));
              } else {
                // Try alternate method
                const instructorAssignments = await atwInstructorAssignSubjectService.getByInstructor(user.id);
                if (instructorAssignments && instructorAssignments.length > 0) {
                  const assignedCourseIds = new Set(instructorAssignments.map((as: any) => Number(as.course_id)));
                  coursesList = options.courses.filter(c => assignedCourseIds.has(Number(c.id)));
                }
              }
            } catch (err) {
              console.error("Failed to fetch instructor assignments for course filtering:", err);
            }
          }

          setCourses(coursesList);
          setPrograms(options.programs);
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
  }, [user, userIsSystemAdmin]);

  // Logic to load subject mappings based on context
  const loadSubjects = useCallback(async () => {
    if (!formData.course_id || !formData.semester_id || !formData.program_id) {
      setSubjectMappings([]);
      return;
    }

    try {
      if (userIsSystemAdmin) {
        // Admin: Load subjects available for this Semester + Program
        const response = await atwSubjectGroupService.getAllSubjectGroups({
          semester_id: formData.semester_id,
          program_id: formData.program_id,
          per_page: 500,
        });

        const modules: AtwSubjectModule[] = response.data
          .map(g => g.module)
          .filter((m): m is AtwSubjectModule => !!m && !!m.id);

        const uniqueModules = modules.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setSubjectMappings(uniqueModules);
      } else if (user?.id) {
        // Instructor: Load assigned subjects from service
        const response = await atwInstructorAssignSubjectService.getAll({
          instructor_id: user.id,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          program_id: formData.program_id,
          per_page: 500
        });

        let modules: AtwSubjectModule[] = response.data
          .map((as: any) => as.subject || as.module || (as.subject_id ? { id: as.subject_id, ...as.subject } : null))
          .filter((m: any) => m && m.id && (m.subject_name || m.name));

        // Fallback to user object if service returns empty
        if (modules.length === 0 && (user as any).atw_assigned_subjects) {
          modules = (user as any).atw_assigned_subjects
            .filter((as: any) => 
              Number(as.course_id) === Number(formData.course_id) &&
              Number(as.semester_id) === Number(formData.semester_id) &&
              Number(as.program_id) === Number(formData.program_id)
            )
            .map((as: any) => as.subject || as.module)
            .filter((m: any) => m && m.id && (m.subject_name || m.name));
        }

        setSubjectMappings(modules);
      }
    } catch (err) {
      console.error("Failed to load subjects:", err);
    }
  }, [formData.course_id, formData.semester_id, formData.program_id, userIsSystemAdmin, user]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    if (formData.atw_subject_id) {
      const module = subjectMappings.find(s => s.id === formData.atw_subject_id);
      setSelectedSubjectMapping(module || null);
      
      if (module?.marksheet?.marks) {
        const groups: { [key: string]: AtwSubjectsModuleMarksheetMark[] } = {};
        module.marksheet.marks.forEach(mark => {
          const type = mark.type || "Other";
          if (!groups[type]) groups[type] = [];
          groups[type].push(mark);
        });
        setMarkGroups(Object.entries(groups).map(([type, marks]) => ({ type, marks })));
        setFormData(prev => ({ ...prev, atw_subject_module_id: module.id } as any));
      } else {
        setMarkGroups([]);
        setFormData(prev => ({ ...prev, atw_subject_module_id: 0 } as any));
      }
    } else {
      setSelectedSubjectMapping(null);
      setMarkGroups([]);
      setFormData(prev => ({ ...prev, atw_subject_module_id: 0 } as any));
    }
  }, [formData.atw_subject_id, subjectMappings]);

  // Auto-load cadets when filters change
  useEffect(() => {
    const loadCadets = async () => {
      // Only load if required filters are selected
      if (!formData.course_id || !formData.semester_id || !formData.program_id || !formData.atw_subject_id) {
        setCadetRows([]);
        return;
      }

      try {
        setLoadingCadets(true);

        // Get ALL cadets assigned to this course, semester, program where is_current is true
        const cadetsRes = await cadetService.getAllCadets({
          per_page: 500,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          program_id: formData.program_id,
          is_current: 1
        });
        
        const cadetsList = cadetsRes.data;

        // Create cadet rows
        const rows: CadetRow[] = cadetsList.filter(c => c).map(cadet => {
          const currentRank = cadet.assigned_ranks?.find((ar: any) => ar.is_current || ar.rank)?.rank;
          const branchName =
            cadet.assigned_branchs?.find((ab: any) => ab.is_current)?.branch?.name ||
            cadet.assigned_branchs?.[0]?.branch?.name ||
            "N/A";
          return {
            cadet_id: cadet.id,
            cadet_bd_no: cadet.bd_no || cadet.cadet_number || "",
            cadet_name: cadet.name,
            cadet_rank: currentRank?.short_name || currentRank?.name || "-",
            cadet_branch: branchName,
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

    if (!initialData) {
      loadCadets();
    }
  }, [formData.course_id, formData.semester_id, formData.program_id, formData.atw_subject_id, initialData]);

  // Populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        course_id: initialData.course_id,
        semester_id: initialData.semester_id,
        program_id: initialData.program_id,
        exam_type_id: initialData.exam_type_id,
        atw_subject_id: initialData.atw_subject_module_id || 0,
        instructor_id: initialData.instructor_id || 0,
        is_active: initialData.is_active,
      });

      if (initialData.result_getting_cadets && initialData.result_getting_cadets.length > 0) {
        const rows: CadetRow[] = initialData.result_getting_cadets.map(c => {
          const marks: { [markId: number]: number } = {};
          c.cadet_marks?.forEach(m => {
            marks[m.atw_subjects_module_marksheet_mark_id] = Number(m.achieved_mark) || 0;
          });
          const currentRank = c.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank;
          return {
            id: c.id,
            cadet_id: c.cadet_id,
            cadet_bd_no: c.cadet_bd_no,
            cadet_name: c.cadet?.name || "Unknown",
            cadet_rank: currentRank?.short_name || currentRank?.name || "-",
            cadet_branch: c.cadet?.assigned_branchs?.find((ab: any) => ab.is_current)?.branch?.name || c.cadet?.assigned_branchs?.[0]?.branch?.name || initialData.branch?.name || "N/A",
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

  // Fetch semesters when course changes
  useEffect(() => {
    if (!formData.course_id) {
      setSemesters([]);
      return;
    }
    const fetchSemesters = async () => {
      setLoadingSemesters(true);
      const semestersList = await commonService.getSemestersByCourse(formData.course_id);
      setSemesters(semestersList);
      if (semestersList.length === 1) {
        setFormData(prev => ({ ...prev, semester_id: semestersList[0].id }));
      } else if (semestersList.length > 0 && !isEdit) {
        setFormData(prev => ({ ...prev, semester_id: semestersList[0].id }));
      }
      setLoadingSemesters(false);
    };
    fetchSemesters();
  }, [formData.course_id, isEdit]);

  const handleChange = (field: string, value: any) => {
    if (field === 'course_id') {
      setFormData(prev => ({ ...prev, [field]: value, semester_id: 0 }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleMarkChange = (cadetIndex: number, markId: number, value: number | string) => {
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
        marks: isPresent ? updated[cadetIndex].marks : {}
      };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.course_id || !formData.semester_id || !formData.program_id || !formData.atw_subject_id) {
      setError("Please fill in all required fields.");
      return;
    }

    const moduleId = selectedSubjectMapping?.id;
    if (!moduleId) {
      setError("Critical Error: Linked module not found for this subject.");
      return;
    }

    try {
      const submitData = {
        ...formData,
        atw_subject_module_id: moduleId, // Ensure module ID is sent
        cadets: cadetRows.filter(c => c.cadet_id > 0).map(c => ({
          cadet_id: c.cadet_id,
          cadet_bd_no: c.cadet_bd_no,
          remarks: c.remarks || undefined,
          is_present: c.is_present,
          absent_reason: c.is_present ? undefined : c.absent_reason,
          is_active: c.is_active,
          marks: Object.entries(c.marks).map(([markId, achievedMark]) => ({
            atw_subject_module_id: moduleId,
            atw_subjects_module_marksheet_mark_id: parseInt(markId),
            achieved_mark: typeof achievedMark === "number" ? achievedMark : (parseFloat(achievedMark as string) || 0),
            is_active: true,
          })),
        })),
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} result`);
    }
  };

  const filtersSelected = formData.course_id && formData.semester_id && formData.program_id;
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
              <select value={formData.course_id} onChange={(e) => handleChange("course_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" required disabled={isEdit}>
                <option value={0}>Select Course</option>
                {courses.map(course => (<option key={course.id} value={course.id}>{course.name} ({course.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Semester <span className="text-red-500">*</span></Label>
              <select
                value={formData.semester_id}
                onChange={(e) => handleChange("semester_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                required
                disabled={isEdit || !formData.course_id || loadingSemesters || (!!formData.course_id && !loadingSemesters && semesters.length === 0) || (semesters.length === 1)}
              >
                {loadingSemesters ? (
                  <option value={0}>Loading semesters...</option>
                ) : !formData.course_id ? (
                  <option value={0}>Select Course First</option>
                ) : semesters.length === 0 ? (
                  <option value={0}>No semester on this course</option>
                ) : semesters.length === 1 ? (
                  <option value={semesters[0].id}>{semesters[0].name} ({semesters[0].code})</option>
                ) : (
                  <>
                    <option value={0}>Select Semester</option>
                    {semesters.map(semester => (
                      <option key={semester.id} value={semester.id}>{semester.name} ({semester.code})</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div>
              <Label>Program <span className="text-red-500">*</span></Label>
              <select value={formData.program_id} onChange={(e) => handleChange("program_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" required disabled={isEdit}>
                <option value={0}>Select Program</option>
                {programs.map(program => (<option key={program.id} value={program.id}>{program.name} ({program.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Exam Type <span className="text-red-500">*</span></Label>
              <select value={formData.exam_type_id} onChange={(e) => handleChange("exam_type_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" required disabled={isEdit}>
                <option value={0}>Select Exam Type</option>
                {exams.map(exam => (<option key={exam.id} value={exam.id}>{exam.name} ({exam.code})</option>))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Subject <span className="text-red-500">*</span></Label>
              <select value={formData.atw_subject_id} onChange={(e) => handleChange("atw_subject_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 font-semibold disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" required disabled={isEdit}>
                <option value={0}>Select Subject</option>
                {subjectMappings.map(s => (<option key={s.id} value={s.id}>{s.subject_name || (s as any).name} ({s.subject_code || (s as any).code})</option>))}
              </select>
            </div>
          </div>
        </div>

        {/* Marks Table */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="hugeicons:note-edit" className="w-5 h-5 text-blue-500" />
            Result Marks Entry
            {selectedSubjectMapping && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ~ {selectedSubjectMapping.subject_name || (selectedSubjectMapping as any).name} ({selectedSubjectMapping.subject_code || (selectedSubjectMapping as any).code})
              </span>
            )}
          </h3>

          {!filtersSelected ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
              <p>Please select Course, Semester, and Program to load cadets</p>
            </div>
          ) : !subjectSelected ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:book-02" className="w-10 h-10 mx-auto mb-2" />
              <p>Please select a Subject to see mark columns</p>
            </div>
          ) : alreadyExists ? (
            <div className="text-center py-12 text-red-500 bg-red-50 rounded-lg border border-red-100">
              <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-2" />
              <p className="font-semibold text-lg uppercase tracking-wider">Already Result Map inputed</p>
              <p className="text-sm">A result for these criteria already exists in the system.</p>
              {existingResultId && (
                <div className="mt-3">
                  <Link href={`/atw/results/${existingResultId}/edit`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                    Edit Existing Result
                  </Link>
                </div>
              )}
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
                    <th className="border border-black px-3 py-2 text-center" rowSpan={3}>SL</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={3}>BD NO.</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={3}>RANK</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={3}>NAME</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={3}>BRANCH</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={3}>PRESENT</th>
                    {markGroups.map(group => (
                      <th
                        key={group.type}
                        className="border border-black px-3 py-2 text-center font-semibold uppercase"
                        colSpan={group.marks.reduce((acc, m) => acc + (Number(m.estimate_mark) !== Number(m.percentage) ? 2 : 1), 0)}
                      >
                        {group.type}
                      </th>
                    ))}
                    <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={3}>TOTAL</th>
                  </tr>
                  {/* Second header row - Individual marks */}
                  <tr>
                    {markGroups.flatMap(group =>
                      group.marks.map(mark => (
                        <th key={mark.id}
                          className="border border-black px-2 py-2 text-center"
                          colSpan={Number(mark.estimate_mark) !== Number(mark.percentage) ? 2 : 1}
                        >
                          <div className="text-xs font-medium uppercase">{mark.name}</div>
                        </th>
                      ))
                    )}
                  </tr>
                  {/* Third header row - Sub-labels */}
                  <tr>
                    {markGroups.flatMap(group =>
                      group.marks.map(mark => {
                        if (Number(mark.estimate_mark) !== Number(mark.percentage)) {
                          return (
                            <React.Fragment key={`sub-${mark.id}`}>
                              <th className="border border-black px-1 py-1 text-center w-[80px] min-w-[80px] max-w-[80px]">{Number(mark.estimate_mark).toFixed(0)}</th>
                              <th className="border border-black px-1 py-1 text-center w-[80px] min-w-[80px] max-w-[80px]">{Number(mark.percentage).toFixed(0)}</th>
                            </React.Fragment>
                          );
                        } else {
                          return (
                            <th key={`sub-${mark.id}`} className="border border-black px-1 py-1 text-center w-[100px] min-w-[100px] max-w-[100px]">
                              {Number(mark.percentage).toFixed(0)}
                            </th>
                          );
                        }
                      })
                    )}
                  </tr>
                </thead>
                <tbody>
                  {cadetRows.map((cadet, index) => {
                    // Calculate row total
                    const rowTotal = markGroups.reduce((acc, group) => {
                      return acc + group.marks.reduce((groupAcc, mark) => {
                        const markVal = cadet.marks[mark.id];
                        const inputMark = markVal !== undefined && markVal !== "" ? parseFloat(String(markVal)) || 0 : 0;
                        let adjustedMark = inputMark;

                        // If estimate_mark and percentage are different, convert input to percentage equivalent
                        if (Number(mark.estimate_mark) !== Number(mark.percentage) && mark.estimate_mark > 0) {
                          adjustedMark = (inputMark / mark.estimate_mark) * mark.percentage;
                        }

                        return groupAcc + adjustedMark;
                      }, 0);
                    }, 0);

                    return (
                      <tr key={cadet.cadet_id} className="hover:bg-gray-50 transition-colors">
                        <td className="border border-black px-3 py-2 text-center font-medium">{index + 1}</td>
                        <td className="border border-black px-3 py-2 text-center">{cadet.cadet_bd_no}</td>
                        <td className="border border-black px-3 py-2 text-center">{cadet.cadet_rank}</td>
                        <td className={`border border-black px-3 py-2 font-medium ${!cadet.is_present ? 'text-red-500 italic' : ''}`}>
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
                          group.marks.map(mark => {
                            const markVal = cadet.marks[mark.id];
                            const inputMark = markVal !== undefined && markVal !== "" ? parseFloat(String(markVal)) || 0 : 0;
                            const isSplit = Number(mark.estimate_mark) !== Number(mark.percentage);

                            if (isSplit) {
                              const convertedValue = mark.estimate_mark > 0 ? (inputMark / mark.estimate_mark) * mark.percentage : 0;
                              return (
                                <React.Fragment key={mark.id}>
                                  <td className={`border border-black px-2 py-1 text-center w-[80px] min-w-[80px] max-w-[80px] ${!cadet.is_present ? "bg-gray-200" : ""}`}>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      pattern="[0-9]*\.?[0-9]*"
                                      value={cadet.is_present ? (cadet.marks[mark.id] !== undefined ? cadet.marks[mark.id] : "") : ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "") {
                                          handleMarkChange(index, mark.id, "");
                                          return;
                                        }
                                        if (/^\d*\.?\d*$/.test(val)) {
                                          const inputValue = parseFloat(val);
                                          if (!isNaN(inputValue) && inputValue > mark.estimate_mark) {
                                            handleMarkChange(index, mark.id, mark.estimate_mark);
                                          } else {
                                            handleMarkChange(index, mark.id, val);
                                          }
                                        }
                                      }}
                                      onBlur={(e) => {
                                        const val = e.target.value;
                                        if (val !== "") {
                                          const parsed = parseFloat(val);
                                          if (!isNaN(parsed)) {
                                            handleMarkChange(index, mark.id, parsed);
                                          } else {
                                            handleMarkChange(index, mark.id, "");
                                          }
                                        }
                                      }}
                                      disabled={!cadet.is_present}
                                      className={`w-full px-2 py-1 border rounded text-center text-sm font-bold focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!cadet.is_present
                                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed border-transparent"
                                        : "border-gray-300 bg-white"
                                        }`}
                                      placeholder="0"
                                    />
                                  </td>
                                  <td className={`border border-black px-2 py-1 text-center text-gray-900 w-[80px] min-w-[80px] max-w-[80px] ${!cadet.is_present ? "bg-gray-200" : ""}`}>
                                    {convertedValue.toFixed(2)}
                                  </td>
                                </React.Fragment>
                              );
                            } else {
                              return (
                                <td key={mark.id} className={`border border-black px-2 py-1 text-center w-[100px] min-w-[100px] max-w-[100px] ${!cadet.is_present ? "bg-gray-200" : ""}`}>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="[0-9]*\.?[0-9]*"
                                    value={cadet.is_present ? (cadet.marks[mark.id] !== undefined ? cadet.marks[mark.id] : "") : ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "") {
                                        handleMarkChange(index, mark.id, "");
                                        return;
                                      }
                                      if (/^\d*\.?\d*$/.test(val)) {
                                        const inputValue = parseFloat(val);
                                        if (!isNaN(inputValue) && inputValue > mark.estimate_mark) {
                                          handleMarkChange(index, mark.id, mark.estimate_mark);
                                        } else {
                                          handleMarkChange(index, mark.id, val);
                                        }
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const val = e.target.value;
                                      if (val !== "") {
                                        const parsed = parseFloat(val);
                                        if (!isNaN(parsed)) {
                                          handleMarkChange(index, mark.id, parsed);
                                        } else {
                                          handleMarkChange(index, mark.id, "");
                                        }
                                      }
                                    }}
                                    disabled={!cadet.is_present}
                                    className={`w-full px-2 py-1 border rounded text-center text-sm font-bold focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!cadet.is_present
                                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed border-transparent"
                                      : "border-gray-300 bg-white"
                                      }`}
                                    placeholder="0"
                                  />
                                </td>
                              );
                            }
                          })
                        )}
                        <td className="border border-black px-3 py-2 text-center font-black">
                          {(Number(rowTotal) || 0).toFixed(2)} ~ {Math.ceil(Number(rowTotal) || 0)}
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
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-100 transition-colors" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className={`px-6 py-2 text-white rounded-xl flex items-center gap-2 shadow-md transition-all ${alreadyExists ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`} disabled={loading || alreadyExists}>
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Result" : "Save Result")}
        </button>
      </div>
    </form>
  );
}
